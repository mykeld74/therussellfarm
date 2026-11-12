import { WAGON_CONFIG, type WagonType } from '$lib/booking-capacity';

/** Minutes from midnight. Last slot must end by this time. */
const DEFAULT_WINDOW = { startMin: 10 * 60, endMin: 16 * 60 };
/** Sundays: horse from 10:00, tractor from noon. Last ride ends at 3:45. */
const SUNDAY_WINDOW = { startMin: 10 * 60, endMin: 15 * 60 + 45 };
const SUNDAY_TRACTOR_START = 12 * 60;
/** Wednesdays: horse-drawn only, every 30 minutes, noon through 4:00. */
const WEDNESDAY_WINDOW = { startMin: 12 * 60, endMin: 16 * 60 };
const WEDNESDAY_HORSE_INTERVAL = 30;

function weekday(dateStr: string): number | null {
	const [year, month, day] = dateStr.split('-').map(Number);
	if (!year || !month || !day) return null;
	return new Date(year, month - 1, day).getDay();
}

export function isSundayDate(dateStr: string): boolean {
	return weekday(dateStr) === 0;
}

export function isWednesdayDate(dateStr: string): boolean {
	return weekday(dateStr) === 3;
}

export function operatingWindow(date?: string, type?: WagonType): { startMin: number; endMin: number } {
	if (date && isWednesdayDate(date)) return WEDNESDAY_WINDOW;
	if (date && isSundayDate(date)) {
		if (type === 'tractor') return { startMin: SUNDAY_TRACTOR_START, endMin: SUNDAY_WINDOW.endMin };
		return SUNDAY_WINDOW;
	}
	return DEFAULT_WINDOW;
}

/** Horse rides are every 30 minutes on Wednesday; other days use the wagon default. */
export function slotIntervalMinutes(type: WagonType, date?: string): number {
	if (date && isWednesdayDate(date) && type === 'horse') return WEDNESDAY_HORSE_INTERVAL;
	return WAGON_CONFIG[type].intervalMinutes;
}

export function formatMinutes(total: number): string {
	const h24 = Math.floor(total / 60);
	const m = total % 60;
	const ampm = h24 >= 12 ? 'PM' : 'AM';
	const hour = h24 % 12 || 12;
	return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Label like "10:00 AM–4:00 PM" or "10:00 AM–3:45 PM". */
export function operatingWindowLabel(date?: string, type?: WagonType): string {
	const window = operatingWindow(date, type);
	return `${formatMinutes(window.startMin)}–${formatMinutes(window.endMin)}`;
}

function toTime(total: number): string {
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Slot start/end times for a wagon. Sundays and Wednesdays use their own windows. */
export function getWagonSlotTimes(
	type: WagonType,
	date?: string
): { start: string; end: string }[] {
	if (date && isWednesdayDate(date) && type !== 'horse') return [];

	const interval = slotIntervalMinutes(type, date);
	const { startMin, endMin } = operatingWindow(date, type);
	const slots: { start: string; end: string }[] = [];

	for (let start = startMin; start + interval <= endMin; start += interval) {
		slots.push({
			start: toTime(start),
			end: toTime(start + interval)
		});
	}

	return slots;
}

export function slotFitsOperatingWindow(
	date: string,
	startTime: string,
	endTime: string,
	type?: WagonType
): boolean {
	if (isWednesdayDate(date) && type === 'tractor') return false;

	const { startMin, endMin } = operatingWindow(date, type);
	const start = minutesOf(startTime);
	const end = minutesOf(endTime);
	if (start < startMin || end > endMin || end <= start) return false;
	if (isWednesdayDate(date)) return end - start === WEDNESDAY_HORSE_INTERVAL && start % 30 === 0;
	return true;
}

function minutesOf(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + (m || 0);
}
