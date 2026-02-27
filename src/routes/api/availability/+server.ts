import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings } from '$lib/server/db/schema';
import { and, gte, lte, eq, ne, count } from 'drizzle-orm';

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
			bookedCount: count(bookings.id)
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
		return {
			...s,
			bookedCount,
			// Each slot is for one group: remaining is 1 if unbooked, else 0
			remaining: bookedCount === 0 ? 1 : 0
		};
	});

	return json(slotsWithRemaining);
};
