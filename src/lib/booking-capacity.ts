/** Wagon seat capacity: 1 adult = 2 seats, 1 kid = 1 seat. */
export const WAGON_SEAT_CAPACITY = 16;

export function seatsForParty(adults: number, kids: number): number {
	return adults * 2 + kids;
}

/** Max adults that fit a wagon (8). */
export const MAX_ADULTS = 8;

/** Max kids when sharing with at least one adult (14). */
export const MAX_KIDS = 14;

export function partyFitsWagon(adults: number, kids: number): boolean {
	if (!Number.isFinite(adults) || !Number.isFinite(kids)) return false;
	if (adults < 1 || adults > MAX_ADULTS) return false;
	if (kids < 0 || kids > MAX_KIDS) return false;
	const seats = seatsForParty(adults, kids);
	return seats >= 2 && seats <= WAGON_SEAT_CAPACITY;
}

export function maxKidsForAdults(adults: number): number {
	return Math.max(0, Math.min(MAX_KIDS, WAGON_SEAT_CAPACITY - adults * 2));
}

export function maxAdultsForKids(kids: number): number {
	return Math.max(0, Math.min(MAX_ADULTS, Math.floor((WAGON_SEAT_CAPACITY - kids) / 2)));
}
