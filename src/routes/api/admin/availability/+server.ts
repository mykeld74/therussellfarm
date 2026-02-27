import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json();
	const { date, startTime, endTime, maxCapacity } = body;

	if (!date || !startTime || !endTime || !maxCapacity) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
		return json({ error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
	}
	if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
		return json({ error: 'Invalid time format (expected HH:MM or HH:MM:SS)' }, { status: 400 });
	}

	const cap = Number(maxCapacity);
	if (!Number.isFinite(cap) || cap < 1 || cap > 100) {
		return json({ error: 'Capacity must be between 1 and 100' }, { status: 400 });
	}

	const [slot] = await db
		.insert(availabilitySlots)
		.values({
			date,
			startTime,
			endTime,
			maxCapacity: cap,
			isActive: true
		})
		.returning();

	return json(slot, { status: 201 });
};
