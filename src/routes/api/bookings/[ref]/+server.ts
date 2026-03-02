import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendBookingCancelled } from '$lib/server/email';
import { formatDate, formatTime } from '$lib/server/booking-utils';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db
		.select({
			bookingRef: bookings.bookingRef,
			name: bookings.name,
			status: bookings.status,
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

	if (!result.length) error(404, 'Booking not found');
	return json(result[0]);
};

/** Authenticated users can cancel their own bookings; guests can cancel via ref only if no account is linked. */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const body = await request.json().catch(() => ({}));
	const { status } = body;

	if (status !== 'cancelled') {
		return json({ error: 'Only cancellation is allowed' }, { status: 400 });
	}

	// Fetch the booking with slot details before making any changes
	const [booking] = await db
		.select({
			id: bookings.id,
			userId: bookings.userId,
			name: bookings.name,
			email: bookings.email,
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

	// Auth check: logged-in users can only cancel their own bookings.
	// Guests (no session) can only cancel bookings that have no linked account.
	if (locals.user) {
		if (booking.userId !== locals.user.id) {
			error(403, 'Forbidden');
		}
	} else {
		if (booking.userId !== null) {
			error(401, 'Sign in to cancel this booking');
		}
	}

	const result = await db
		.update(bookings)
		.set({ status: 'cancelled' })
		.where(eq(bookings.bookingRef, params.ref))
		.returning({ bookingRef: bookings.bookingRef });

	if (!result.length) error(404, 'Booking not found');

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
};
