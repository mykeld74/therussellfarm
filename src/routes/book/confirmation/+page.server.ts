import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	const ref = url.searchParams.get('ref');
	if (!ref) redirect(302, '/book');

	const result = await db
		.select({
			bookingRef: bookings.bookingRef,
			name: bookings.name,
			email: bookings.email,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			status: bookings.status,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(eq(bookings.bookingRef, ref))
		.limit(1);

	if (!result.length) error(404, 'Booking not found');

	return { booking: result[0], isLoggedIn: !!locals.user };
};
