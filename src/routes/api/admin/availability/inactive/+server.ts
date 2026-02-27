import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { availabilitySlots } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin-guard';
import { and, eq, gte } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ locals }) => {
	requireAdmin(locals);

	const todayStr = new Date().toISOString().split('T')[0];

	const deleted = await db
		.delete(availabilitySlots)
		.where(and(eq(availabilitySlots.isActive, false), gte(availabilitySlots.date, todayStr)))
		.returning({ id: availabilitySlots.id });

	const count = deleted.length;

	return json(
		{
			message:
				count === 0
					? 'No inactive upcoming slots to delete.'
					: `Deleted ${count} inactive upcoming slot${count === 1 ? '' : 's'}.`,
			deletedCount: count
		},
		{ status: 200 }
	);
};

