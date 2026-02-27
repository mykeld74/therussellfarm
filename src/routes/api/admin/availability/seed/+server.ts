import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';
import { and, eq, gte, lte } from 'drizzle-orm';

/** 4th Thursday of November (US Thanksgiving) for the given year */
function thanksgivingThursday(year: number): Date {
	const nov1 = new Date(year, 10, 1); // month 10 = November
	const dayOfWeek = nov1.getDay(); // 0 = Sun, 4 = Thu
	const daysUntilFirstThu = (4 - dayOfWeek + 7) % 7;
	const firstThu = new Date(year, 10, 1 + daysUntilFirstThu);
	firstThu.setDate(firstThu.getDate() + 21);
	return firstThu;
}

/** Last Sunday before Christmas (Dec 25) for the given year */
function lastSundayBeforeChristmas(year: number): Date {
	const dec24 = new Date(year, 11, 24);
	while (dec24.getDay() !== 0) {
		dec24.setDate(dec24.getDate() - 1);
	}
	return dec24;
}

/** Friday after Thanksgiving, plus all Saturdays and Sundays from that weekend through the last Sunday before Christmas */
function getHolidayWeekendDates(year: number): string[] {
	const thanksgiving = thanksgivingThursday(year);

	// Friday after Thanksgiving
	const friAfterThanksgiving = new Date(thanksgiving);
	friAfterThanksgiving.setDate(thanksgiving.getDate() + 1);

	// Start weekend (Saturday) after Thanksgiving
	const satAfterThanksgiving = new Date(thanksgiving);
	satAfterThanksgiving.setDate(thanksgiving.getDate() + 2);

	const endDate = lastSundayBeforeChristmas(year);
	const dates: string[] = [];

	// Include the Friday after Thanksgiving
	if (friAfterThanksgiving <= endDate) {
		dates.push(friAfterThanksgiving.toISOString().slice(0, 10));
	}

	// Then all Saturdays and Sundays until the last Sunday before Christmas
	let d = new Date(satAfterThanksgiving);
	while (d <= endDate) {
		const day = d.getDay();
		if (day === 0 || day === 6) dates.push(d.toISOString().slice(0, 10));
		d.setDate(d.getDate() + 1);
	}

	return dates;
}

/** 15-minute slot start times from 10:00 to 15:45 (last slot ends at 16:00) */
function getSlotTimes(): { start: string; end: string }[] {
	const slots: { start: string; end: string }[] = [];
	for (let h = 10; h <= 15; h++) {
		for (let m = 0; m < 60; m += 15) {
			const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
			const endM = m + 15;
			const endH = endM === 60 ? h + 1 : h;
			const endMNorm = endM % 60;
			const end = `${endH.toString().padStart(2, '0')}:${endMNorm.toString().padStart(2, '0')}:00`;
			slots.push({ start, end });
		}
	}
	return slots;
}

export const POST: RequestHandler = async ({ locals }) => {
	requireAdmin(locals);

	const year = new Date().getFullYear();
	const dates = getHolidayWeekendDates(year);
	const slotTimes = getSlotTimes();

	const minDate = dates[0];
	const maxDate = dates[dates.length - 1];

	// Avoid duplicates: load existing slots in this range
	const existing = await db
		.select({ date: availabilitySlots.date, startTime: availabilitySlots.startTime })
		.from(availabilitySlots)
		.where(
			and(
				gte(availabilitySlots.date, minDate),
				lte(availabilitySlots.date, maxDate)
			)
		);
	const existingSet = new Set(existing.map((r) => `${r.date}_${r.startTime}`));

	const toInsert: { date: string; startTime: string; endTime: string; maxCapacity: number; isActive: boolean }[] = [];
	for (const date of dates) {
		for (const { start, end } of slotTimes) {
			if (existingSet.has(`${date}_${start}`)) continue;
			toInsert.push({
				date,
				startTime: start,
				endTime: end,
				// One group per slot
				maxCapacity: 1,
				isActive: true
			});
		}
	}

	if (toInsert.length === 0) {
		return json({
			message: 'No new slots to add; all holiday slots already exist.',
			created: 0,
			dates,
			year
		});
	}

	await db.insert(availabilitySlots).values(toInsert);

	return json({
		message: `Created ${toInsert.length} holiday availability slots.`,
		created: toInsert.length,
		dates,
		year
	});
};
