import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, count, and, ne } from 'drizzle-orm';
import { generateBookingRef, formatDate, formatTime } from '$lib/server/booking-utils';
import { sendBookingConfirmation } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const { slotId, name, email, phone, partySizeAdults, partySizeKids } = body;

	if (!slotId || !name || !email || !phone || !partySizeAdults) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const adults = Number(partySizeAdults);
	const kids = Number(partySizeKids ?? 0);

	if (!Number.isFinite(adults) || adults < 1 || adults > 8) {
		return json({ error: 'Adults must be between 1 and 8' }, { status: 400 });
	}
	if (!Number.isFinite(kids) || kids < 0 || kids > 10) {
		return json({ error: 'Children must be between 0 and 10' }, { status: 400 });
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
		.where(eq(availabilitySlots.id, slotId))
		.groupBy(availabilitySlots.id);

	if (!slot || !slot.isActive) {
		error(400, 'Slot not available');
	}
	// Each slot is for a single group; if there is any non-cancelled booking, it is full
	if (Number(slot.bookedCount) > 0) {
		error(409, 'Slot is fully booked');
	}

	// Generate unique booking ref
	const bookingRef = generateBookingRef();

	// Insert booking
	const [newBooking] = await db
		.insert(bookings)
		.values({
			bookingRef,
			slotId,
			userId: locals.user?.id ?? null,
			name,
			email,
			phone,
			partySizeAdults: adults,
			partySizeKids: kids,
			status: 'confirmed'
		})
		.returning({ id: bookings.id, bookingRef: bookings.bookingRef });

	// Send confirmation email (non-blocking)
	try {
		await sendBookingConfirmation({
			to: email,
			name,
			bookingRef: newBooking.bookingRef,
			date: formatDate(slot.date),
			startTime: formatTime(slot.startTime),
			endTime: formatTime(slot.endTime),
			adults,
			kids
		});
	} catch (emailErr) {
		console.error('Booking confirmation email failed:', emailErr);
	}

	return json({ bookingRef: newBooking.bookingRef }, { status: 201 });
};
