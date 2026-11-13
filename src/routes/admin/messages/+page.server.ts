import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: bookings.id,
			name: bookings.name,
			email: bookings.email,
			bookingRef: bookings.bookingRef,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(eq(bookings.status, 'confirmed'))
		.orderBy(asc(availabilitySlots.date), asc(availabilitySlots.startTime), asc(bookings.name));

	const bookedDates = [...new Set(rows.map((row) => row.date))];

	const uniqueByEmail = new Map<string, { email: string; name: string }>();
	for (const row of rows) {
		const key = row.email.trim().toLowerCase();
		if (!key || uniqueByEmail.has(key)) continue;
		uniqueByEmail.set(key, { email: row.email.trim(), name: row.name });
	}

	return {
		guests: rows,
		bookedDates,
		uniqueRecipientCount: uniqueByEmail.size
	};
};
