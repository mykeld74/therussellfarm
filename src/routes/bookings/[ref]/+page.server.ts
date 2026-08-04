import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [booking] = await db
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

	if (!booking) error(404, 'Booking not found');

	return { booking, isLoggedIn: !!locals.user };
};
