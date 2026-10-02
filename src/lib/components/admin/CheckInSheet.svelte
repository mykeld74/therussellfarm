<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { WAGON_CONFIG, type WagonType } from '$lib/booking-capacity';
	import { formatDate, formatDateLong, formatTime } from '$lib/utils';

	type CheckInBooking = {
		id: number;
		bookingRef: string;
		name: string;
		phone: string;
		partySizeAdults: number;
		partySizeKids: number;
		checkedInAt: Date | string | null;
		startTime: string;
		endTime: string;
		wagonType: WagonType;
	};

	let {
		date,
		today,
		dates,
		bookings
	}: {
		date: string;
		today: string;
		dates: string[];
		bookings: CheckInBooking[];
	} = $props();

	let checkingId = $state<number | null>(null);
	let checkInError = $state('');
	let overrides = $state<Record<number, boolean>>({});

	let checkedCount = $derived(
		bookings.filter((booking) => isCheckedIn(booking)).length
	);

	function isCheckedIn(booking: CheckInBooking): boolean {
		if (booking.id in overrides) return overrides[booking.id];
		return Boolean(booking.checkedInAt);
	}

	function partyLabel(adults: number, kids: number): string {
		const adultLabel = `${adults} adult${adults === 1 ? '' : 's'}`;
		if (kids <= 0) return adultLabel;
		return `${adultLabel}, ${kids} child${kids === 1 ? '' : 'ren'}`;
	}

	async function toggleCheckIn(id: number, checkedIn: boolean) {
		overrides = { ...overrides, [id]: checkedIn };
		checkingId = id;
		checkInError = '';
		try {
			const res = await fetch(`/api/admin/bookings/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ checkedIn })
			});
			if (!res.ok) throw new Error('Failed to update');
			await invalidateAll();
			const { [id]: _cleared, ...rest } = overrides;
			overrides = rest;
		} catch {
			const { [id]: _cleared, ...rest } = overrides;
			overrides = rest;
			checkInError = 'Could not update check-in. Please try again.';
		} finally {
			checkingId = null;
		}
	}
</script>

<div class="checkInSheet">
	<div class="printBanner">
		<p class="printBrand">The Russell Farm</p>
		<h2>{formatDateLong(date)}</h2>
		<p class="printNote">Check the box when the party arrives.</p>
	</div>

	<div class="checkInToolbar noPrint">
		<form method="GET" class="dateForm">
			<input type="hidden" name="tab" value="checkin" />
			<div class="dateField">
				<label for="checkInDate">Date</label>
				<select
					id="checkInDate"
					name="date"
					value={date}
					disabled={dates.length === 0}
					onchange={(e) => e.currentTarget.form?.requestSubmit()}
				>
					{#each dates as bookedDate (bookedDate)}
						<option value={bookedDate} selected={bookedDate === date}>
							{formatDate(bookedDate)}
						</option>
					{/each}
				</select>
			</div>
			{#if dates.includes(today) && date !== today}
				<a class="todayLink" href="/admin/bookings?tab=checkin&date={today}">Today</a>
			{/if}
		</form>
		{#if dates.length > 0}
			<p class="checkInSummary">
				{bookings.length} reservation{bookings.length === 1 ? '' : 's'} · {checkedCount} checked in
			</p>
			<button type="button" class="btn btnSecondary btnSm" onclick={() => window.print()}>
				Print day
			</button>
		{/if}
	</div>

	{#if checkInError}
		<div class="alert alertError noPrint">{checkInError}</div>
	{/if}

	{#if dates.length === 0}
		<div class="emptyPanel">
			<p>No confirmed reservations to check in.</p>
		</div>
	{:else if bookings.length === 0}
		<div class="emptyPanel">
			<p>No confirmed reservations on {formatDateLong(date)}.</p>
		</div>
	{:else}
		<div class="checkInTableWrap">
			<table class="checkInTable">
				<thead>
					<tr>
						<th class="checkCol">In</th>
						<th>Time</th>
						<th>Name</th>
						<th>Party</th>
						<th class="screenOnly">Phone</th>
						<th>Ride</th>
						<th class="screenOnly">Ref</th>
					</tr>
				</thead>
				<tbody>
					{#each bookings as booking (booking.id)}
						<tr class:checkedIn={isCheckedIn(booking)}>
							<td class="checkCol">
								<input
									class="checkBox"
									type="checkbox"
									checked={isCheckedIn(booking)}
									disabled={checkingId === booking.id}
									aria-label="Check in {booking.name}"
									onchange={(e) => toggleCheckIn(booking.id, e.currentTarget.checked)}
								/>
							</td>
							<td class="timeCell">
								{formatTime(booking.startTime)} – {formatTime(booking.endTime)}
							</td>
							<td class="nameCell">{booking.name}</td>
							<td>{partyLabel(booking.partySizeAdults, booking.partySizeKids)}</td>
							<td class="phoneCell screenOnly">{booking.phone}</td>
							<td>{WAGON_CONFIG[booking.wagonType].shortLabel}</td>
							<td class="refCell screenOnly"><code>{booking.bookingRef}</code></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="checkInCards">
			{#each bookings as booking (booking.id)}
				<label class="checkInCard" class:checkedIn={isCheckedIn(booking)}>
					<input
						class="checkBox"
						type="checkbox"
						checked={isCheckedIn(booking)}
						disabled={checkingId === booking.id}
						aria-label="Check in {booking.name}"
						onchange={(e) => toggleCheckIn(booking.id, e.currentTarget.checked)}
					/>
					<span class="cardBody">
						<span class="nameCell">{booking.name}</span>
						<span class="timeCell">
							{formatTime(booking.startTime)} – {formatTime(booking.endTime)} · {WAGON_CONFIG[
								booking.wagonType
							].shortLabel}
						</span>
						<span>{partyLabel(booking.partySizeAdults, booking.partySizeKids)}</span>
						<span class="phoneCell">{booking.phone}</span>
						<span class="refCell"><code>{booking.bookingRef}</code></span>
					</span>
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	.printBanner {
		display: none;
	}

	.checkInToolbar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}

	.dateForm {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.dateField {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.dateField label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.dateForm select {
		padding: 0.5rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.95rem;
		background: var(--color-white);
	}

	.todayLink {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-forest);
		padding-bottom: 0.55rem;
	}

	.checkInSummary {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.checkInTableWrap {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: auto;
	}

	.checkInTable {
		width: 100%;
		border-collapse: collapse;
		font-size: 1rem;
	}

	.checkInTable th {
		background: var(--color-cream);
		padding: 0.75rem 0.85rem;
		text-align: left;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.checkInTable td {
		padding: 0.9rem 0.85rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.checkInTable tr:last-child td {
		border-bottom: none;
	}

	.checkInTable tr.checkedIn td {
		background: #f0fdf4;
	}

	.checkCol {
		width: 3rem;
		text-align: center;
	}

	.checkBox {
		width: 1.35rem;
		height: 1.35rem;
		accent-color: var(--color-forest);
		cursor: pointer;
	}

	.timeCell {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	.nameCell {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--color-forest-dk);
	}

	.phoneCell {
		white-space: nowrap;
	}

	.refCell code {
		font-size: 0.85rem;
		background: var(--color-cream-dk);
		padding: 0.15rem 0.35rem;
		border-radius: var(--radius);
		color: var(--color-forest);
	}

	.checkInCards {
		display: none;
	}

	@media (max-width: 768px) {
		.checkInTableWrap {
			display: none;
		}

		.checkInCards {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.checkInCard {
			display: flex;
			align-items: flex-start;
			gap: 0.85rem;
			background: var(--color-white);
			border: 1px solid var(--color-border);
			border-radius: var(--radius-lg);
			padding: 1rem;
			cursor: pointer;
		}

		.checkInCard.checkedIn {
			background: #f0fdf4;
			border-color: #6ee7b7;
		}

		.cardBody {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;
			min-width: 0;
		}
	}

	@media print {
		.printBanner {
			display: block;
			margin-bottom: 1rem;
		}

		.printBrand {
			margin: 0;
			font-size: 0.85rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #1f3d2b;
		}

		.printBanner h2 {
			margin: 0.15rem 0 0.25rem;
			font-size: 1.6rem;
			color: #1f3d2b;
		}

		.printNote {
			margin: 0;
			font-size: 0.95rem;
		}

		:global(.siteHeader),
		:global(.siteFooter),
		:global(.adminSidebar),
		:global(.noPrint) {
			display: none !important;
		}

		:global(.adminShell) {
			display: block !important;
		}

		:global(.adminContent) {
			padding: 0 !important;
			overflow: visible !important;
		}

		:global(main) {
			min-height: 0 !important;
		}

		.checkInTableWrap {
			display: block !important;
			border: none;
			overflow: visible;
			background: white;
		}

		.checkInCards {
			display: none !important;
		}

		.checkInTable {
			font-size: 12pt;
		}

		.checkInTable th,
		.checkInTable td {
			padding: 0.55rem 0.4rem;
		}

		.checkInTable thead {
			display: table-header-group;
		}

		.checkInTable tr {
			break-inside: avoid;
		}

		.screenOnly {
			display: none !important;
		}

		.checkBox {
			width: 16px;
			height: 16px;
			print-color-adjust: exact;
		}

		.nameCell {
			font-size: 13pt;
		}
	}
</style>
