<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { formatDate, formatTime, badgeClass } from '$lib/utils';
	import CheckInSheet from '$lib/components/admin/CheckInSheet.svelte';

	let { data }: { data: PageData } = $props();

	let updatingId = $state<number | null>(null);
	let updateError = $state('');

	const pageSizes = [25, 50, 100, 200];

	type SortKey = 'dateTime' | 'name';

	function bookingsHref(
		changes: {
			page?: number;
			perPage?: number;
			sort?: SortKey;
			dir?: 'asc' | 'desc';
		} = {}
	) {
		const params = new URLSearchParams();
		if (data.dateFilter) params.set('date', data.dateFilter);
		if (data.refFilter) params.set('ref', data.refFilter);
		if (data.emailFilter) params.set('email', data.emailFilter);
		if (data.statusFilter !== 'confirmed') params.set('status', data.statusFilter);

		const perPage = changes.perPage ?? data.perPage;
		const sort = changes.sort ?? data.sort;
		const dir = changes.dir ?? data.dir;
		const page = changes.page ?? data.page;
		if (perPage !== 50) params.set('perPage', String(perPage));
		if (sort !== 'dateTime') params.set('sort', sort);
		if (dir !== 'asc') params.set('dir', dir);
		if (page > 1) params.set('page', String(page));

		const query = params.toString();
		return query ? `/admin/bookings?${query}` : '/admin/bookings';
	}

	function sortHref(key: SortKey) {
		const dir = data.sort === key && data.dir === 'asc' ? 'desc' : 'asc';
		return bookingsHref({ sort: key, dir, page: 1 });
	}

	function sortIndicator(key: SortKey): string {
		if (data.sort !== key) return '';
		return data.dir === 'asc' ? ' ↑' : ' ↓';
	}

	function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
		if (data.sort !== key) return 'none';
		return data.dir === 'asc' ? 'ascending' : 'descending';
	}

	let rangeStart = $derived(data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1);
	let rangeEnd = $derived(Math.min(data.page * data.perPage, data.total));

	let checkInHref = $derived.by(() => {
		if (data.tab === 'checkin') {
			return `/admin/bookings?tab=checkin&date=${data.checkInDate}`;
		}
		const day =
			data.dateFilter || (data.bookedDates.includes(data.today) ? data.today : '');
		return day ? `/admin/bookings?tab=checkin&date=${day}` : '/admin/bookings?tab=checkin';
	});

	async function updateStatus(id: number, status: string) {
		updatingId = id;
		updateError = '';
		try {
			const res = await fetch(`/api/admin/bookings/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status })
			});
			if (!res.ok) throw new Error('Failed to update');
			await invalidateAll();
		} catch {
			updateError = 'Failed to update booking status.';
		} finally {
			updatingId = null;
		}
	}

	const rowStatusClass: Record<string, string> = {
		confirmed: 'statusConfirmed',
		cancelled: 'statusCancelled'
	};
</script>

<svelte:head>
	<title>Bookings – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<div class="bookingsTitle noPrint">
		<h1>Bookings</h1>
		{#if data.tab !== 'checkin'}
			<span class="bookingCount"
				>{data.total} result{data.total !== 1 ? 's' : ''}</span
			>
		{/if}
	</div>

	<nav class="viewTabs noPrint" aria-label="Bookings views">
		<a href="/admin/bookings" class="viewTab" class:active={data.tab !== 'checkin'}>Bookings</a>
		<a href={checkInHref} class="viewTab" class:active={data.tab === 'checkin'}
			>Check-in</a
		>
	</nav>

	{#if data.tab === 'checkin'}
		<CheckInSheet
			date={data.checkInDate}
			today={data.today}
			dates={data.bookedDates}
			bookings={data.checkInBookings}
		/>
	{:else}
	<!-- Filters -->
	<form method="GET" class="filtersBar">
		<input type="hidden" name="perPage" value={data.perPage} />
		<input type="hidden" name="sort" value={data.sort} />
		<input type="hidden" name="dir" value={data.dir} />
		<div class="filterField">
			<label for="dateFilter">Date</label>
			<select
				id="dateFilter"
				name="date"
				onchange={(e) => e.currentTarget.form?.requestSubmit()}
			>
				<option value="" selected={data.dateFilter === ''}>All dates</option>
				{#each data.bookedDates as bookedDate (bookedDate)}
					<option value={bookedDate} selected={data.dateFilter === bookedDate}>
						{formatDate(bookedDate)}
					</option>
				{/each}
			</select>
		</div>
		<div class="filterField">
			<label for="refFilter">Ref</label>
			<input
				id="refFilter"
				type="text"
				name="ref"
				value={data.refFilter}
				placeholder="RF-1234"
			/>
		</div>
		<div class="filterField">
			<label for="emailFilter">Email</label>
			<input
				id="emailFilter"
				type="email"
				name="email"
				value={data.emailFilter}
				placeholder="name@example.com"
			/>
		</div>
		<div class="filterField">
			<label for="statusFilter">Status</label>
			<select
				id="statusFilter"
				name="status"
				onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
			>
				<option value="" selected={data.statusFilter === ''}>All statuses</option>
				<option value="confirmed" selected={data.statusFilter === 'confirmed'}>Confirmed</option>
				<option value="cancelled" selected={data.statusFilter === 'cancelled'}>Cancelled</option>
			</select>
		</div>
		<button type="submit" class="btn btnSecondary btnSm">Filter</button>
		{#if data.dateFilter || data.refFilter || data.emailFilter || data.statusFilter !== 'confirmed'}
			<a href="/admin/bookings" class="btn btnSm">Clear</a>
		{/if}
	</form>

	{#if updateError}
		<div class="alert alertError">{updateError}</div>
	{/if}

	{#if data.total === 0}
		<div class="emptyPanel">
			<p>No bookings found for the selected filters.</p>
		</div>
	{:else}
		<!-- Desktop: table -->
		<div class="bookingsTableWrap">
			<table class="bookingsTable">
				<thead>
					<tr>
						<th>Ref</th>
						<th aria-sort={ariaSort('dateTime')}>
							<a class="sortBtn" href={sortHref('dateTime')}>
								Date & Time{sortIndicator('dateTime')}
							</a>
						</th>
						<th aria-sort={ariaSort('name')}>
							<a class="sortBtn" href={sortHref('name')}>Name{sortIndicator('name')}</a>
						</th>
						<th>Email</th>
						<th>Party</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as booking (booking.id)}
						<tr class="bookingRow {rowStatusClass[booking.status] ?? ''}">
							<td class="refCell">
								<code>{booking.bookingRef}</code>
							</td>
							<td>
								<div>{formatDate(booking.date)}</div>
								<div class="timeSub">
									{formatTime(booking.startTime)} – {formatTime(booking.endTime)}
								</div>
							</td>
							<td>{booking.name}</td>
							<td>
								<a href="mailto:{booking.email}" class="emailLink">{booking.email}</a>
							</td>
							<td class="partyCell">
								{booking.partySizeAdults}A
								{#if booking.partySizeKids > 0}+ {booking.partySizeKids}K{/if}
							</td>
							<td>
								<span class="badge {badgeClass[booking.status]}">{booking.status}</span>
							</td>
							<td class="actionsCell">
								{#if booking.status !== 'cancelled'}
									<button
										class="btn btnDanger btnSm"
										disabled={updatingId === booking.id}
										onclick={() => updateStatus(booking.id, 'cancelled')}
									>
										Cancel
									</button>
								{/if}
								{#if booking.status === 'cancelled'}
									<button
										class="btn btnSecondary btnSm"
										disabled={updatingId === booking.id}
										onclick={() => updateStatus(booking.id, 'confirmed')}
									>
										Restore
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile: cards for full booking readout -->
		<div class="bookingsCards">
			{#each data.bookings as booking (booking.id)}
				<article class="bookingCard {rowStatusClass[booking.status] ?? ''}">
					<div class="cardHeader">
						<code class="cardRef">{booking.bookingRef}</code>
						<span class="badge {badgeClass[booking.status]}">{booking.status}</span>
					</div>
					<dl class="cardDetails">
						<div class="cardRow">
							<dt>Date & time</dt>
							<dd>
								{formatDate(booking.date)} · {formatTime(booking.startTime)} – {formatTime(
									booking.endTime
								)}
							</dd>
						</div>
						<div class="cardRow">
							<dt>Name</dt>
							<dd>{booking.name}</dd>
						</div>
						<div class="cardRow">
							<dt>Email</dt>
							<dd><a href="mailto:{booking.email}" class="emailLink">{booking.email}</a></dd>
						</div>
						{#if booking.phone}
							<div class="cardRow">
								<dt>Phone</dt>
								<dd><a href="tel:{booking.phone}" class="phoneLink">{booking.phone}</a></dd>
							</div>
						{/if}
						<div class="cardRow">
							<dt>Party</dt>
							<dd>
								{booking.partySizeAdults} adult{booking.partySizeAdults !== 1
									? 's'
									: ''}{#if booking.partySizeKids > 0}, {booking.partySizeKids} child{booking.partySizeKids !==
									1
										? 'ren'
										: ''}{/if}
							</dd>
						</div>
					</dl>
					<div class="cardActions">
						{#if booking.status !== 'cancelled'}
							<button
								class="btn btnDanger btnSm"
								disabled={updatingId === booking.id}
								onclick={() => updateStatus(booking.id, 'cancelled')}
							>
								Cancel
							</button>
						{/if}
						{#if booking.status === 'cancelled'}
							<button
								class="btn btnSecondary btnSm"
								disabled={updatingId === booking.id}
								onclick={() => updateStatus(booking.id, 'confirmed')}
							>
								Restore
							</button>
						{/if}
					</div>
				</article>
			{/each}
		</div>

		<div class="pager">
			<label class="pageSizeField">
				Rows
				<select
					aria-label="Rows per page"
					onchange={(e) => goto(bookingsHref({ perPage: Number(e.currentTarget.value), page: 1 }))}
				>
					{#each pageSizes as size (size)}
						<option value={size} selected={data.perPage === size}>{size}</option>
					{/each}
				</select>
			</label>
			<p class="pagerSummary">
				Showing {rangeStart}–{rangeEnd} of {data.total}
			</p>
			<div class="pagerNav">
				{#if data.page > 1}
					<a class="pagerLink" href={bookingsHref({ page: data.page - 1 })}>Previous</a>
				{:else}
					<span class="pagerLink disabled">Previous</span>
				{/if}
				<span class="pagerPage">Page {data.page} of {data.pageCount}</span>
				{#if data.page < data.pageCount}
					<a class="pagerLink" href={bookingsHref({ page: data.page + 1 })}>Next</a>
				{:else}
					<span class="pagerLink disabled">Next</span>
				{/if}
			</div>
		</div>
	{/if}
	{/if}
</div>

<style>
	.bookingsTitle {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.bookingsTitle h1 {
		font-size: 1.75rem;
		color: var(--color-forest-dk);
		margin: 0;
	}

	.viewTabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
	}

	.viewTab {
		padding: 0.65rem 1rem;
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		color: var(--color-text-muted);
		font-weight: 600;
		text-decoration: none;
	}

	.viewTab.active {
		color: var(--color-forest-dk);
		border-bottom-color: var(--color-forest);
	}

	.bookingCount {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		background: var(--color-cream-dk);
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}

	.filtersBar {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.filterField {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.filterField label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.filterField input,
	.filterField select {
		padding: 0.5rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		background: var(--color-white);
	}

	.bookingsTableWrap {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		overflow-x: auto;
	}

	.bookingsCards {
		display: none;
	}

	.bookingsTable {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.bookingsTable th {
		background: var(--color-cream);
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.sortBtn {
		background: none;
		border: none;
		padding: 0.25rem 0;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		cursor: pointer;
		text-decoration: none;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.pageSizeField {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.pageSizeField select {
		padding: 0.4rem 0.6rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		background: var(--color-white);
		color: var(--color-text);
	}

	.pagerSummary,
	.pagerPage {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.pagerNav {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.pagerLink {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-forest);
		text-decoration: none;
	}

	.pagerLink.disabled {
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.sortBtn:hover,
	th[aria-sort='ascending'] .sortBtn,
	th[aria-sort='descending'] .sortBtn {
		color: var(--color-forest);
	}

	.bookingsTable td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.bookingRow:last-child td {
		border-bottom: none;
	}

	.bookingRow:hover td {
		background: var(--color-cream);
	}

	.bookingRow.statusCancelled td {
		opacity: 0.6;
	}

	.refCell code {
		font-size: 0.85rem;
		background: var(--color-cream-dk);
		padding: 0.2rem 0.4rem;
		border-radius: var(--radius);
		color: var(--color-forest);
	}

	.timeSub {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}

	.emailLink {
		color: var(--color-forest);
		font-size: 0.875rem;
	}

	.partyCell {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.bookingsTable th:last-child,
	.actionsCell {
		text-align: center;
		white-space: nowrap;
	}

	/* Mobile: card list for readable full booking */
	@media (max-width: 768px) {
		.bookingsTableWrap {
			display: none;
		}

		.bookingsCards {
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		.bookingCard {
			background: var(--color-white);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			padding: 1.25rem;
			display: flex;
			flex-direction: column;
			gap: 1rem;
		}

		.bookingCard.statusCancelled {
			opacity: 0.65;
		}

		.cardHeader {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
			flex-wrap: wrap;
		}

		.cardRef {
			font-size: 0.9rem;
			background: var(--color-cream-dk);
			padding: 0.25rem 0.5rem;
			border-radius: var(--radius);
			color: var(--color-forest);
		}

		.cardDetails {
			display: flex;
			flex-direction: column;
			gap: 0.6rem;
			margin: 0;
		}

		.cardRow {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}

		.cardRow dt {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--color-text-muted);
			margin: 0;
		}

		.cardRow dd {
			font-size: 0.95rem;
			color: var(--color-text);
			margin: 0;
			word-break: break-word;
		}

		.phoneLink {
			color: var(--color-forest);
		}

		.cardActions {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
			padding-top: 0.25rem;
			border-top: 1px solid var(--color-border);
		}
	}

	@media (min-width: 769px) {
		.bookingsCards {
			display: none;
		}
	}
</style>
