import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

/** User (or anyone with the ref) can cancel a booking. */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json().catch(() => ({}));
	const { status } = body;

	if (status !== 'cancelled') {
		return json({ error: 'Only cancellation is allowed' }, { status: 400 });
	}

	const result = await db
		.update(bookings)
		.set({ status: 'cancelled' })
		.where(eq(bookings.bookingRef, params.ref))
		.returning({ id: bookings.id });

	if (!result.length) error(404, 'Booking not found');
	return json({ ok: true });
};
