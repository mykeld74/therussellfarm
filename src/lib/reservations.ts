/** Farm calendar timezone for reservation open/close checks. */
export const FARM_TIMEZONE = 'America/New_York';

/** Today's calendar date in the farm timezone as YYYY-MM-DD. */
export function farmTodayString(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: FARM_TIMEZONE }).format(now);
}

/**
 * Reservations are open when `allowFrom` is null/empty, or today's farm date
 * is on or after that YYYY-MM-DD date.
 */
export function areReservationsOpen(
	allowFrom: string | null | undefined,
	now = new Date()
): boolean {
	if (!allowFrom) return true;
	return farmTodayString(now) >= allowFrom;
}

/** Human-readable open date for public messaging. */
export function formatReservationOpenDate(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}
