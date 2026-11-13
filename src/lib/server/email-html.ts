/** Allowlisted tags that render reliably across major email clients. */
const ALLOWED_TAGS = new Set([
	'p',
	'br',
	'strong',
	'b',
	'em',
	'i',
	'u',
	'ul',
	'ol',
	'li',
	'a',
	'div'
]);

function decodeEntities(value: string): string {
	return value
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function sanitizeHref(raw: string | undefined): string | null {
	if (!raw) return null;
	const href = decodeEntities(raw.trim());
	if (/^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
	if (/^www\./i.test(href)) return `https://${href}`;
	return null;
}

function getAttr(attrs: string, name: string): string | undefined {
	const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
	if (!match) return undefined;
	return match[2] ?? match[3] ?? match[4];
}

/**
 * Strip unsafe markup from admin-composed HTML and keep only email-safe tags.
 * Returns empty string when there is no visible text content.
 */
export function sanitizeBroadcastHtml(input: string): string {
	if (!input || typeof input !== 'string') return '';

	let html = input
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<\/?(script|style|iframe|object|embed|form|input|button|img|video|audio|svg|math|meta|link)[^>]*>/gi, '')
		.replace(/\son\w+\s*=\s*("[\s\S]*?"|'[\s\S]*?'|[^\s>]+)/gi, '');

	const tokenRe = /<\/?([a-z0-9]+)(\s[^>]*)?>|([^<]+)/gi;
	let out = '';
	let match: RegExpExecArray | null;

	while ((match = tokenRe.exec(html)) !== null) {
		if (match[3] !== undefined) {
			out += escapeHtml(decodeEntities(match[3]));
			continue;
		}

		const tag = match[1].toLowerCase();
		const isClose = match[0].startsWith('</');
		if (!ALLOWED_TAGS.has(tag)) continue;

		if (tag === 'br') {
			if (!isClose) out += '<br>';
			continue;
		}

		if (tag === 'a') {
			if (isClose) {
				out += '</a>';
				continue;
			}
			const href = sanitizeHref(getAttr(match[2] ?? '', 'href'));
			if (!href) continue;
			out += `<a href="${escapeHtml(href)}">`;
			continue;
		}

		const normalized =
			tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag === 'div' ? 'p' : tag;

		out += isClose ? `</${normalized}>` : `<${normalized}>`;
	}

	out = out
		.replace(/<p>\s*<\/p>/gi, '')
		.replace(/(?:<br>\s*){3,}/gi, '<br><br>')
		.trim();

	if (!stripHtmlToText(out)) return '';
	return out;
}

export function stripHtmlToText(html: string): string {
	return decodeEntities(html.replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim();
}

/** Apply inline styles so the message matches the farm email template in clients. */
export function styleBroadcastHtml(html: string): string {
	const sanitized = sanitizeBroadcastHtml(html);
	if (!sanitized) return '';

	let styled = sanitized
		.replace(/<p>/gi, '<p style="font-family:sans-serif;line-height:1.6;margin:0 0 1rem;color:#2c2c2c;">')
		.replace(
			/<ul>/gi,
			'<ul style="font-family:sans-serif;line-height:1.6;margin:0 0 1rem;padding-left:1.25rem;color:#2c2c2c;">'
		)
		.replace(
			/<ol>/gi,
			'<ol style="font-family:sans-serif;line-height:1.6;margin:0 0 1rem;padding-left:1.25rem;color:#2c2c2c;">'
		)
		.replace(/<li>/gi, '<li style="margin:0 0 0.35rem;">')
		.replace(
			/<a href="/gi,
			'<a style="color:#2d5a27;text-decoration:underline;" href="'
		);

	// Wrap bare text / inline-only content in a paragraph for consistent spacing.
	if (!/<(p|ul|ol)\b/i.test(styled)) {
		styled = `<p style="font-family:sans-serif;line-height:1.6;margin:0 0 1rem;color:#2c2c2c;">${styled}</p>`;
	}

	return styled;
}

/** Convert plain text (legacy / test samples) into simple paragraph HTML. */
export function plainTextToBroadcastHtml(text: string): string {
	return text
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map((block) => {
			const lines = escapeHtml(block).replace(/\n/g, '<br>');
			return `<p>${lines}</p>`;
		})
		.join('');
}

export function isMostlyHtml(value: string): boolean {
	return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function prepareBroadcastBodyHtml(body: string): string {
	const trimmed = body.trim();
	if (!trimmed) return '';
	const html = isMostlyHtml(trimmed) ? trimmed : plainTextToBroadcastHtml(trimmed);
	return styleBroadcastHtml(html);
}
