import type { WagonType } from '$lib/booking-capacity';
import { WAGON_CONFIG } from '$lib/booking-capacity';

/** Build start/end times from 10:00 through 16:00 using the wagon's interval. */
export function getWagonSlotTimes(type: WagonType): { start: string; end: string }[] {
	const interval = WAGON_CONFIG[type].intervalMinutes;
	const slots: { start: string; end: string }[] = [];
	for (let h = 10; h <= 15; h++) {
		for (let m = 0; m < 60; m += interval) {
			const startTotal = h * 60 + m;
			const endTotal = startTotal + interval;
			if (endTotal > 16 * 60) continue;
			const startH = Math.floor(startTotal / 60);
			const startM = startTotal % 60;
			const endH = Math.floor(endTotal / 60);
			const endM = endTotal % 60;
			slots.push({
				start: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
				end: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`
			});
		}
	}
	return slots;
}
