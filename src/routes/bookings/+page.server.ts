import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login?next=/bookings');

	const userBookings = await db
		.select({
			bookingRef: bookings.bookingRef,
			status: bookings.status,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			createdAt: bookings.createdAt,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(eq(bookings.userId, locals.user.id))
		.orderBy(desc(availabilitySlots.date));

	return { bookings: userBookings, user: locals.user };
};
