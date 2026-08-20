import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings, pricing } from '$lib/server/db/schema';
import { gte, count, eq, ne, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { bookedSeatsSql } from '$lib/server/booking-seats';
import { requireAdmin } from '$lib/server/admin-guard';
import { getAllowReservationsFrom } from '$lib/server/reservations';

const SINGLE_PRICING_ID = 1;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);

	const today = new Date().toISOString().split('T')[0];
	const allowReservationsFrom = (await getAllowReservationsFrom()) ?? '';

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
		allowReservationsFrom,
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

export const actions: Actions = {
	saveReservationsOpen: async ({ request, locals }) => {
		requireAdmin(locals);

		const form = await request.formData();
		const allowReservationsFrom = form.get('allowReservationsFrom')?.toString().trim() ?? '';

		if (allowReservationsFrom && !DATE_RE.test(allowReservationsFrom)) {
			return fail(400, {
				reservationsError: 'Allow reservations date must be a valid date.',
				allowReservationsFrom
			});
		}

		const value = allowReservationsFrom || null;

		await db
			.insert(pricing)
			.values({ id: SINGLE_PRICING_ID, allowReservationsFrom: value })
			.onConflictDoUpdate({
				target: pricing.id,
				set: { allowReservationsFrom: value, updatedAt: new Date() }
			});

		return {
			reservationsSuccess: true,
			allowReservationsFrom: allowReservationsFrom
		};
	}
};
