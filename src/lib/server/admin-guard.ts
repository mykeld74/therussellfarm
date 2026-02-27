import { redirect, error } from '@sveltejs/kit';

export type UserRole = 'user' | 'admin' | 'super_admin';

/** Requires admin or super_admin role. Redirects to login if unauthenticated. */
export function requireAdmin(locals: App.Locals): void {
	if (!locals.user) {
		redirect(302, '/auth/login?next=/admin');
	}
	if (locals.role !== 'admin' && locals.role !== 'super_admin') {
		error(403, 'Forbidden');
	}
}

/** Requires super_admin role. Redirects to login if unauthenticated. */
export function requireSuperAdmin(locals: App.Locals): void {
	if (!locals.user) {
		redirect(302, '/auth/login?next=/admin');
	}
	if (locals.role !== 'super_admin') {
		error(403, 'Forbidden');
	}
}
