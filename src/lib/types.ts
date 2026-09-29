export type WagonType = 'horse' | 'tractor';

export type BookingStep = 'ride' | 'party' | 'date' | 'time' | 'details' | 'review';

export interface SlotSummary {
	id: number;
	date: string;
	startTime: string;
	endTime: string;
	wagonType: WagonType;
	maxCapacity: number;
	bookedCount: number;
	/** Seat units already booked (adult*2 + kid). */
	bookedSeats: number;
	/** Seat units still available. */
	remaining: number;
}

export interface BookingFormData {
	slotId: number | null;
	wagonType: WagonType | null;
	selectedDate: string;
	selectedSlot: SlotSummary | null;
	name: string;
	email: string;
	phone: string;
	partySizeAdults: number;
	partySizeKids: number;
}
