import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const dateFilter = url.searchParams.get('date') ?? '';
	const statusFilter = url.searchParams.get('status') ?? '';

	const conditions = [];
	if (dateFilter) {
		conditions.push(eq(availabilitySlots.date, dateFilter));
	}
	if (statusFilter && ['pending', 'confirmed', 'cancelled'].includes(statusFilter)) {
		conditions.push(eq(bookings.status, statusFilter as 'pending' | 'confirmed' | 'cancelled'));
	}

	const allBookings = await db
		.select({
			id: bookings.id,
			bookingRef: bookings.bookingRef,
			name: bookings.name,
			email: bookings.email,
			phone: bookings.phone,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			status: bookings.status,
			createdAt: bookings.createdAt,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(availabilitySlots.date), availabilitySlots.startTime);

	return { bookings: allBookings, dateFilter, statusFilter };
};
