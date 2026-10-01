import { WAGON_CONFIG, type WagonType } from '$lib/booking-capacity';

/** Minutes from midnight. Last slot must end by this time. */
const DEFAULT_WINDOW = { startMin: 10 * 60, endMin: 16 * 60 };
/** Sundays: first ride 12:30, last ride ends at 3:45. */
const SUNDAY_WINDOW = { startMin: 12 * 60 + 30, endMin: 15 * 60 + 45 };

export function isSundayDate(dateStr: string): boolean {
	const [year, month, day] = dateStr.split('-').map(Number);
	if (!year || !month || !day) return false;
	return new Date(year, month - 1, day).getDay() === 0;
}

export function operatingWindow(date?: string): { startMin: number; endMin: number } {
	if (date && isSundayDate(date)) return SUNDAY_WINDOW;
	return DEFAULT_WINDOW;
}

export function formatMinutes(total: number): string {
	const h24 = Math.floor(total / 60);
	const m = total % 60;
	const ampm = h24 >= 12 ? 'PM' : 'AM';
	const hour = h24 % 12 || 12;
	return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Label like "10:00 AM–4:00 PM" or "12:30 PM–3:45 PM". */
export function operatingWindowLabel(date?: string): string {
	const window = operatingWindow(date);
	return `${formatMinutes(window.startMin)}–${formatMinutes(window.endMin)}`;
}

function toTime(total: number): string {
	const h = Math.floor(total / 60);
	const m = total % 60;
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/** Slot start/end times for a wagon. Pass a date so Sundays use the shorter window. */
export function getWagonSlotTimes(
	type: WagonType,
	date?: string
): { start: string; end: string }[] {
	const interval = WAGON_CONFIG[type].intervalMinutes;
	const { startMin, endMin } = operatingWindow(date);
	const slots: { start: string; end: string }[] = [];

	for (let start = startMin; start + interval <= endMin; start += interval) {
		slots.push({
			start: toTime(start),
			end: toTime(start + interval)
		});
	}

	return slots;
}

export function slotFitsOperatingWindow(date: string, startTime: string, endTime: string): boolean {
	const { startMin, endMin } = operatingWindow(date);
	const start = minutesOf(startTime);
	const end = minutesOf(endTime);
	return start >= startMin && end <= endMin && end > start;
}

function minutesOf(time: string): number {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + (m || 0);
}
