import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { getEmailPreviewHtml, type TestEmailType } from '$lib/server/email';

const previewTypes = new Set<Exclude<TestEmailType, 'all'>>(['confirmation', 'cancelled', 'reset']);

export const GET = async ({ url }) => {
	if (!dev) error(404);

	const typeParam = url.searchParams.get('type') ?? 'confirmation';
	if (!previewTypes.has(typeParam as Exclude<TestEmailType, 'all'>)) {
		error(400, 'type must be confirmation, cancelled, or reset');
	}

	const html = getEmailPreviewHtml(typeParam as Exclude<TestEmailType, 'all'>);
	return new Response(html, {
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
};
