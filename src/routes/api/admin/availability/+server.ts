import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json();
	const { date, startTime, endTime, maxCapacity } = body;

	if (!date || !startTime || !endTime || !maxCapacity) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	const [slot] = await db
		.insert(availabilitySlots)
		.values({
			date,
			startTime,
			endTime,
			maxCapacity: parseInt(maxCapacity),
			isActive: true
		})
		.returning();

	return json(slot, { status: 201 });
};
