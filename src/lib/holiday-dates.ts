/** US Thanksgiving = 4th Thursday of November */
export function thanksgivingThursday(year: number): Date {
	const nov1 = new Date(year, 10, 1);
	const dayOfWeek = nov1.getDay(); // 0 = Sun, 4 = Thu
	const daysUntilFirstThu = (4 - dayOfWeek + 7) % 7;
	const firstThu = new Date(year, 10, 1 + daysUntilFirstThu);
	firstThu.setDate(firstThu.getDate() + 21);
	return firstThu;
}

/** Friday after Thanksgiving (tree season opener) */
export function dayAfterThanksgiving(year: number): Date {
	const thanksgiving = thanksgivingThursday(year);
	const friday = new Date(thanksgiving);
	friday.setDate(thanksgiving.getDate() + 1);
	return friday;
}

/** Last Sunday before Christmas (Dec 25) */
export function lastSundayBeforeChristmas(year: number): Date {
	const d = new Date(year, 11, 24);
	while (d.getDay() !== 0) {
		d.setDate(d.getDate() - 1);
	}
	return d;
}

/**
 * Year for the upcoming / current Christmas tree season.
 * After the season's last Sunday, rolls to next year.
 */
export function treeSeasonYear(now = new Date()): number {
	const year = now.getFullYear();
	const end = lastSundayBeforeChristmas(year);
	const endOfDay = new Date(end);
	endOfDay.setHours(23, 59, 59, 999);
	return now > endOfDay ? year + 1 : year;
}

function ordinal(n: number): string {
	const v = n % 100;
	if (v >= 11 && v <= 13) return 'th';
	switch (n % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

/** e.g. 11/28 */
export function formatSlashDate(d: Date): string {
	return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** e.g. Dec 20 */
export function formatShortMonthDay(d: Date): string {
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** e.g. December 20th */
export function formatLongMonthDay(d: Date): string {
	const month = d.toLocaleDateString('en-US', { month: 'long' });
	const day = d.getDate();
	return `${month} ${day}${ordinal(day)}`;
}

export function getTreeSeasonDates(now = new Date()) {
	const year = treeSeasonYear(now);
	return {
		year,
		opener: dayAfterThanksgiving(year),
		closer: lastSundayBeforeChristmas(year)
	};
}
