import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/auth.schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(302, '/auth/login?next=/account');
	return { user: locals.user };
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/auth/login');

		const data = await request.formData();
		const name = (data.get('name') as string | null)?.trim() ?? '';

		if (name.length < 2) {
			return fail(400, { profileError: 'Name must be at least 2 characters.' });
		}

		await db.update(userTable).set({ name }).where(eq(userTable.id, locals.user.id));

		return { profileSuccess: true, updatedName: name };
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) redirect(302, '/auth/login');

		const data = await request.formData();
		const currentPassword = (data.get('currentPassword') as string | null) ?? '';
		const newPassword = (data.get('newPassword') as string | null) ?? '';
		const confirmPassword = (data.get('confirmPassword') as string | null) ?? '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'All fields are required.' });
		}

		if (newPassword.length < 8) {
			return fail(400, { passwordError: 'New password must be at least 8 characters.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match.' });
		}

		try {
			const result = await auth.api.changePassword({
				headers: request.headers,
				body: { currentPassword, newPassword, revokeOtherSessions: false }
			});
			if (!result) {
				return fail(400, { passwordError: 'Current password is incorrect.' });
			}
		} catch {
			return fail(400, { passwordError: 'Current password is incorrect.' });
		}

		return { passwordSuccess: true };
	}
};
