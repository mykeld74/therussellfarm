<script lang="ts">
	import type { PageData } from './$types';
	import type { SlotSummary } from '$lib/types';
	import {
		WAGON_SEAT_CAPACITY,
		seatsForParty,
		maxAdultsForKids,
		maxKidsForAdults,
		partyFitsWagon
	} from '$lib/booking-capacity';
	import { formatDateLong, formatTime, isUpcoming, badgeClass } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';
	import IMask from 'imask';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	let name = $state(untrack(() => data.booking.name));
	let email = $state(untrack(() => data.booking.email));
	let phone = $state(untrack(() => data.booking.phone));
	let partySizeAdults = $state(untrack(() => data.booking.partySizeAdults));
	let partySizeKids = $state(untrack(() => data.booking.partySizeKids));
	let slotId = $state(untrack(() => data.booking.slotId));
	let selectedDate = $state(untrack(() => data.booking.date));
	let selectedSlot = $state<{
		id: number;
		date: string;
		startTime: string;
		endTime: string;
	} | null>(
		untrack(() => ({
			id: data.booking.slotId,
			date: data.booking.date,
			startTime: data.booking.startTime,
			endTime: data.booking.endTime
		}))
	);

	let pickingSchedule = $state(false);
	let scheduleStep: 'date' | 'time' = $state('date');
	let availableDates = $state<Set<string>>(new Set());
	let daySlots = $state<SlotSummary[]>([]);
	let scheduleLoading = $state(false);
	let scheduleError = $state('');

	let saving = $state(false);
	let cancelling = $state(false);
	let confirmCancel = $state(false);
	let formError = $state('');
	let formSuccess = $state('');

	const phoneMaskConfig = { mask: '(000) 000-0000' };

	let seatsNeeded = $derived(seatsForParty(partySizeAdults, partySizeKids));
	let canSaveParty = $derived(partyFitsWagon(partySizeAdults, partySizeKids));
	let editable = $derived(
		data.booking.status === 'confirmed' && isUpcoming(data.booking.date)
	);

	function adjustAdults(delta: number) {
		const next = partySizeAdults + delta;
		partySizeAdults = Math.max(0, Math.min(maxAdultsForKids(partySizeKids), next));
	}

	function adjustKids(delta: number) {
		const next = partySizeKids + delta;
		if (delta < 0) {
			partySizeKids = Math.max(0, next);
			return;
		}
		partySizeKids = Math.min(maxKidsForAdults(partySizeAdults), Math.max(0, next));
	}

	async function loadMonthAvailability(year: number, month: number) {
		scheduleLoading = true;
		scheduleError = '';
		try {
			const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
			const lastDay = new Date(year, month + 2, 0).getDate();
			const nextMonth = month === 11 ? 0 : month + 1;
			const nextYear = month === 11 ? year + 1 : year;
			const to = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${lastDay}`;
			const res = await fetch(`/api/availability?from=${from}&to=${to}`);
			if (!res.ok) throw new Error();
			const slots: SlotSummary[] = await res.json();
			const needed = seatsForParty(partySizeAdults, partySizeKids);
			// Include current slot even if "full" from this booking's seats
			availableDates = new Set(
				slots
					.filter(
						(s) =>
							s.remaining >= needed ||
							s.id === data.booking.slotId ||
							(s.id === slotId && s.remaining + seatsForParty(data.booking.partySizeAdults, data.booking.partySizeKids) >= needed)
					)
					.map((s) => s.date)
			);
		} catch {
			scheduleError = 'Could not load availability.';
		} finally {
			scheduleLoading = false;
		}
	}

	async function loadDaySlots(date: string) {
		scheduleLoading = true;
		scheduleError = '';
		try {
			const res = await fetch(`/api/availability?from=${date}&to=${date}`);
			if (!res.ok) throw new Error();
			const slots: SlotSummary[] = await res.json();
			const needed = seatsForParty(partySizeAdults, partySizeKids);
			const currentSeats = seatsForParty(
				data.booking.partySizeAdults,
				data.booking.partySizeKids
			);

			daySlots = slots
				.filter((s) => {
					const effectiveRemaining =
						s.id === data.booking.slotId ? s.remaining + currentSeats : s.remaining;
					return effectiveRemaining >= needed;
				})
				.sort((a, b) => {
					const aPartial = a.bookedSeats > 0 && a.id !== data.booking.slotId ? 0 : 1;
					const bPartial = b.bookedSeats > 0 && b.id !== data.booking.slotId ? 0 : 1;
					if (aPartial !== bPartial) return aPartial - bPartial;
					return a.startTime.localeCompare(b.startTime);
				});
		} catch {
			scheduleError = 'Could not load time slots.';
			daySlots = [];
		} finally {
			scheduleLoading = false;
		}
	}

	function startReschedule() {
		pickingSchedule = true;
		scheduleStep = 'date';
		const d = new Date(selectedDate + 'T12:00:00');
		viewYear = d.getFullYear();
		viewMonth = d.getMonth();
		loadMonthAvailability(viewYear, viewMonth);
	}

	function cancelReschedule() {
		pickingSchedule = false;
		slotId = data.booking.slotId;
		selectedDate = data.booking.date;
		selectedSlot = {
			id: data.booking.slotId,
			date: data.booking.date,
			startTime: data.booking.startTime,
			endTime: data.booking.endTime
		};
	}

	async function pickDate(date: string) {
		selectedDate = date;
		scheduleStep = 'time';
		await loadDaySlots(date);
	}

	function pickSlot(slot: SlotSummary) {
		slotId = slot.id;
		selectedSlot = {
			id: slot.id,
			date: slot.date,
			startTime: slot.startTime,
			endTime: slot.endTime
		};
		pickingSchedule = false;
	}

	// Calendar state for reschedule
	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth());

	$effect(() => {
		if (pickingSchedule && scheduleStep === 'date') {
			loadMonthAvailability(viewYear, viewMonth);
		}
	});

	function getDaysInMonth(year: number, month: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfWeek(year: number, month: number) {
		return new Date(year, month, 1).getDay();
	}

	let calendarDays = $derived.by(() => {
		const daysInMonth = getDaysInMonth(viewYear, viewMonth);
		const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
		const days: Array<{ date: string | null; day: number | null; isPast: boolean }> = [];
		for (let i = 0; i < firstDay; i++) {
			days.push({ date: null, day: null, isPast: false });
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			const dateObj = new Date(dateStr + 'T12:00:00');
			const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			days.push({ date: dateStr, day: d, isPast: dateObj < todayMidnight });
		}
		return days;
	});

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	let canGoPrev = $derived(
		viewYear > today.getFullYear() ||
			(viewYear === today.getFullYear() && viewMonth > today.getMonth())
	);

	async function saveChanges() {
		if (!canSaveParty || !selectedSlot) return;
		saving = true;
		formError = '';
		formSuccess = '';
		try {
			const res = await fetch(`/api/bookings/${encodeURIComponent(data.booking.bookingRef)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					email,
					phone,
					partySizeAdults,
					partySizeKids,
					slotId
				})
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(payload.error ?? payload.message ?? 'Could not save changes');
			}
			formSuccess = 'Your booking has been updated.';
			await invalidateAll();
			name = data.booking.name;
			email = data.booking.email;
			phone = data.booking.phone;
			partySizeAdults = data.booking.partySizeAdults;
			partySizeKids = data.booking.partySizeKids;
			slotId = data.booking.slotId;
			selectedDate = data.booking.date;
			selectedSlot = {
				id: data.booking.slotId,
				date: data.booking.date,
				startTime: data.booking.startTime,
				endTime: data.booking.endTime
			};
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Could not save changes.';
		} finally {
			saving = false;
		}
	}

	async function cancelBooking() {
		cancelling = true;
		formError = '';
		try {
			const res = await fetch(`/api/bookings/${encodeURIComponent(data.booking.bookingRef)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'cancelled' })
			});
			if (!res.ok) throw new Error('Failed to cancel');
			await invalidateAll();
			confirmCancel = false;
		} catch {
			formError = 'Could not cancel booking. Please try again.';
		} finally {
			cancelling = false;
		}
	}
</script>

<svelte:head>
	<title>Manage Booking {data.booking.bookingRef} – The Russell Farm</title>
</svelte:head>

<div class="managePage container">
	<div class="pageHeader">
		{#if data.isLoggedIn}
			<a href="/bookings" class="backLink">← My bookings</a>
		{:else}
			<a href="/" class="backLink">← Home</a>
		{/if}
		<h1>Manage Booking</h1>
		<p class="refLine">
			<span class="badge {badgeClass[data.booking.status]}">{data.booking.status}</span>
			<span class="refCode">{data.booking.bookingRef}</span>
		</p>
	</div>

	{#if !editable}
		<div class="readOnlyNotice">
			{#if data.booking.status === 'cancelled'}
				<p>This booking has been cancelled and can no longer be changed.</p>
			{:else}
				<p>This visit is in the past. Contact us if you need help.</p>
			{/if}
		</div>

		<div class="summaryCard">
			<div class="summaryRow">
				<span>Date</span>
				<strong>{formatDateLong(data.booking.date)}</strong>
			</div>
			<div class="summaryRow">
				<span>Time</span>
				<strong
					>{formatTime(data.booking.startTime)} – {formatTime(data.booking.endTime)}</strong
				>
			</div>
			<div class="summaryRow">
				<span>Name</span>
				<strong>{data.booking.name}</strong>
			</div>
			<div class="summaryRow">
				<span>Party</span>
				<strong>
					{data.booking.partySizeAdults} adult{data.booking.partySizeAdults !== 1 ? 's' : ''}
					{#if data.booking.partySizeKids > 0}
						+ {data.booking.partySizeKids} child{data.booking.partySizeKids !== 1 ? 'ren' : ''}
					{/if}
				</strong>
			</div>
		</div>
	{:else}
		{#if formError}
			<div class="alert alertError">{formError}</div>
		{/if}
		{#if formSuccess}
			<div class="alert alertSuccess">{formSuccess}</div>
		{/if}

		<section class="editSection">
			<h2>Contact</h2>
			<div class="field">
				<label for="name">Full name</label>
				<input id="name" type="text" bind:value={name} required autocomplete="name" />
			</div>
			<div class="field">
				<label for="email">Email</label>
				<input id="email" type="email" bind:value={email} required autocomplete="email" />
			</div>
			<div class="field">
				<label for="phone">Phone</label>
				<input
					use:IMask={phoneMaskConfig}
					id="phone"
					type="tel"
					bind:value={phone}
					required
					autocomplete="tel"
				/>
			</div>
		</section>

		<section class="editSection">
			<h2>Your group</h2>
			<p class="sectionHint">
				Wagon holds {WAGON_SEAT_CAPACITY} seats (1 adult = 2 seats). Using {seatsNeeded} seats.
			</p>
			<div class="partyRow">
				<div class="field">
					<label for="adults">Adults</label>
					<div class="numberInput">
						<button type="button" onclick={() => adjustAdults(-1)} disabled={partySizeAdults <= 0}
							>−</button
						>
						<input id="adults" type="number" value={partySizeAdults} readonly />
						<button
							type="button"
							onclick={() => adjustAdults(1)}
							disabled={partySizeAdults >= maxAdultsForKids(partySizeKids)}>+</button
						>
					</div>
				</div>
				<div class="field">
					<label for="kids">Children</label>
					<div class="numberInput">
						<button type="button" onclick={() => adjustKids(-1)} disabled={partySizeKids <= 0}
							>−</button
						>
						<input id="kids" type="number" value={partySizeKids} readonly />
						<button
							type="button"
							onclick={() => adjustKids(1)}
							disabled={partySizeAdults < 1 || partySizeKids >= maxKidsForAdults(partySizeAdults)}
							>+</button
						>
					</div>
				</div>
			</div>
		</section>

		<section class="editSection">
			<h2>Date & time</h2>
			{#if !pickingSchedule && selectedSlot}
				<div class="scheduleCurrent">
					<div>
						<strong>{formatDateLong(selectedSlot.date)}</strong>
						<p>{formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</p>
					</div>
					<button type="button" class="btn btnSecondary btnSm" onclick={startReschedule}>
						Change date & time
					</button>
				</div>
			{:else if pickingSchedule}
				<div class="reschedulePanel">
					<button type="button" class="textBtn" onclick={cancelReschedule}>← Keep current time</button
					>

					{#if scheduleStep === 'date'}
						<div class="calHeader">
							<button
								type="button"
								class="calNav"
								onclick={prevMonth}
								disabled={!canGoPrev}
								aria-label="Previous month">←</button
							>
							<span>{monthNames[viewMonth]} {viewYear}</span>
							<button type="button" class="calNav" onclick={nextMonth} aria-label="Next month"
								>→</button
							>
						</div>

						{#if scheduleLoading}
							<p class="muted">Loading…</p>
						{:else if scheduleError}
							<p class="errorText">{scheduleError}</p>
						{:else}
							<div class="calGrid calWeekdays">
								{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day (day)}
									<div class="weekday">{day}</div>
								{/each}
							</div>
							<div class="calGrid">
								{#each calendarDays as cell, i (cell.date ?? `e-${i}`)}
									{#if cell.date === null}
										<div class="calCell empty"></div>
									{:else}
										{@const isAvailable = availableDates.has(cell.date)}
										<button
											type="button"
											class="calCell day"
											class:available={isAvailable}
											disabled={cell.isPast || !isAvailable}
											onclick={() => pickDate(cell.date!)}
										>
											{cell.day}
										</button>
									{/if}
								{/each}
							</div>
						{/if}
					{:else}
						<button type="button" class="textBtn" onclick={() => (scheduleStep = 'date')}
							>← Back to calendar</button
						>
						<p class="muted">{formatDateLong(selectedDate)}</p>
						{#if scheduleLoading}
							<p class="muted">Loading times…</p>
						{:else if daySlots.length === 0}
							<p class="errorText">No times fit your group on this date.</p>
						{:else}
							<div class="slotsGrid">
								{#each daySlots as slot (slot.id)}
									<button type="button" class="slotCard" onclick={() => pickSlot(slot)}>
										{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
										<span class="seatLeft"
											>{slot.id === data.booking.slotId
												? 'Current'
												: `${slot.remaining} seats left`}</span
										>
									</button>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</section>

		<div class="actions">
			<button
				type="button"
				class="btn btnPrimary btnLg"
				disabled={saving || !canSaveParty || !name || !email || !phone || pickingSchedule}
				onclick={saveChanges}
			>
				{saving ? 'Saving…' : 'Save changes'}
			</button>
		</div>

		<section class="cancelSection">
			<h2>Cancel booking</h2>
			{#if !confirmCancel}
				<button type="button" class="btn btnDanger" onclick={() => (confirmCancel = true)}>
					Cancel this booking
				</button>
			{:else}
				<p class="cancelWarn">This will free your seats on the wagon. Are you sure?</p>
				<div class="cancelActions">
					<button
						type="button"
						class="btn btnDanger"
						disabled={cancelling}
						onclick={cancelBooking}
					>
						{cancelling ? 'Cancelling…' : 'Yes, cancel booking'}
					</button>
					<button type="button" class="btn btnSecondary" onclick={() => (confirmCancel = false)}>
						Keep booking
					</button>
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	.managePage {
		padding: 2.5rem 1.5rem 4rem;
		max-width: 560px;
	}

	.pageHeader {
		margin-bottom: 1.75rem;
	}

	.pageHeader h1 {
		color: var(--color-forest-dk);
		font-size: 1.75rem;
		margin: 0.5rem 0;
	}

	.backLink {
		background: none;
		border: none;
		color: var(--color-forest);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		font-family: var(--font-sans);
		text-decoration: none;
	}

	.refLine {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
	}

	.refCode {
		font-family: monospace;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.readOnlyNotice {
		background: var(--color-cream);
		border-radius: var(--radius);
		padding: 1rem 1.25rem;
		margin-bottom: 1.25rem;
		color: var(--color-text-muted);
	}

	.readOnlyNotice p {
		margin: 0;
	}

	.summaryCard,
	.editSection {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem;
		margin-bottom: 1.25rem;
	}

	.editSection h2,
	.cancelSection h2 {
		font-size: 1rem;
		color: var(--color-forest-dk);
		margin: 0 0 1rem;
	}

	.sectionHint {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: -0.5rem 0 1rem;
	}

	.summaryRow {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.4rem 0;
		font-size: 0.95rem;
	}

	.summaryRow span {
		color: var(--color-text-muted);
	}

	.field {
		margin-bottom: 0.85rem;
	}

	.field label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.3rem;
	}

	.field input {
		width: 100%;
		padding: 0.65rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 1rem;
	}

	.partyRow {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.numberInput {
		display: flex;
		align-items: center;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--color-white);
	}

	.numberInput input {
		width: 100%;
		text-align: center;
		border: none;
		padding: 0.65rem 0;
		pointer-events: none;
	}

	.numberInput button {
		background: var(--color-cream-dk);
		border: none;
		border-right: 1.5px solid var(--color-border);
		width: 2.5rem;
		font-size: 1.25rem;
		cursor: pointer;
		color: var(--color-forest);
		padding: 0.5rem 0;
	}

	.numberInput button:last-child {
		border-right: none;
		border-left: 1.5px solid var(--color-border);
	}

	.numberInput button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.scheduleCurrent {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.scheduleCurrent p {
		margin: 0.25rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.textBtn {
		background: none;
		border: none;
		color: var(--color-forest);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		margin-bottom: 1rem;
		font-family: var(--font-sans);
	}

	.calHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		font-weight: 600;
		color: var(--color-forest-dk);
	}

	.calNav {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		width: 2rem;
		height: 2rem;
		cursor: pointer;
	}

	.calNav:disabled {
		opacity: 0.3;
	}

	.calGrid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.weekday {
		text-align: center;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		padding: 0.25rem 0;
	}

	.calCell {
		aspect-ratio: 1;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		border: 1px solid transparent;
		background: none;
		font-family: var(--font-sans);
	}

	.calCell.day {
		color: #ccc;
		cursor: not-allowed;
	}

	.calCell.day.available {
		background: #d1fae5;
		border-color: #6ee7b7;
		color: var(--color-forest-dk);
		cursor: pointer;
		font-weight: 600;
	}

	.slotsGrid {
		display: grid;
		gap: 0.5rem;
	}

	.slotCard {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.85rem 1rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-white);
		cursor: pointer;
		font-family: var(--font-sans);
		font-weight: 600;
		color: var(--color-forest-dk);
	}

	.slotCard:hover {
		border-color: var(--color-forest);
		background: #f0faf0;
	}

	.seatLeft {
		font-weight: 400;
		font-size: 0.8rem;
		color: var(--color-forest);
	}

	.muted {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.errorText {
		color: var(--color-barn-red);
		font-size: 0.9rem;
	}

	.actions {
		margin: 1.5rem 0;
	}

	.actions .btn {
		width: 100%;
	}

	.cancelSection {
		border-top: 1px solid var(--color-border);
		padding-top: 1.5rem;
		margin-top: 1rem;
	}

	.cancelWarn {
		color: var(--color-barn-red);
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
	}

	.cancelActions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
</style>
