import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/admin-guard';
import { sendBookingConfirmation, sendBookingCancelled } from '$lib/server/email';
import { formatDate, formatTime } from '$lib/server/booking-utils';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin(locals);

	const id = Number(params.id);
	if (!Number.isFinite(id)) return json({ error: 'Invalid id' }, { status: 400 });

	const body = await request.json();
	const { status } = body;

	if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
		return json({ error: 'Invalid status' }, { status: 400 });
	}

	const [updated] = await db
		.update(bookings)
		.set({ status })
		.where(eq(bookings.id, id))
		.returning();

	if (!updated) error(404, 'Booking not found');

	// Send email notification when admin confirms or cancels
	if (status === 'confirmed' || status === 'cancelled') {
		try {
			const [slot] = await db
				.select({
					date: availabilitySlots.date,
					startTime: availabilitySlots.startTime,
					endTime: availabilitySlots.endTime
				})
				.from(availabilitySlots)
				.where(eq(availabilitySlots.id, updated.slotId))
				.limit(1);

			if (slot) {
				const emailData = {
					to: updated.email,
					name: updated.name,
					bookingRef: updated.bookingRef,
					date: formatDate(slot.date),
					startTime: formatTime(slot.startTime),
					endTime: formatTime(slot.endTime),
					adults: updated.partySizeAdults,
					kids: updated.partySizeKids
				};
				if (status === 'confirmed') {
					await sendBookingConfirmation(emailData);
				} else {
					await sendBookingCancelled(emailData);
				}
			}
		} catch (emailErr) {
			console.error('Status update email failed:', emailErr);
		}
	}

	return json(updated);
};
