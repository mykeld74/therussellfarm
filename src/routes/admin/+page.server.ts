import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { gte, count, eq, ne, and, sql } from 'drizzle-orm';
import { bookedSeatsSql } from '$lib/server/booking-seats';

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
			bookedSeats: bookedSeatsSql,
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
		const bookedSeats = Number(s.bookedSeats);
		const remaining = Math.max(0, s.maxCapacity - bookedSeats);
		return {
			...s,
			bookedCount,
			bookedSeats,
			remaining
		};
	});

	const bookedSlots = mappedSlots.filter((s) => s.bookedCount > 0).length;
	const availableSlots = mappedSlots.filter((s) => s.isActive && s.remaining > 0).length;

	return {
		upcomingSlots: mappedSlots,
		bookedSlots,
		availableSlots
	};
};
