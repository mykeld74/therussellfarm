import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { bookings, availabilitySlots } from '$lib/server/db/schema';
import { eq, and, asc, desc, count } from 'drizzle-orm';
import { farmTodayString } from '$lib/reservations';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAGE_SIZES = [25, 50, 100, 200] as const;

function pageSizeFrom(value: string | null): (typeof PAGE_SIZES)[number] {
	const size = Number(value);
	return PAGE_SIZES.find((allowed) => allowed === size) ?? 50;
}

export const load: PageServerLoad = async ({ url }) => {
	const tab = url.searchParams.get('tab') === 'checkin' ? 'checkin' : 'list';
	const today = farmTodayString();

	if (tab === 'checkin') {
		const bookedDateRows = await db
			.selectDistinct({ date: availabilitySlots.date })
			.from(bookings)
			.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
			.where(eq(bookings.status, 'confirmed'))
			.orderBy(asc(availabilitySlots.date));
		const bookedDates = bookedDateRows.map((row) => row.date);

		const requested = url.searchParams.get('date') ?? '';
		const checkInDate =
			DATE_RE.test(requested) && bookedDates.includes(requested)
				? requested
				: bookedDates.includes(today)
					? today
					: (bookedDates.find((bookedDate) => bookedDate > today) ?? bookedDates.at(-1) ?? today);

		const checkInBookings = await db
			.select({
				id: bookings.id,
				bookingRef: bookings.bookingRef,
				name: bookings.name,
				phone: bookings.phone,
				partySizeAdults: bookings.partySizeAdults,
				partySizeKids: bookings.partySizeKids,
				checkedInAt: bookings.checkedInAt,
				startTime: availabilitySlots.startTime,
				endTime: availabilitySlots.endTime,
				wagonType: availabilitySlots.wagonType
			})
			.from(bookings)
			.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
			.where(and(eq(availabilitySlots.date, checkInDate), eq(bookings.status, 'confirmed')))
			.orderBy(asc(availabilitySlots.startTime), asc(bookings.name));

		return {
			tab,
			today,
			checkInDate,
			bookedDates,
			checkInBookings,
			bookings: [],
			dateFilter: '',
			statusFilter: 'confirmed',
			refFilter: '',
			emailFilter: '',
			page: 1,
			perPage: 50,
			total: 0,
			pageCount: 1,
			sort: 'dateTime' as const,
			dir: 'asc' as const
		};
	}

	const hasStatusParam = url.searchParams.has('status');
	const statusFilter = hasStatusParam ? (url.searchParams.get('status') ?? '') : 'confirmed';
	const refFilter = url.searchParams.get('ref') ?? '';
	const emailFilter = url.searchParams.get('email') ?? '';
	const statusToApply = hasStatusParam ? statusFilter : 'confirmed';
	const statusCondition =
		statusToApply && ['confirmed', 'cancelled'].includes(statusToApply)
			? eq(bookings.status, statusToApply as 'confirmed' | 'cancelled')
			: undefined;

	const bookedDateRows = await db
		.selectDistinct({ date: availabilitySlots.date })
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(statusCondition)
		.orderBy(asc(availabilitySlots.date));
	const bookedDates = bookedDateRows.map((row) => row.date);

	const requestedDate = url.searchParams.get('date') ?? '';
	const dateFilter =
		DATE_RE.test(requestedDate) && bookedDates.includes(requestedDate) ? requestedDate : '';

	const conditions = [];
	if (dateFilter) {
		conditions.push(eq(availabilitySlots.date, dateFilter));
	}
	if (statusCondition) {
		conditions.push(statusCondition);
	}
	if (refFilter) {
		conditions.push(eq(bookings.bookingRef, refFilter));
	}
	if (emailFilter) {
		conditions.push(eq(bookings.email, emailFilter));
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const sort = url.searchParams.get('sort') === 'name' ? 'name' : 'dateTime';
	const dir = url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
	const perPage = pageSizeFrom(url.searchParams.get('perPage'));

	const [countRow] = await db
		.select({ total: count() })
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(where);
	const total = Number(countRow?.total ?? 0);

	const pageCount = Math.max(1, Math.ceil(total / perPage));
	const requestedPage = Number(url.searchParams.get('page'));
	const page = Math.min(Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1), pageCount);

	const dateOrder = dir === 'desc' ? desc(availabilitySlots.date) : asc(availabilitySlots.date);
	const timeOrder = dir === 'desc' ? desc(availabilitySlots.startTime) : asc(availabilitySlots.startTime);
	const nameOrder = dir === 'desc' ? desc(bookings.name) : asc(bookings.name);
	const order =
		sort === 'name'
			? [nameOrder, asc(availabilitySlots.date), asc(availabilitySlots.startTime)]
			: [dateOrder, timeOrder, asc(bookings.name)];

	const pageBookings = await db
		.select({
			id: bookings.id,
			bookingRef: bookings.bookingRef,
			name: bookings.name,
			email: bookings.email,
			phone: bookings.phone,
			partySizeAdults: bookings.partySizeAdults,
			partySizeKids: bookings.partySizeKids,
			status: bookings.status,
			createdAt: bookings.createdAt,
			date: availabilitySlots.date,
			startTime: availabilitySlots.startTime,
			endTime: availabilitySlots.endTime
		})
		.from(bookings)
		.innerJoin(availabilitySlots, eq(bookings.slotId, availabilitySlots.id))
		.where(where)
		.orderBy(...order)
		.limit(perPage)
		.offset((page - 1) * perPage);

	return {
		tab,
		today,
		checkInDate: today,
		bookedDates,
		checkInBookings: [],
		bookings: pageBookings,
		dateFilter,
		statusFilter,
		refFilter,
		emailFilter,
		page,
		perPage,
		total,
		pageCount,
		sort,
		dir
	};
};
