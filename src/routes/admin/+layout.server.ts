import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/server/admin-guard';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	return { user: locals.user!, role: locals.role! };
};
