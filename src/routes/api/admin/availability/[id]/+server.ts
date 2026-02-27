import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin-guard';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);

	const id = Number(params.id);
	if (!Number.isFinite(id)) return json({ error: 'Invalid id' }, { status: 400 });

	const body = await request.json();

	const allowed: Partial<Record<string, unknown>> = {};
	if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;
	if (typeof body.maxCapacity === 'number' && Number.isFinite(body.maxCapacity) && body.maxCapacity > 0) {
		allowed.maxCapacity = body.maxCapacity;
	}
	if (typeof body.date === 'string') allowed.date = body.date;
	if (typeof body.startTime === 'string') allowed.startTime = body.startTime;
	if (typeof body.endTime === 'string') allowed.endTime = body.endTime;

	if (Object.keys(allowed).length === 0) {
		return json({ error: 'No valid fields provided' }, { status: 400 });
	}

	const [updated] = await db
		.update(availabilitySlots)
		.set(allowed)
		.where(eq(availabilitySlots.id, id))
		.returning();

	if (!updated) error(404, 'Slot not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);

	const id = Number(params.id);
	if (!Number.isFinite(id)) return json({ error: 'Invalid id' }, { status: 400 });

	await db.delete(availabilitySlots).where(eq(availabilitySlots.id, id));
	return new Response(null, { status: 204 });
};
