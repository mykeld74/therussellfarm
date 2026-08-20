import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, count, and, gte, sql } from 'drizzle-orm';
import { generateBookingRef, formatDate, formatTime } from '$lib/server/booking-utils';
import { sendBookingConfirmation, sendFarmBookingScheduled } from '$lib/server/email';
import { partyFitsWagon, seatsForParty } from '$lib/booking-capacity';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const { slotId, name, email, phone, partySizeAdults, partySizeKids } = body;

	if (!slotId || !name || !email || !phone || !partySizeAdults) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const trimmedEmail = String(email).trim().toLowerCase();
	if (!EMAIL_RE.test(trimmedEmail)) {
		return json({ error: 'Invalid email address' }, { status: 400 });
	}

	const trimmedName = String(name).trim();
	if (trimmedName.length < 1 || trimmedName.length > 200) {
		return json({ error: 'Name must be between 1 and 200 characters' }, { status: 400 });
	}

	const trimmedPhone = String(phone).trim();
	if (trimmedPhone.length < 7 || trimmedPhone.length > 20) {
		return json({ error: 'Invalid phone number' }, { status: 400 });
	}

	const adults = Number(partySizeAdults);
	const kids = Number(partySizeKids ?? 0);

	if (!partyFitsWagon(adults, kids)) {
		return json(
			{
				error:
					'Party must include at least 1 adult and fit one wagon (8 adults or 16 kids, or any mix).'
			},
			{ status: 400 }
		);
	}

	const seatsNeeded = seatsForParty(adults, kids);
	const parsedSlotId = Number(slotId);
	if (!Number.isFinite(parsedSlotId)) {
		return json({ error: 'Invalid slot' }, { status: 400 });
	}

	// Rate limit: max 3 bookings per email per hour
	const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
	const [rateCheck] = await db
		.select({ total: count() })
		.from(bookings)
		.where(and(eq(bookings.email, trimmedEmail), gte(bookings.createdAt, oneHourAgo)));
	if (Number(rateCheck?.total ?? 0) >= 3) {
		return json({ error: 'Too many bookings. Please try again later.' }, { status: 429 });
	}

	const [slot] = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime,
			maxCapacity: availabilitySlots.maxCapacity,
			isActive: availabilitySlots.isActive
		})
		.from(availabilitySlots)
		.where(eq(availabilitySlots.id, parsedSlotId))
		.limit(1);

	if (!slot || !slot.isActive) {
		error(400, 'Slot not available');
	}

	const bookingRef = generateBookingRef();
	const userId = locals.user?.id ?? null;

	// neon-http has no transactions — single conditional INSERT enforces seat capacity.
	const inserted = await db.execute(sql`
		INSERT INTO bookings (
			booking_ref, slot_id, user_id, name, email, phone,
			party_size_adults, party_size_kids, status
		)
		SELECT
			${bookingRef}, ${parsedSlotId}, ${userId}, ${trimmedName},
			${trimmedEmail}, ${trimmedPhone}, ${adults}, ${kids}, 'confirmed'
		WHERE EXISTS (
			SELECT 1 FROM availability_slots
			WHERE id = ${parsedSlotId} AND is_active = true
		)
		AND (
			SELECT COALESCE(SUM(party_size_adults * 2 + party_size_kids), 0)
			FROM bookings
			WHERE slot_id = ${parsedSlotId} AND status != 'cancelled'
		) + ${seatsNeeded} <= (
			SELECT max_capacity FROM availability_slots WHERE id = ${parsedSlotId}
		)
		RETURNING id, booking_ref
	`);

	if (!inserted.rows.length) {
		error(409, 'Not enough seats remaining on this wagon');
	}

	const newRef = (inserted.rows[0] as { booking_ref: string }).booking_ref;

	const emailPayload = {
		name: trimmedName,
		bookingRef: newRef,
		date: formatDate(slot.date),
		startTime: formatTime(slot.startTime),
		endTime: formatTime(slot.endTime),
		adults,
		kids,
		phone: trimmedPhone,
		email: trimmedEmail
	};

	try {
		await sendBookingConfirmation({
			to: trimmedEmail,
			...emailPayload
		});
	} catch (emailErr) {
		console.error('Booking confirmation email failed:', emailErr);
	}

	try {
		await sendFarmBookingScheduled(emailPayload);
	} catch (emailErr) {
		console.error('Farm booking notice email failed:', emailErr);
	}

	return json({ bookingRef: newRef }, { status: 201 });
};
