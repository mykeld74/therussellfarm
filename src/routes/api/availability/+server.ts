import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings } from '$lib/server/db/schema';
import { and, gte, lte, eq, ne, count } from 'drizzle-orm';
import { bookedSeatsSql } from '$lib/server/booking-seats';

export const GET: RequestHandler = async ({ url }) => {
	const from = url.searchParams.get('from');
	const to = url.searchParams.get('to');

	if (!from || !to) {
		return json({ error: 'from and to params required' }, { status: 400 });
	}

	const slots = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime,
			maxCapacity: availabilitySlots.maxCapacity,
			bookedCount: count(bookings.id),
			bookedSeats: bookedSeatsSql
		})
		.from(availabilitySlots)
		.leftJoin(
			bookings,
			and(eq(bookings.slotId, availabilitySlots.id), ne(bookings.status, 'cancelled'))
		)
		.where(
			and(
				eq(availabilitySlots.isActive, true),
				gte(availabilitySlots.date, from),
				lte(availabilitySlots.date, to)
			)
		)
		.groupBy(availabilitySlots.id)
		.orderBy(availabilitySlots.date, availabilitySlots.startTime);

	const slotsWithRemaining = slots.map((s) => {
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

	return json(slotsWithRemaining);
};
