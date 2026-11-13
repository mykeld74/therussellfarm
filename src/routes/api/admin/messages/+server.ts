import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin-guard';
import { sendAdminBroadcast } from '$lib/server/email';
import { prepareBroadcastBodyHtml, stripHtmlToText } from '$lib/server/email-html';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT = 200;
const MAX_BODY = 20000;
const MAX_CUSTOM_RECIPIENTS = 200;

type RecipientMode = 'all' | 'day' | 'select' | 'custom';

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
	return EMAIL_RE.test(email);
}

function dedupeRecipients(
	rows: { email: string; name: string }[]
): { email: string; name: string }[] {
	const byEmail = new Map<string, { email: string; name: string }>();
	for (const row of rows) {
		const key = normalizeEmail(row.email);
		if (!key || byEmail.has(key)) continue;
		byEmail.set(key, { email: row.email.trim(), name: row.name.trim() || 'Friend' });
	}
	return [...byEmail.values()];
}

function parseEmailList(emails: string[]): string[] {
	return [
		...new Set(
			emails
				.flatMap((value) => value.split(/[,;\s]+/))
				.map(normalizeEmail)
				.filter(Boolean)
		)
	];
}

async function resolveRecipientsFromEmails(
	emails: string[]
): Promise<{ email: string; name: string }[]> {
	const normalized = parseEmailList(emails);
	if (normalized.length === 0) return [];
	if (normalized.length > MAX_CUSTOM_RECIPIENTS) {
		throw new Error(`Too many recipients (max ${MAX_CUSTOM_RECIPIENTS})`);
	}

	const invalid = normalized.filter((email) => !isValidEmail(email));
	if (invalid.length > 0) {
		throw new Error(`Invalid email address: ${invalid[0]}`);
	}

	const confirmed = await db
		.select({ email: bookings.email, name: bookings.name })
		.from(bookings)
		.where(eq(bookings.status, 'confirmed'));

	const nameByEmail = new Map<string, string>();
	for (const row of confirmed) {
		const key = normalizeEmail(row.email);
		if (!key || nameByEmail.has(key)) continue;
		nameByEmail.set(key, row.name.trim() || 'Friend');
	}

	return normalized.map((email) => ({
		email,
		name: nameByEmail.get(email) ?? 'Friend'
	}));
}

export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin(locals);

	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const mode = body.mode as RecipientMode;
	const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
	const messageBody = typeof body.body === 'string' ? body.body.trim() : '';
	const date = typeof body.date === 'string' ? body.date.trim() : '';
	const emails = Array.isArray(body.emails)
		? body.emails.filter((value: unknown): value is string => typeof value === 'string')
		: [];

	if (!['all', 'day', 'select', 'custom'].includes(mode)) {
		return json({ error: 'Invalid recipient mode' }, { status: 400 });
	}
	if (!subject || subject.length > MAX_SUBJECT) {
		return json({ error: 'Subject is required (max 200 characters)' }, { status: 400 });
	}
	if (!messageBody || messageBody.length > MAX_BODY) {
		return json({ error: 'Message body is required (max 20,000 characters)' }, { status: 400 });
	}
	const styledBody = prepareBroadcastBodyHtml(messageBody);
	if (!stripHtmlToText(styledBody)) {
		return json({ error: 'Message body is required' }, { status: 400 });
	}
	if (mode === 'day' && !DATE_RE.test(date)) {
		return json({ error: 'A valid date is required' }, { status: 400 });
	}
	if ((mode === 'select' || mode === 'custom') && emails.length === 0) {
		return json({ error: 'Enter at least one recipient email' }, { status: 400 });
	}

	let rows: { email: string; name: string }[] = [];

	try {
		if (mode === 'all') {
			rows = await db
				.select({ email: bookings.email, name: bookings.name })
				.from(bookings)
				.where(eq(bookings.status, 'confirmed'));
		} else if (mode === 'day') {
			rows = await db
				.select({ email: bookings.email, name: bookings.name })
				.from(bookings)
				.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
				.where(and(eq(bookings.status, 'confirmed'), eq(availabilitySlots.date, date)));
		} else {
			rows = await resolveRecipientsFromEmails(emails);
		}
	} catch (err) {
		return json(
			{ error: err instanceof Error ? err.message : 'Failed to resolve recipients' },
			{ status: 400 }
		);
	}

	const recipients = dedupeRecipients(rows);
	if (recipients.length === 0) {
		return json({ error: 'No recipients found for this selection' }, { status: 400 });
	}

	const sent: string[] = [];
	const failed: { email: string; error: string }[] = [];

	for (const recipient of recipients) {
		try {
			await sendAdminBroadcast({
				to: recipient.email,
				name: recipient.name,
				subject,
				body: styledBody
			});
			sent.push(recipient.email);
		} catch (err) {
			failed.push({
				email: recipient.email,
				error: err instanceof Error ? err.message : 'Send failed'
			});
		}
	}

	return json({
		ok: failed.length === 0,
		sentCount: sent.length,
		failedCount: failed.length,
		failed
	});
};
