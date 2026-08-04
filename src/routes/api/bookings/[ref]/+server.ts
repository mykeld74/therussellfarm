import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { sendBookingCancelled } from '$lib/server/email';
import { formatDate, formatTime } from '$lib/server/booking-utils';
import { partyFitsWagon, seatsForParty } from '$lib/booking-capacity';
import { bookedSeatsSql } from '$lib/server/booking-seats';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET: RequestHandler = async ({ params }) => {
	const result = await db
		.select({
			bookingRef: bookings.bookingRef,
			name: bookings.name,
			email: bookings.email,
			phone: bookings.phone,
			status: bookings.status,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			slotId: bookings.slotId,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(eq(bookings.bookingRef, params.ref))
		.limit(1);

	if (!result.length) error(404, 'Booking not found');
	return json(result[0]);
};

/**
 * Manage booking by reference (email link) or while signed in.
 * Possession of the booking ref is the capability token.
 * Supports: cancel, contact update, party size, reschedule (slotId).
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));

	const [booking] = await db
		.select({
			id: bookings.id,
			userId: bookings.userId,
			name: bookings.name,
			email: bookings.email,
			phone: bookings.phone,
			status: bookings.status,
			slotId: bookings.slotId,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(eq(bookings.bookingRef, params.ref))
		.limit(1);

	if (!booking) error(404, 'Booking not found');

	// --- Cancel ---
	if (body.status === 'cancelled') {
		if (booking.status === 'cancelled') {
			return json({ ok: true });
		}

		await db
			.update(bookings)
			.set({ status: 'cancelled' })
			.where(eq(bookings.bookingRef, params.ref));

		try {
			await sendBookingCancelled({
				to: booking.email,
				name: booking.name,
				bookingRef: params.ref,
				date: formatDate(booking.date),
				startTime: formatTime(booking.startTime),
				endTime: formatTime(booking.endTime),
				adults: booking.partySizeAdults,
				kids: booking.partySizeKids
			});
		} catch (emailErr) {
			console.error('Cancellation email failed:', emailErr);
		}

		return json({ ok: true });
	}

	if (booking.status === 'cancelled') {
		return json({ error: 'Cancelled bookings cannot be edited' }, { status: 400 });
	}

	// --- Contact / party / reschedule ---
	const updates: {
		name?: string;
		email?: string;
		phone?: string;
		partySizeAdults?: number;
		partySizeKids?: number;
		slotId?: number;
	} = {};

	if (typeof body.name === 'string') {
		const trimmedName = body.name.trim();
		if (trimmedName.length < 1 || trimmedName.length > 200) {
			return json({ error: 'Name must be between 1 and 200 characters' }, { status: 400 });
		}
		updates.name = trimmedName;
	}

	if (typeof body.email === 'string') {
		const trimmedEmail = body.email.trim().toLowerCase();
		if (!EMAIL_RE.test(trimmedEmail)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}
		updates.email = trimmedEmail;
	}

	if (typeof body.phone === 'string') {
		const trimmedPhone = body.phone.trim();
		if (trimmedPhone.length < 7 || trimmedPhone.length > 20) {
			return json({ error: 'Invalid phone number' }, { status: 400 });
		}
		updates.phone = trimmedPhone;
	}

	const nextAdults =
		body.partySizeAdults !== undefined ? Number(body.partySizeAdults) : booking.partySizeAdults;
	const nextKids =
		body.partySizeKids !== undefined ? Number(body.partySizeKids) : booking.partySizeKids;
	const partyChanging =
		body.partySizeAdults !== undefined || body.partySizeKids !== undefined;

	if (partyChanging) {
		if (!partyFitsWagon(nextAdults, nextKids)) {
			return json(
				{
					error:
						'Party must include at least 1 adult and fit one wagon (8 adults or 16 kids, or any mix).'
				},
				{ status: 400 }
			);
		}
		updates.partySizeAdults = nextAdults;
		updates.partySizeKids = nextKids;
	}

	const nextSlotId =
		body.slotId !== undefined ? Number(body.slotId) : booking.slotId;
	const slotChanging = body.slotId !== undefined && nextSlotId !== booking.slotId;

	if (body.slotId !== undefined) {
		if (!Number.isFinite(nextSlotId)) {
			return json({ error: 'Invalid slot' }, { status: 400 });
		}
		updates.slotId = nextSlotId;
	}

	const seatsNeeded = seatsForParty(nextAdults, nextKids);
	const capacityCheckNeeded = partyChanging || slotChanging;

	if (capacityCheckNeeded) {
		const [targetSlot] = await db
			.select({
				id: availabilitySlots.id,
				maxCapacity: availabilitySlots.maxCapacity,
				isActive: availabilitySlots.isActive,
				bookedSeats: bookedSeatsSql
			})
			.from(availabilitySlots)
			.leftJoin(
				bookings,
				and(
					eq(bookings.slotId, availabilitySlots.id),
					ne(bookings.status, 'cancelled'),
					ne(bookings.bookingRef, params.ref)
				)
			)
			.where(eq(availabilitySlots.id, nextSlotId))
			.groupBy(availabilitySlots.id)
			.limit(1);

		if (!targetSlot || !targetSlot.isActive) {
			return json({ error: 'Selected time slot is not available' }, { status: 400 });
		}

		const othersSeats = Number(targetSlot.bookedSeats);
		const remaining = targetSlot.maxCapacity - othersSeats;
		if (seatsNeeded > remaining) {
			return json(
				{ error: 'Not enough seats remaining on this wagon for your group' },
				{ status: 409 }
			);
		}

		// Atomic update with capacity re-check (neon-http: no transactions)
		const result = await db.execute(sql`
			UPDATE bookings SET
				name = COALESCE(${updates.name ?? null}, name),
				email = COALESCE(${updates.email ?? null}, email),
				phone = COALESCE(${updates.phone ?? null}, phone),
				party_size_adults = ${nextAdults},
				party_size_kids = ${nextKids},
				slot_id = ${nextSlotId}
			WHERE booking_ref = ${params.ref}
				AND status = 'confirmed'
				AND (
					SELECT COALESCE(SUM(party_size_adults * 2 + party_size_kids), 0)
					FROM bookings
					WHERE slot_id = ${nextSlotId}
						AND status != 'cancelled'
						AND booking_ref != ${params.ref}
				) + ${seatsNeeded} <= (
					SELECT max_capacity FROM availability_slots
					WHERE id = ${nextSlotId} AND is_active = true
				)
			RETURNING booking_ref
		`);

		if (!result.rows.length) {
			error(409, 'Not enough seats remaining on this wagon');
		}

		return json({ ok: true });
	}

	if (Object.keys(updates).length === 0) {
		return json({ error: 'No changes provided' }, { status: 400 });
	}

	// Contact-only update
	await db
		.update(bookings)
		.set(updates)
		.where(and(eq(bookings.bookingRef, params.ref), eq(bookings.status, 'confirmed')));

	return json({ ok: true });
};
