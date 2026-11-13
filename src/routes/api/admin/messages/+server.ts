import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/admin-guard';
import { sendBroadcast, type RecipientMode } from '$lib/server/scheduled-messages';

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const result = await sendBroadcast({
			mode: body.mode as RecipientMode,
			subject: typeof body.subject === 'string' ? body.subject : '',
			body: typeof body.body === 'string' ? body.body : '',
			date: typeof body.date === 'string' ? body.date : '',
			emails: Array.isArray(body.emails)
				? body.emails.filter((value: unknown): value is string => typeof value === 'string')
				: [],
			scheduledAt: typeof body.scheduledAt === 'string' ? body.scheduledAt : undefined
		});
		return json(result);
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to send message' },
			{ status: 400 }
		);
	}
};
