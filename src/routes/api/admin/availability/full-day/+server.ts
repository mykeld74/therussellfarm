import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';
import { and, eq } from 'drizzle-orm';
import { isWagonType, WAGON_CONFIG, type WagonType } from '$lib/booking-capacity';
import { getWagonSlotTimes, operatingWindowLabel } from '$lib/server/wagon-slots';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json().catch(() => ({}));
	const { date, maxCapacity, wagonType: rawType } = body as {
		date?: string;
		maxCapacity?: number;
		wagonType?: string;
	};

	if (!date) {
		return json({ error: 'Date is required' }, { status: 400 });
	}

	if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
		return json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
	}

	const wagonType: WagonType = isWagonType(rawType) ? rawType : 'horse';
	const defaultCap = WAGON_CONFIG[wagonType].seatCapacity;
	const interval = WAGON_CONFIG[wagonType].intervalMinutes;
	const cap = Number(maxCapacity ?? defaultCap);
	if (!Number.isFinite(cap) || cap < 1 || cap > 100) {
		return json({ error: 'Capacity must be between 1 and 100' }, { status: 400 });
	}

	const slotTimes = getWagonSlotTimes(wagonType, date);

	const existing = await db
		.select({ startTime: availabilitySlots.startTime })
		.from(availabilitySlots)
		.where(and(eq(availabilitySlots.date, date), eq(availabilitySlots.wagonType, wagonType)));

	const existingSet = new Set(existing.map((r) => r.startTime));

	const toInsert: {
		date: string;
		startTime: string;
		endTime: string;
		wagonType: WagonType;
		maxCapacity: number;
		isActive: boolean;
	}[] = [];

	for (const { start, end } of slotTimes) {
		if (existingSet.has(start)) continue;
		toInsert.push({
			date,
			startTime: start,
			endTime: end,
			wagonType,
			maxCapacity: cap,
			isActive: true
		});
	}

	if (toInsert.length === 0) {
		return json(
			{
				message: `No new slots to add; all ${interval}-minute ${WAGON_CONFIG[wagonType].shortLabel.toLowerCase()} slots for this date already exist.`,
				created: 0
			},
			{ status: 200 }
		);
	}

	await db.insert(availabilitySlots).values(toInsert);

	return json(
		{
			message: `Created ${toInsert.length} ${WAGON_CONFIG[wagonType].shortLabel.toLowerCase()} slots for ${date} (every ${interval} minutes, ${operatingWindowLabel(date)}).`,
			created: toInsert.length
		},
		{ status: 201 }
	);
};
