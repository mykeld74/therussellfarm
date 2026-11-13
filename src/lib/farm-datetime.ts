import { FARM_TIMEZONE } from '$lib/reservations';

/** Format a Date as `YYYY-MM-DDTHH:mm` in the farm timezone for datetime-local inputs. */
export function toFarmDatetimeLocalValue(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: FARM_TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23'
	}).formatToParts(date);

	const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Parse a datetime-local value as farm-local wall time and return a UTC Date.
 * Example: `2026-12-01T09:00` → Dec 1 2026 09:00 America/New_York.
 */
export function farmDatetimeLocalToUtc(value: string): Date {
	const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
	if (!match) return new Date(NaN);

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const hour = Number(match[4]);
	const minute = Number(match[5]);

	// Binary search UTC instant whose farm-local parts match the wall clock.
	let low = Date.UTC(year, month - 1, day, hour, minute) - 36 * 60 * 60 * 1000;
	let high = Date.UTC(year, month - 1, day, hour, minute) + 36 * 60 * 60 * 1000;

	for (let i = 0; i < 40; i++) {
		const mid = Math.floor((low + high) / 2);
		const local = toFarmDatetimeLocalValue(new Date(mid));
		if (local === value) return new Date(mid);
		if (local < value) low = mid + 1;
		else high = mid - 1;
	}

	return new Date(NaN);
}

export function formatFarmDateTime(date: Date | string): string {
	const value = typeof date === 'string' ? new Date(date) : date;
	return value.toLocaleString('en-US', {
		timeZone: FARM_TIMEZONE,
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}
