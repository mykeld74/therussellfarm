import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';
import { and, gte, lte } from 'drizzle-orm';
import {
	thanksgivingThursday,
	lastSundayBeforeChristmas,
	treeSeasonYear
} from '$lib/holiday-dates';
import { WAGON_CONFIG, WAGON_TYPES, type WagonType } from '$lib/booking-capacity';
import { getWagonSlotTimes } from '$lib/server/wagon-slots';

/** Friday after Thanksgiving, plus all Saturdays and Sundays through last Sunday before Christmas */
function getHolidayWeekendDates(year: number): string[] {
	const thanksgiving = thanksgivingThursday(year);

	const friAfterThanksgiving = new Date(thanksgiving);
	friAfterThanksgiving.setDate(thanksgiving.getDate() + 1);

	const satAfterThanksgiving = new Date(thanksgiving);
	satAfterThanksgiving.setDate(thanksgiving.getDate() + 2);

	const endDate = lastSundayBeforeChristmas(year);
	const dates: string[] = [];

	if (friAfterThanksgiving <= endDate) {
		dates.push(friAfterThanksgiving.toISOString().slice(0, 10));
	}

	let d = new Date(satAfterThanksgiving);
	while (d <= endDate) {
		const day = d.getDay();
		if (day === 0 || day === 6) dates.push(d.toISOString().slice(0, 10));
		d.setDate(d.getDate() + 1);
	}

	return dates;
}

export const POST: RequestHandler = async ({ locals }) => {
	requireAdmin(locals);

	const year = treeSeasonYear();
	const dates = getHolidayWeekendDates(year);

	const minDate = dates[0];
	const maxDate = dates[dates.length - 1];

	const existing = await db
		.select({
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			wagonType: availabilitySlots.wagonType
		})
		.from(availabilitySlots)
		.where(and(gte(availabilitySlots.date, minDate), lte(availabilitySlots.date, maxDate)));

	const existingSet = new Set(existing.map((r) => `${r.date}_${r.startTime}_${r.wagonType}`));

	const toInsert: {
		date: string;
		startTime: string;
		endTime: string;
		wagonType: WagonType;
		maxCapacity: number;
		isActive: boolean;
	}[] = [];

	for (const wagonType of WAGON_TYPES) {
		const maxCapacity = WAGON_CONFIG[wagonType].seatCapacity;
		for (const date of dates) {
			const slotTimes = getWagonSlotTimes(wagonType, date);
			for (const { start, end } of slotTimes) {
				if (existingSet.has(`${date}_${start}_${wagonType}`)) continue;
				toInsert.push({
					date,
					startTime: start,
					endTime: end,
					wagonType,
					maxCapacity,
					isActive: true
				});
			}
		}
	}

	if (toInsert.length === 0) {
		return json({
			message: 'No new slots to add; all holiday slots already exist for both wagons.',
			created: 0,
			dates,
			year
		});
	}

	await db.insert(availabilitySlots).values(toInsert);

	return json({
		message: `Created ${toInsert.length} holiday availability slots (horse every 15 min, tractor every 30 min).`,
		created: toInsert.length,
		dates,
		year
	});
};
