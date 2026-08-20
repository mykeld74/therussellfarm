import { db } from '$lib/server/db';
import { pricing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { areReservationsOpen } from '$lib/reservations';

const SINGLE_PRICING_ID = 1;

/** YYYY-MM-DD when bookings open, or null if always open. */
export async function getAllowReservationsFrom(): Promise<string | null> {
	const [row] = await db
		.select({ allowReservationsFrom: pricing.allowReservationsFrom })
		.from(pricing)
		.where(eq(pricing.id, SINGLE_PRICING_ID))
		.limit(1);

	return row?.allowReservationsFrom ?? null;
}

export async function getReservationsStatus(now = new Date()): Promise<{
	allowReservationsFrom: string | null;
	reservationsOpen: boolean;
}> {
	const allowReservationsFrom = await getAllowReservationsFrom();
	return {
		allowReservationsFrom,
		reservationsOpen: areReservationsOpen(allowReservationsFrom, now)
	};
}
