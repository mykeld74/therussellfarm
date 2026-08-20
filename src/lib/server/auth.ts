import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { sendPasswordResetEmail } from '$lib/server/email';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({
			user,
			token
		}: {
			user: { name: string; email: string };
			url: string;
			token: string;
		}) => {
			// Link directly to the app page with the token. Better Auth's intermediate
			// /api/auth/reset-password URL varies by version and was 404ing in production.
			const origin = (env.ORIGIN || 'http://localhost:5173').replace(/\/$/, '');
			const resetUrl = `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
			await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
		}
	},
	plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
