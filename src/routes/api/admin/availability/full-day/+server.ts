import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';
import { eq } from 'drizzle-orm';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json().catch(() => ({}));
	const { date, maxCapacity } = body as { date?: string; maxCapacity?: number };

	if (!date) {
		return json({ error: 'Date is required' }, { status: 400 });
	}

	if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
		return json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
	}

	const cap = Number(maxCapacity ?? 1);
	if (!Number.isFinite(cap) || cap < 1 || cap > 100) {
		return json({ error: 'Capacity must be between 1 and 100' }, { status: 400 });
	}

	const slotTimes = getSlotTimes();

	const existing = await db
		.select({ startTime: availabilitySlots.startTime })
		.from(availabilitySlots)
		.where(eq(availabilitySlots.date, date));

	const existingSet = new Set(existing.map((r) => r.startTime));

	const toInsert: {
		date: string;
		startTime: string;
		endTime: string;
		maxCapacity: number;
		isActive: boolean;
	}[] = [];

	for (const { start, end } of slotTimes) {
		if (existingSet.has(start)) continue;
		toInsert.push({
			date,
			startTime: start,
			endTime: end,
			maxCapacity: cap,
			isActive: true
		});
	}

	if (toInsert.length === 0) {
		return json(
			{ message: 'No new slots to add; all 15-minute slots for this date already exist.', created: 0 },
			{ status: 200 }
		);
	}

	await db.insert(availabilitySlots).values(toInsert);

	return json(
		{
			message: `Created ${toInsert.length} slots for ${date} (every 15 minutes from 10:00 to 4:00).`,
			created: toInsert.length
		},
		{ status: 201 }
	);
};

