import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireSuperAdmin } from '$lib/server/admin-guard';

const VALID_ROLES = ['user', 'admin', 'super_admin'] as const;
type Role = (typeof VALID_ROLES)[number];

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireSuperAdmin(locals);

	const body = await request.json();
	const { role } = body as { role: Role };

	if (!VALID_ROLES.includes(role)) {
		return json({ error: 'Invalid role' }, { status: 400 });
	}

	// Prevent changing your own role
	if (params.id === locals.user!.id) {
		return json({ error: 'You cannot change your own role' }, { status: 400 });
	}

	const [updated] = await db
		.update(userTable)
		.set({ role })
		.where(eq(userTable.id, params.id))
		.returning({ id: userTable.id, role: userTable.role });

	if (!updated) error(404, 'User not found');
	return json(updated);
};
