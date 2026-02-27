import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, count, and, ne, sql } from 'drizzle-orm';
import { generateBookingRef, formatDate, formatTime } from '$lib/server/booking-utils';
import { sendBookingConfirmation } from '$lib/server/email';

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

	if (!Number.isFinite(adults) || adults < 1 || adults > 8) {
		return json({ error: 'Adults must be between 1 and 8' }, { status: 400 });
	}
	if (!Number.isFinite(kids) || kids < 0 || kids > 10) {
		return json({ error: 'Children must be between 0 and 10' }, { status: 400 });
	}

	const parsedSlotId = Number(slotId);
	if (!Number.isFinite(parsedSlotId)) {
		return json({ error: 'Invalid slot' }, { status: 400 });
	}

	// Verify slot exists, is active, and has capacity
	const [slot] = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime,
			maxCapacity: availabilitySlots.maxCapacity,
			isActive: availabilitySlots.isActive,
			bookedCount: count(bookings.id)
		})
		.from(availabilitySlots)
		.leftJoin(
			bookings,
			and(eq(bookings.slotId, availabilitySlots.id), ne(bookings.status, 'cancelled'))
		)
		.where(eq(availabilitySlots.id, parsedSlotId))
		.groupBy(availabilitySlots.id);

	if (!slot || !slot.isActive) {
		error(400, 'Slot not available');
	}
	if (Number(slot.bookedCount) > 0) {
		error(409, 'Slot is fully booked');
	}

	const bookingRef = generateBookingRef();
	const userId = locals.user?.id ?? null;

	// Atomic conditional INSERT: only succeeds if no non-cancelled booking exists for this slot
	const inserted = await db.execute(sql`
		INSERT INTO bookings (booking_ref, slot_id, user_id, name, email, phone, party_size_adults, party_size_kids, status)
		SELECT ${bookingRef}, ${parsedSlotId}, ${userId}, ${trimmedName}, ${trimmedEmail}, ${trimmedPhone}, ${adults}, ${kids}, 'confirmed'
		WHERE NOT EXISTS (
			SELECT 1 FROM bookings WHERE slot_id = ${parsedSlotId} AND status != 'cancelled'
		)
		RETURNING id, booking_ref
	`);

	if (!inserted.rows.length) {
		error(409, 'Slot is fully booked');
	}

	const newRef = (inserted.rows[0] as { booking_ref: string }).booking_ref;

	try {
		await sendBookingConfirmation({
			to: trimmedEmail,
			name: trimmedName,
			bookingRef: newRef,
			date: formatDate(slot.date),
			startTime: formatTime(slot.startTime),
			endTime: formatTime(slot.endTime),
			adults,
			kids
		});
	} catch (emailErr) {
		console.error('Booking confirmation email failed:', emailErr);
	}

	return json({ bookingRef: newRef }, { status: 201 });
};
