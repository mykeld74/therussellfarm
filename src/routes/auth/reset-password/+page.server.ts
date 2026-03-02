import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const tokenError = url.searchParams.get('error');

	// If there's neither a token nor an error param, the user navigated here directly
	if (!token && !tokenError) {
		redirect(302, '/auth/forgot-password');
	}

	return { token, tokenError };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString() ?? '';
		const newPassword = data.get('newPassword')?.toString() ?? '';

		if (!token) {
			return fail(400, { message: 'Reset token is missing. Please request a new reset link.' });
		}

		if (newPassword.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' });
		}

		try {
			await auth.api.resetPassword({ body: { newPassword, token } });
		} catch (e) {
			if (e instanceof APIError) {
				return fail(400, { message: 'This reset link is invalid or has expired. Please request a new one.' });
			}
			return fail(500, { message: 'Unexpected error. Please try again.' });
		}

		redirect(302, '/auth/login?reset=1');
	}
};
