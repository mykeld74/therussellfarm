export type BookingStep = 'party' | 'date' | 'time' | 'details' | 'review';

export interface SlotSummary {
	id: number;
	date: string;
	startTime: string;
	endTime: string;
	maxCapacity: number;
	bookedCount: number;
	/** Seat units already booked (adult*2 + kid). */
	bookedSeats: number;
	/** Seat units still available. */
	remaining: number;
}

export interface BookingFormData {
	slotId: number | null;
	selectedDate: string;
	selectedSlot: SlotSummary | null;
	name: string;
	email: string;
	phone: string;
	partySizeAdults: number;
	partySizeKids: number;
}
