/** Accounts that cannot be deleted or have their role changed. */
export const PROTECTED_ACCOUNT_EMAILS = [
	'mike@bigbearded.dev',
	'maplehillside@gmail.com'
] as const;

export function isProtectedAccountEmail(email: string): boolean {
	const normalized = email.trim().toLowerCase();
	return (PROTECTED_ACCOUNT_EMAILS as readonly string[]).includes(normalized);
}
