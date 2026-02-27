import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings } from '$lib/server/db/schema';
import { user as userTable } from '$lib/server/db/auth.schema';
import { and, gte, eq, ne, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const todayStr = new Date().toISOString().split('T')[0];

	// Look ahead up to one year for the first slot with remaining capacity
	const oneYearAhead = new Date();
	oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);
	const toStr = oneYearAhead.toISOString().split('T')[0];

	const slots = await db
		.select({
			id: availabilitySlots.id,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
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
				gte(availabilitySlots.date, todayStr)
			)
		)
		.groupBy(availabilitySlots.id)
		.orderBy(availabilitySlots.date, availabilitySlots.startTime);

	const firstAvailable = slots.find((s) => Number(s.bookedCount) === 0 && s.date <= toStr);

	let phone: string | null = null;
	if (locals.user) {
		const [dbUser] = await db
			.select({ phone: userTable.phone })
			.from(userTable)
			.where(eq(userTable.id, locals.user.id))
			.limit(1);
		phone = dbUser?.phone ?? null;
	}

	return {
		user: locals.user ?? null,
		firstAvailableDate: firstAvailable?.date ?? null,
		phone
	};
};
