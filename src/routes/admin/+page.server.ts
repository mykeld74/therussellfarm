import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { gte, count, eq, ne, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().split('T')[0];

	const upcomingSlots = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime,
			maxCapacity: availabilitySlots.maxCapacity,
			isActive: availabilitySlots.isActive,
			bookedCount: count(bookings.id),
			bookingName: sql<string | null>`max(${bookings.name})`,
			bookingEmail: sql<string | null>`max(${bookings.email})`,
			bookingPhone: sql<string | null>`max(${bookings.phone})`
		})
		.from(availabilitySlots)
		.leftJoin(
			bookings,
			and(eq(bookings.slotId, availabilitySlots.id), ne(bookings.status, 'cancelled'))
		)
		.where(gte(availabilitySlots.date, today))
		.groupBy(availabilitySlots.id)
		.orderBy(availabilitySlots.date, availabilitySlots.startTime);

	const mappedSlots = upcomingSlots.map((s) => {
		const bookedCount = Number(s.bookedCount);
		return {
			...s,
			bookedCount,
			// One group per slot: remaining is 1 if unbooked, else 0
			remaining: bookedCount === 0 ? 1 : 0
		};
	});

	// Slots that have a confirmed booking
	const bookedSlots = mappedSlots.filter((s) => s.bookedCount > 0).length;

	// Active slots with no booking yet
	const availableSlots = mappedSlots.filter((s) => s.isActive && s.bookedCount === 0).length;

	return {
		upcomingSlots: mappedSlots,
		bookedSlots,
		availableSlots
	};
};
