import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings } from '$lib/server/db/schema';
import { gte, count, eq, ne, and } from 'drizzle-orm';
import { bookedSeatsSql } from '$lib/server/booking-seats';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().split('T')[0];

	const slots = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime,
			maxCapacity: availabilitySlots.maxCapacity,
			isActive: availabilitySlots.isActive,
			createdAt: availabilitySlots.createdAt,
			bookedCount: count(bookings.id),
			bookedSeats: bookedSeatsSql
		})
		.from(availabilitySlots)
		.leftJoin(
			bookings,
			and(eq(bookings.slotId, availabilitySlots.id), ne(bookings.status, 'cancelled'))
		)
		.where(gte(availabilitySlots.date, today))
		.groupBy(availabilitySlots.id)
		.orderBy(availabilitySlots.date, availabilitySlots.startTime);

	return {
		slots: slots.map((s) => {
			const bookedCount = Number(s.bookedCount);
			const bookedSeats = Number(s.bookedSeats);
			return {
				...s,
				bookedCount,
				bookedSeats,
				remaining: Math.max(0, s.maxCapacity - bookedSeats)
			};
		})
	};
};
