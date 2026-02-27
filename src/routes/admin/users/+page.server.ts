import type { PageServerLoad } from './$types';
import { requireSuperAdmin } from '$lib/server/admin-guard';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireSuperAdmin(locals);

	const users = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			role: userTable.role,
			createdAt: userTable.createdAt
		})
		.from(userTable)
		.orderBy(asc(userTable.createdAt));

	return { users, currentUserId: locals.user!.id };
};
