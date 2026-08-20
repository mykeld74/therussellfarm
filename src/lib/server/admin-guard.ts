import { redirect, error } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export type UserRole = 'user' | 'admin' | 'super_admin';

function isApiRequest(): boolean {
	try {
		return getRequestEvent().url.pathname.startsWith('/api/');
	} catch {
		return false;
	}
}

/** Requires admin or super_admin role. Redirects to login if unauthenticated (pages only). */
export function requireAdmin(locals: App.Locals): void {
	if (!locals.user) {
		if (isApiRequest()) error(401, 'Unauthorized');
		redirect(302, '/auth/login?next=/admin');
	}
	if (locals.role !== 'admin' && locals.role !== 'super_admin') {
		error(403, 'Forbidden');
	}
}

/** Requires super_admin role. Redirects to login if unauthenticated (pages only). */
export function requireSuperAdmin(locals: App.Locals): void {
	if (!locals.user) {
		if (isApiRequest()) error(401, 'Unauthorized');
		redirect(302, '/auth/login?next=/admin');
	}
	if (locals.role !== 'super_admin') {
		error(403, 'Forbidden');
	}
}
