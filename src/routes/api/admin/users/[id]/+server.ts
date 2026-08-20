import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
	user as userTable,
	bookings,
	session as sessionTable,
	account as accountTable
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireSuperAdmin } from '$lib/server/admin-guard';
import { isProtectedAccountEmail } from '$lib/protected-accounts';

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

	const [existing] = await db
		.select({ id: userTable.id, email: userTable.email, role: userTable.role })
		.from(userTable)
		.where(eq(userTable.id, params.id))
		.limit(1);

	if (!existing) error(404, 'User not found');

	if (isProtectedAccountEmail(existing.email)) {
		return json(
			{ error: 'This account is protected and cannot have its role changed' },
			{ status: 403 }
		);
	}

	const [updated] = await db
		.update(userTable)
		.set({ role })
		.where(eq(userTable.id, params.id))
		.returning({ id: userTable.id, role: userTable.role });

	if (!updated) error(404, 'User not found');
	return json(updated);
};

async function deleteUserAccount(userId: string, currentUserId: string) {
	if (userId === currentUserId) {
		return json({ error: 'You cannot delete your own account' }, { status: 400 });
	}

	const [existing] = await db
		.select({ id: userTable.id, email: userTable.email })
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);

	if (!existing) error(404, 'User not found');

	if (isProtectedAccountEmail(existing.email)) {
		return json({ error: 'This account is protected and cannot be deleted' }, { status: 403 });
	}

	try {
		// Keep booking history; unlink the account
		await db.update(bookings).set({ userId: null }).where(eq(bookings.userId, userId));
		// Explicit cleanup (cascade should also handle these; do both for reliability)
		await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
		await db.delete(accountTable).where(eq(accountTable.userId, userId));

		const [deleted] = await db
			.delete(userTable)
			.where(eq(userTable.id, userId))
			.returning({ id: userTable.id });

		if (!deleted) error(404, 'User not found');
		return json({ ok: true, id: deleted.id });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Failed to delete account';
		console.error('Failed to delete user', userId, e);
		return json({ error: message }, { status: 500 });
	}
}

/** Prefer POST — some CDNs/proxies mishandle DELETE + auth redirects. */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	requireSuperAdmin(locals);

	const body = await request.json().catch(() => ({}));
	if ((body as { action?: string }).action !== 'delete') {
		return json({ error: 'Unsupported action' }, { status: 400 });
	}

	return deleteUserAccount(params.id, locals.user!.id);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireSuperAdmin(locals);
	return deleteUserAccount(params.id, locals.user!.id);
};
