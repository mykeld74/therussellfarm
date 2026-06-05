import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { sendTestEmails, type TestEmailType } from '$lib/server/email';

const validTypes = new Set<TestEmailType>(['confirmation', 'cancelled', 'reset', 'all']);

export const GET = async ({ url }) => {
	if (!dev) error(404);

	const to = url.searchParams.get('to') ?? env.ADMIN_EMAIL;
	if (!to) {
		error(400, 'Provide ?to=your@email.com or set ADMIN_EMAIL in .env');
	}

	const typeParam = url.searchParams.get('type') ?? 'all';
	if (!validTypes.has(typeParam as TestEmailType)) {
		error(400, 'type must be confirmation, cancelled, reset, or all');
	}

	const sandbox = url.searchParams.get('sandbox') === 'true';

	try {
		const sent = await sendTestEmails(to, typeParam as TestEmailType, { sandbox });
		return json({
			ok: true,
			to,
			sent,
			sandbox,
			note: sandbox
				? 'Sent via Resend sandbox (onboarding@resend.dev). Recipient must be the email on your Resend account.'
				: undefined
		});
	} catch (err) {
		console.error('Test email failed:', err);
		error(500, err instanceof Error ? err.message : 'Failed to send test email');
	}
};
