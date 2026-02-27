import { db } from '$lib/server/db';
import { bookings } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O, 1/I

export function generateBookingRef(): string {
	let ref = 'RF-';
	for (let i = 0; i < 4; i++) {
		ref += CHARS[Math.floor(Math.random() * CHARS.length)];
	}
	return ref;
}

export function formatDate(dateStr: string): string {
	return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatTime(timeStr: string): string {
	const [h, m] = timeStr.split(':').map(Number);
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hour = h % 12 || 12;
	return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Links any guest bookings (userId = NULL) whose email matches the given
 * address to the supplied user account. Called after sign-in and sign-up so
 * that bookings made before account creation are immediately visible.
 */
export async function claimGuestBookings(userId: string, email: string): Promise<void> {
	await db
		.update(bookings)
		.set({ userId })
		.where(and(eq(bookings.email, email), isNull(bookings.userId)));
}
