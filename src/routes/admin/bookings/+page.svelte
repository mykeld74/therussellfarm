<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { formatDate, formatTime, badgeClass } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	let updatingId = $state<number | null>(null);
	let updateError = $state('');

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
		pending: 'statusPending',
		confirmed: 'statusConfirmed',
		cancelled: 'statusCancelled'
	};
</script>

<svelte:head>
	<title>Bookings – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<div class="bookingsTitle">
		<h1>Bookings</h1>
		<span class="bookingCount"
			>{data.bookings.length} result{data.bookings.length !== 1 ? 's' : ''}</span
		>
	</div>

	<!-- Filters -->
	<form method="GET" class="filtersBar">
		<div class="filterField">
			<label for="dateFilter">Date</label>
			<input id="dateFilter" type="date" name="date" value={data.dateFilter} />
		</div>
		<div class="filterField">
			<label for="status-filter">Status</label>
			<select id="status-filter" name="status">
				<option value="" selected={!data.statusFilter}>All statuses</option>
				<option value="pending" selected={data.statusFilter === 'pending'}>Pending</option>
				<option value="confirmed" selected={data.statusFilter === 'confirmed'}>Confirmed</option>
				<option value="cancelled" selected={data.statusFilter === 'cancelled'}>Cancelled</option>
			</select>
		</div>
		<button type="submit" class="btn btnSecondary btnSm">Filter</button>
		{#if data.dateFilter || data.statusFilter}
			<a href="/admin/bookings" class="btn btnSm">Clear</a>
		{/if}
	</form>

	{#if updateError}
		<div class="alert alertError">{updateError}</div>
	{/if}

	{#if data.bookings.length === 0}
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
						<th>Date & Time</th>
						<th>Name</th>
						<th>Email</th>
						<th>Party</th>
						<th>Status</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.bookings as booking}
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
			{#each data.bookings as booking}
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
