import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { availabilitySlots, bookings } from '$lib/server/db/schema';
import { sendAdminBroadcast } from '$lib/server/email';
import { prepareBroadcastBodyHtml, stripHtmlToText } from '$lib/server/email-html';

export type RecipientMode = 'all' | 'day' | 'select' | 'custom';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_SUBJECT = 200;
export const MAX_BODY = 20000;
const MAX_CUSTOM_RECIPIENTS = 200;
/** Resend allows scheduling up to ~30 days ahead. */
export const MAX_SCHEDULE_MS = 30 * 24 * 60 * 60 * 1000;

export type RecipientInput = {
	mode: RecipientMode;
	date?: string;
	emails?: string[];
};

export type ComposeInput = RecipientInput & {
	subject: string;
	body: string;
	/** ISO timestamp; when set, Resend holds the send until then. */
	scheduledAt?: string;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
	return EMAIL_RE.test(email);
}

export function dedupeRecipients(
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

export function parseEmailList(emails: string[]): string[] {
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

export async function resolveRecipients(
	input: RecipientInput
): Promise<{ email: string; name: string }[]> {
	const { mode, date = '', emails = [] } = input;

	if (!['all', 'day', 'select', 'custom'].includes(mode)) {
		throw new Error('Invalid recipient mode');
	}
	if (mode === 'day' && !DATE_RE.test(date)) {
		throw new Error('A valid date is required');
	}
	if ((mode === 'select' || mode === 'custom') && emails.length === 0) {
		throw new Error('Enter at least one recipient email');
	}

	let rows: { email: string; name: string }[] = [];

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

	const recipients = dedupeRecipients(rows);
	if (recipients.length === 0) {
		throw new Error('No recipients found for this selection');
	}
	return recipients;
}

export function validateCompose(input: ComposeInput): {
	subject: string;
	styledBody: string;
	mode: RecipientMode;
	date: string;
	emails: string[];
} {
	const mode = input.mode;
	const subject = input.subject.trim();
	const messageBody = input.body.trim();
	const date = (input.date ?? '').trim();
	const emails = Array.isArray(input.emails)
		? input.emails.filter((value): value is string => typeof value === 'string')
		: [];

	if (!['all', 'day', 'select', 'custom'].includes(mode)) {
		throw new Error('Invalid recipient mode');
	}
	if (!subject || subject.length > MAX_SUBJECT) {
		throw new Error('Subject is required (max 200 characters)');
	}
	if (!messageBody || messageBody.length > MAX_BODY) {
		throw new Error('Message body is required (max 20,000 characters)');
	}
	const styledBody = prepareBroadcastBodyHtml(messageBody);
	if (!stripHtmlToText(styledBody)) {
		throw new Error('Message body is required');
	}
	if (mode === 'day' && !DATE_RE.test(date)) {
		throw new Error('A valid date is required');
	}
	if ((mode === 'select' || mode === 'custom') && parseEmailList(emails).length === 0) {
		throw new Error('Enter at least one recipient email');
	}

	return {
		subject,
		styledBody,
		mode,
		date,
		emails: mode === 'select' || mode === 'custom' ? parseEmailList(emails) : []
	};
}

export function validateScheduleTime(scheduledAt: Date, now = new Date()): void {
	if (Number.isNaN(scheduledAt.getTime())) {
		throw new Error('Invalid schedule time');
	}
	if (scheduledAt.getTime() <= now.getTime() + 60_000) {
		throw new Error('Schedule time must be at least 1 minute from now');
	}
	if (scheduledAt.getTime() > now.getTime() + MAX_SCHEDULE_MS) {
		throw new Error('Schedule time must be within 30 days');
	}
}

export async function sendBroadcast(input: ComposeInput) {
	const composed = validateCompose(input);
	const scheduledAt = input.scheduledAt?.trim() || undefined;
	if (scheduledAt) {
		validateScheduleTime(new Date(scheduledAt));
	}

	const recipients = await resolveRecipients({
		mode: composed.mode,
		date: composed.date,
		emails: composed.emails
	});

	const sent: string[] = [];
	const failed: { email: string; error: string }[] = [];

	for (const recipient of recipients) {
		try {
			await sendAdminBroadcast({
				to: recipient.email,
				name: recipient.name,
				subject: composed.subject,
				body: composed.styledBody,
				scheduledAt
			});
			sent.push(recipient.email);
		} catch (err) {
			failed.push({
				email: recipient.email,
				error: err instanceof Error ? err.message : 'Send failed'
			});
		}
	}

	return {
		ok: failed.length === 0,
		scheduled: Boolean(scheduledAt),
		scheduledAt: scheduledAt ?? null,
		sentCount: sent.length,
		failedCount: failed.length,
		failed
	};
}
