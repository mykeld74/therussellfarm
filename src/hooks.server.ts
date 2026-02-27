import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

// The email address that is always guaranteed super_admin on first sign-in.
// Set SUPER_ADMIN_EMAIL in your environment to override.
const SUPER_ADMIN_EMAIL = env.SUPER_ADMIN_EMAIL ?? 'mike@bigbearded.dev';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;

		const [dbUser] = await db
			.select({ role: userTable.role })
			.from(userTable)
			.where(eq(userTable.id, session.user.id))
			.limit(1);

		let role = dbUser?.role ?? 'user';

		// Auto-promote the designated super admin on first sign-in if still 'user'
		if (session.user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && role === 'user') {
			await db
				.update(userTable)
				.set({ role: 'super_admin' })
				.where(eq(userTable.id, session.user.id));
			role = 'super_admin';
		}

		event.locals.role = role;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
