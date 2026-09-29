/** Shared wagon types and seat capacity rules.
 *  1 adult = 2 seats, 1 kid = 1 seat.
 */

export type WagonType = 'horse' | 'tractor';

export const WAGON_TYPES = ['horse', 'tractor'] as const;

export const WAGON_CONFIG = {
	horse: {
		id: 'horse' as const,
		label: 'Horse-drawn wagon',
		shortLabel: 'Horse',
		description: 'Classic horse-drawn wagon ride to the tree fields. Departs every 15 minutes.',
		seatCapacity: 16,
		maxAdults: 8,
		intervalMinutes: 15
	},
	tractor: {
		id: 'tractor' as const,
		label: 'Tractor-drawn wagon',
		shortLabel: 'Tractor',
		description: 'Tractor-drawn wagon ride to the tree fields. Departs every 30 minutes.',
		seatCapacity: 24,
		maxAdults: 12,
		intervalMinutes: 30
	}
} as const;

/** @deprecated Prefer WAGON_CONFIG.horse.seatCapacity — kept for older imports. */
export const WAGON_SEAT_CAPACITY = WAGON_CONFIG.horse.seatCapacity;

export function isWagonType(value: unknown): value is WagonType {
	return value === 'horse' || value === 'tractor';
}

export function seatsForParty(adults: number, kids: number): number {
	return adults * 2 + kids;
}

export function wagonSeatCapacity(type: WagonType): number {
	return WAGON_CONFIG[type].seatCapacity;
}

export function wagonMaxAdults(type: WagonType): number {
	return WAGON_CONFIG[type].maxAdults;
}

/** Max kids when sharing with at least one adult (capacity − 2 for the adult). */
export function wagonMaxKids(type: WagonType): number {
	return wagonSeatCapacity(type) - 2;
}

export function partyFitsWagon(
	adults: number,
	kids: number,
	type: WagonType = 'horse'
): boolean {
	if (!Number.isFinite(adults) || !Number.isFinite(kids)) return false;
	const maxAdults = wagonMaxAdults(type);
	const maxKids = wagonMaxKids(type);
	if (adults < 1 || adults > maxAdults) return false;
	if (kids < 0 || kids > maxKids) return false;
	const seats = seatsForParty(adults, kids);
	return seats >= 2 && seats <= wagonSeatCapacity(type);
}

export function maxKidsForAdults(adults: number, type: WagonType = 'horse'): number {
	return Math.max(0, Math.min(wagonMaxKids(type), wagonSeatCapacity(type) - adults * 2));
}

export function maxAdultsForKids(kids: number, type: WagonType = 'horse'): number {
	return Math.max(
		0,
		Math.min(wagonMaxAdults(type), Math.floor((wagonSeatCapacity(type) - kids) / 2))
	);
}

/** @deprecated Prefer wagonMaxAdults('horse') */
export const MAX_ADULTS = WAGON_CONFIG.horse.maxAdults;

/** @deprecated Prefer wagonMaxKids('horse') */
export const MAX_KIDS = wagonMaxKids('horse');
