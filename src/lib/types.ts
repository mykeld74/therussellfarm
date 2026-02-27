export type BookingStep = 'date' | 'time' | 'details' | 'review';

export interface SlotSummary {
	id: number;
	date: string;
	startTime: string;
	endTime: string;
	maxCapacity: number;
	bookedCount: number;
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
