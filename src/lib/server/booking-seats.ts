import { sql } from 'drizzle-orm';
import { bookings } from '$lib/server/db/schema';

/** Sum of seat units from non-cancelled bookings in an aggregated query. */
export const bookedSeatsSql = sql<number>`
	COALESCE(SUM(${bookings.partySizeAdults} * 2 + ${bookings.partySizeKids}), 0)
`;
