import type { Actions } from './$types';
import { auth } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ request }) => {
		const email = (await request.formData()).get('email')?.toString().trim() ?? '';

		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: '/auth/reset-password' }
			});
		} catch {
			// Silently swallow — don't leak whether the email exists in our system
		}

		// Always return sent:true to avoid confirming whether an email is registered
		return { sent: true };
	}
};
