import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin-guard';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);

	const body = await request.json();
	const [updated] = await db
		.update(availabilitySlots)
		.set(body)
		.where(eq(availabilitySlots.id, parseInt(params.id)))
		.returning();

	if (!updated) error(404, 'Slot not found');
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin(locals);

	await db.delete(availabilitySlots).where(eq(availabilitySlots.id, parseInt(params.id)));
	return new Response(null, { status: 204 });
};
