import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { claimGuestBookings } from '$lib/server/booking-utils';

function safeRedirectPath(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/bookings';
	return value;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(302, safeRedirectPath(url.searchParams.get('next')));
	}
	return {};
};

async function linkGuestBookings(email: string): Promise<void> {
	const [found] = await db
		.select({ id: userTable.id })
		.from(userTable)
		.where(eq(userTable.email, email))
		.limit(1);
	if (found) await claimGuestBookings(found.id, email);
}

export const actions: Actions = {
	signIn: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const next = safeRedirectPath(formData.get('next')?.toString() ?? null);

		try {
			await auth.api.signInEmail({ body: { email, password } });
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Sign in failed. Check your credentials.', email });
			}
			return fail(500, { message: 'Unexpected error. Please try again.', email });
		}

		await linkGuestBookings(email);
		redirect(302, next);
	},

	signUp: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const phone = formData.get('phone')?.toString() ?? '';

		try {
			await auth.api.signUpEmail({ body: { email, password, name } });

			if (phone) {
				const [created] = await db
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.email, email))
					.limit(1);

				if (created) {
					await db.update(userTable).set({ phone }).where(eq(userTable.id, created.id));
				}
			}
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					message: error.message || 'Registration failed. Email may already be in use.',
					name, email, phone
				});
			}
			return fail(500, { message: 'Unexpected error. Please try again.', name, email, phone });
		}

		await linkGuestBookings(email);
		redirect(302, '/bookings');
	}
};
