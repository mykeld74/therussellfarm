/** Client-side date/time formatting utilities shared across Svelte components. */

export type UserRole = 'user' | 'admin' | 'super_admin';

export function formatDate(
	dateStr: string,
	options: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}
): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', options);
}

export function formatDateLong(dateStr: string): string {
	return formatDate(dateStr, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatTime(t: string): string {
	const [h, m] = t.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hour = h % 12 || 12;
	return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function isUpcoming(dateStr: string): boolean {
	return new Date(dateStr + 'T12:00:00') >= new Date();
}

export const badgeClass: Record<string, string> = {
	pending: 'badgePending',
	confirmed: 'badgeConfirmed',
	cancelled: 'badgeCancelled'
};

export const roleBadgeClass: Record<UserRole, string> = {
	user: 'badgeUser',
	admin: 'badgeAdmin',
	superAdmin: 'badgeSuperAdmin'
} as unknown as Record<UserRole, string>;

export const roleLabel: Record<UserRole, string> = {
	user: 'User',
	admin: 'Admin',
	super_admin: 'Super Admin'
};
