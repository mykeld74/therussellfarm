<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { formatDate, formatTime } from '$lib/utils';
	import { WAGON_CONFIG, WAGON_TYPES, type WagonType } from '$lib/booking-capacity';
	import { operatingWindowLabel } from '$lib/wagon-hours';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function addMinutesToTime(time: string, minutes: number): string {
		const [h, m] = time.split(':').map((part) => Number(part));
		if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
		const date = new Date(2000, 0, 1, h, m);
		date.setMinutes(date.getMinutes() + minutes);
		const hh = String(date.getHours()).padStart(2, '0');
		const mm = String(date.getMinutes()).padStart(2, '0');
		return `${hh}:${mm}`;
	}

	// Form state
	let newWagonType = $state<WagonType>('horse');
	let newDate = $state('');
	let newStartTime = $state('10:00');
	let newEndTime = $state('');
	let endTimeTouched = $state(false);
	let newCapacity = $state<number>(WAGON_CONFIG.horse.seatCapacity);
	let formError = $state('');
	let formSuccess = $state('');
	let submitting = $state(false);
	let fullDayLoading = $state(false);
	let deletingInactive = $state(false);
	let updatingId = $state<number | null>(null);
	let seedMessage = $state('');
	let seedError = $state('');
	let seeding = $state(false);
	let savingReservations = $state(false);
	let togglingPause = $state(false);

	let allowReservationsFrom = $derived(
		form && 'allowReservationsFrom' in form && typeof form.allowReservationsFrom === 'string'
			? form.allowReservationsFrom
			: data.allowReservationsFrom
	);

	let wagonInterval = $derived(WAGON_CONFIG[newWagonType].intervalMinutes);
	let dayWindowLabel = $derived(newDate ? operatingWindowLabel(newDate) : operatingWindowLabel());

	$effect(() => {
		// When wagon type changes, reset capacity to that type's default
		newCapacity = WAGON_CONFIG[newWagonType].seatCapacity;
		endTimeTouched = false;
	});

	$effect(() => {
		if (!endTimeTouched) {
			newEndTime = addMinutesToTime(newStartTime, wagonInterval);
		}
	});

	async function seedHolidaySlots() {
		seeding = true;
		seedMessage = '';
		seedError = '';
		try {
			const res = await fetch('/api/admin/availability/seed', { method: 'POST' });
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'Failed to seed');
			seedMessage = data.message ?? `Created ${data.created} slots.`;
			await invalidateAll();
		} catch (e) {
			seedError = e instanceof Error ? e.message : 'Failed to seed holiday slots.';
		} finally {
			seeding = false;
		}
	}

	async function createSlot(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;
		formError = '';
		formSuccess = '';
		try {
			const res = await fetch('/api/admin/availability', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: newDate,
					startTime: newStartTime,
					endTime: newEndTime,
					maxCapacity: newCapacity,
					wagonType: newWagonType
				})
			});
			if (!res.ok) throw new Error('Failed to create');
			formSuccess = 'Slot created!';
			newDate = '';
			await invalidateAll();
		} catch {
			formError = 'Failed to create slot. Please try again.';
		} finally {
			submitting = false;
		}
	}

	async function createFullDay() {
		if (!newDate) {
			formError = 'Pick a date first to add a full day of slots.';
			return;
		}
		fullDayLoading = true;
		formError = '';
		formSuccess = '';
		try {
			const res = await fetch('/api/admin/availability/full-day', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: newDate,
					maxCapacity: newCapacity,
					wagonType: newWagonType
				})
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(payload.error ?? 'Failed to create full day of slots.');
			}
			formSuccess = payload.message ?? 'Full day of slots created.';
			await invalidateAll();
		} catch (err) {
			formError =
				err instanceof Error ? err.message : 'Failed to create full day of slots. Please try again.';
		} finally {
			fullDayLoading = false;
		}
	}

	async function toggleSlot(id: number, isActive: boolean) {
		updatingId = id;
		try {
			await fetch(`/api/admin/availability/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !isActive })
			});
			await invalidateAll();
		} finally {
			updatingId = null;
		}
	}

	async function deleteSlot(id: number) {
		if (!confirm('Delete this slot? Existing bookings will remain.')) return;
		updatingId = id;
		try {
			await fetch(`/api/admin/availability/${id}`, { method: 'DELETE' });
			await invalidateAll();
		} finally {
			updatingId = null;
		}
	}

	async function deleteInactiveSlots() {
		if (
			!confirm(
				'Delete all inactive upcoming slots? This cannot be undone, but bookings on other slots will remain.'
			)
		)
			return;

		deletingInactive = true;
		formError = '';
		formSuccess = '';
		try {
			const res = await fetch('/api/admin/availability/inactive', { method: 'DELETE' });
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(payload.error ?? 'Failed to delete inactive slots.');
			}
			formSuccess = payload.message ?? 'Inactive slots deleted.';
			await invalidateAll();
		} catch (err) {
			formError =
				err instanceof Error ? err.message : 'Failed to delete inactive slots. Please try again.';
		} finally {
			deletingInactive = false;
		}
	}

	// Get tomorrow as minimum date
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const minDate = tomorrow.toISOString().split('T')[0];
</script>

<svelte:head>
	<title>Availability – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<h1 class="adminH1">Availability</h1>

	<div class="availLayout">
		<div class="sidebarCol">
			<!-- Create slot form -->
			<div class="sidePanel">
				<h2>Add New Slot</h2>

				{#if formError}
					<div class="alert alertError">{formError}</div>
				{/if}
				{#if formSuccess}
					<div class="alert alertSuccess">{formSuccess}</div>
				{/if}

				<form onsubmit={createSlot} class="slotForm">
					<div class="field">
						<span class="fieldLabel" id="wagonTypeLabel">Wagon type</span>
						<div class="wagonTypeRadios" role="radiogroup" aria-labelledby="wagonTypeLabel">
							{#each WAGON_TYPES as type (type)}
								<label class="wagonTypeOption" class:selected={newWagonType === type}>
									<input
										type="radio"
										name="wagonType"
										value={type}
										bind:group={newWagonType}
									/>
									<span class="wagonTypeText">
										<span class="wagonTypeName">{WAGON_CONFIG[type].shortLabel}</span>
										<span class="wagonTypeMeta"
											>{WAGON_CONFIG[type].seatCapacity} seats · every {WAGON_CONFIG[type]
												.intervalMinutes} min</span
										>
									</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="field">
						<label for="slotDate">Date</label>
						<input id="slotDate" type="date" bind:value={newDate} min={minDate} required />
					</div>

					<div class="timeRow">
						<div class="field">
							<label for="start-time">Start Time</label>
							<input
								id="start-time"
								type="time"
								bind:value={newStartTime}
								oninput={() => (endTimeTouched = false)}
								required
							/>
						</div>
						<div class="field">
							<label for="end-time">End Time</label>
							<input
								id="end-time"
								type="time"
								bind:value={newEndTime}
								oninput={() => (endTimeTouched = true)}
								required
							/>
						</div>
					</div>

					<div class="field">
						<label for="capacity">Wagon seats (capacity)</label>
						<div class="numberInput">
							<button type="button" onclick={() => (newCapacity = Math.max(1, newCapacity - 1))}
								>−</button
							>
							<input
								id="capacity"
								type="number"
								bind:value={newCapacity}
								min="1"
								max="50"
								readonly
							/>
							<button type="button" onclick={() => (newCapacity = Math.min(50, newCapacity + 1))}
								>+</button
							>
						</div>
						<span class="fieldHint"
							>Default {WAGON_CONFIG[newWagonType].seatCapacity} — 1 adult = 2 seats, 1 child = 1
							seat. Interval {wagonInterval} min.</span
						>
					</div>

					<button
						type="button"
						class="btn btnSecondary"
						style="width:100%; margin-bottom: 0.5rem;"
						disabled={submitting || fullDayLoading || !newDate}
						onclick={createFullDay}
					>
						{fullDayLoading
							? 'Adding full day…'
							: `Add full day (${dayWindowLabel} every ${wagonInterval} min)`}
					</button>

					<button type="submit" class="btn btnPrimary" style="width:100%;" disabled={submitting}>
						{submitting ? 'Creating…' : '+ Add Slot'}
					</button>
				</form>

				<div class="seedSection">
					<h3>Holiday slots (Sat & Sun)</h3>
					<p class="seedDesc">
						Add Fri–Sun slots from the Friday after Thanksgiving through the last Sunday before
						Christmas: horse every 15&nbsp;min (16 seats) and tractor every 30&nbsp;min (24 seats).
						Friday and Saturday run 10:00&nbsp;am–4:00&nbsp;pm. Sundays run 12:30–3:45&nbsp;pm.
					</p>
					{#if seedError}
						<div class="alert alertError">{seedError}</div>
					{/if}
					{#if seedMessage}
						<div class="alert alertSuccess">{seedMessage}</div>
					{/if}
					<button
						type="button"
						class="btn btnSecondary"
						style="width:100%;"
						disabled={seeding}
						onclick={seedHolidaySlots}
					>
						{seeding ? 'Seeding…' : 'Seed holiday slots'}
					</button>
				</div>
			</div>

			<div class="sidePanel">
				<h2>Allow Reservations</h2>
				<p class="reservationsDesc">
					Pause stops new bookings until you resume them. The open date controls when booking
					first becomes available.
				</p>
				{#if form?.pauseSuccess}
					<div class="alert alertSuccess">
						{data.reservationsPaused ? 'Registrations paused.' : 'Registrations resumed.'}
					</div>
				{/if}
				<form
					method="POST"
					action="?/toggleReservationsPause"
					class="pauseForm"
					use:enhance={() => {
						togglingPause = true;
						return async ({ update }) => {
							await update();
							togglingPause = false;
						};
					}}
				>
					<p class="pauseStatus" class:paused={data.reservationsPaused}>
						{data.reservationsPaused ? 'Registrations are paused' : 'Registrations are open'}
					</p>
					<button
						type="submit"
						class="btn {data.reservationsPaused ? 'btnPrimary' : 'btnDanger'}"
						style="width:100%;"
						disabled={togglingPause}
					>
						{togglingPause
							? 'Saving…'
							: data.reservationsPaused
								? 'Resume registrations'
								: 'Pause registrations'}
					</button>
				</form>

				{#if form?.reservationsError}
					<div class="alert alertError">{form.reservationsError}</div>
				{/if}
				{#if form?.reservationsSuccess}
					<div class="alert alertSuccess">Reservation open date saved.</div>
				{/if}
				<form
					method="POST"
					action="?/saveReservationsOpen"
					class="reservationsForm"
					use:enhance={() => {
						savingReservations = true;
						return async ({ update }) => {
							await update({ reset: false });
							savingReservations = false;
						};
					}}
				>
					<div class="field">
						<label for="allowReservationsFrom">Open booking on</label>
						<input
							id="allowReservationsFrom"
							name="allowReservationsFrom"
							type="date"
							value={allowReservationsFrom}
						/>
					</div>
					<button
						type="submit"
						class="btn btnPrimary"
						style="width:100%;"
						disabled={savingReservations}
					>
						{savingReservations ? 'Saving…' : 'Save open date'}
					</button>
				</form>
			</div>
		</div>

		<!-- Existing slots -->
		<div class="slotsPanel">
			<div class="slotsHeader">
				<h2>Upcoming Slots ({data.slots.length})</h2>
				<button
					type="button"
					class="btn btnSm btnDanger"
					disabled={deletingInactive}
					onclick={deleteInactiveSlots}
				>
					{deletingInactive ? 'Deleting inactive…' : 'Delete all inactive'}
				</button>
			</div>

			{#if data.slots.length === 0}
				<div class="emptyPanel">
					<p>No upcoming slots yet. Add some slots on the left to open up bookings.</p>
				</div>
			{:else}
				<div class="slotsList">
					{#each data.slots as slot (slot.id)}
						<div class="slotRow" class:inactive={!slot.isActive}>
							<div class="slotInfo">
								<div class="slotDate">{formatDate(slot.date)}</div>
								<div class="slotTime">
									{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
									<span class="wagonBadge"
										>{WAGON_CONFIG[slot.wagonType as WagonType]?.shortLabel ??
											slot.wagonType}</span
									>
								</div>
							</div>

							<div class="slotCap">
								{#if slot.remaining > 0}
									<span class="badge badgeConfirmed"
										>{slot.remaining}/{slot.maxCapacity} seats
										{#if slot.bookedCount > 0}
											· {slot.bookedCount} group{slot.bookedCount === 1 ? '' : 's'}
										{/if}
									</span>
								{:else}
									<span class="badge badgeCancelled">Full</span>
								{/if}
							</div>

							<div class="slotStatus">
								{#if slot.isActive}
									<span class="badge badgeConfirmed">Active</span>
								{:else}
									<span class="badge badgeCancelled">Inactive</span>
								{/if}
							</div>

							<div class="slotActions">
								<button
									class="btn btnSm btnSecondary"
									disabled={updatingId === slot.id}
									onclick={() => toggleSlot(slot.id, slot.isActive)}
								>
									{slot.isActive ? 'Deactivate' : 'Activate'}
								</button>
								<button
									class="btn btnSm btnDanger"
									disabled={updatingId === slot.id || slot.bookedCount > 0}
									onclick={() => deleteSlot(slot.id)}
									title={slot.bookedCount > 0
										? 'Cannot delete a slot with bookings'
										: 'Delete slot'}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.adminPage {
		max-width: 1280px;
	}

	.availLayout {
		display: grid;
		grid-template-columns: 300px 1fr;
		gap: 2rem;
		align-items: start;
	}

	.sidebarCol {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		position: sticky;
		top: calc(var(--header-height) + 2rem);
	}

	.sidePanel {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	.sidePanel h2,
	.slotsHeader h2 {
		font-size: 1rem;
		color: var(--color-text);
		margin-bottom: 1.25rem;
	}

	.slotsHeader {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.seedSection {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	.seedSection h3 {
		font-size: 0.95rem;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.reservationsDesc,
	.seedDesc {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.sidePanel > .reservationsDesc {
		margin-top: -0.75rem;
	}

	.pauseForm {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.pauseStatus {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-forest);
	}

	.pauseStatus.paused {
		color: var(--color-barn-red, #9b2c2c);
	}

	.reservationsForm {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.reservationsForm .field {
		margin: 0;
	}

	.reservationsForm .field label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.3rem;
		display: block;
	}

	.reservationsForm input[type='date'] {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		background: var(--color-white);
	}

	.slotForm .field {
		margin-bottom: 1rem;
	}

	.slotForm .field > label,
	.slotForm .fieldLabel {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.3rem;
		display: block;
	}

	.slotForm .fieldHint {
		display: block;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.35rem;
		line-height: 1.3;
	}

	.slotForm .field > input,
	.slotForm .timeRow input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		background: var(--color-white);
	}

	.wagonTypeRadios {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.wagonTypeOption {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
		margin: 0;
		padding: 0.7rem 0.65rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-white);
		cursor: pointer;
		font-weight: 400;
		color: var(--color-text);
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.wagonTypeOption:hover {
		border-color: var(--color-forest);
	}

	.wagonTypeOption.selected {
		border-color: var(--color-forest);
		background: color-mix(in srgb, var(--color-forest) 8%, white);
		box-shadow: inset 0 0 0 1px var(--color-forest);
	}

	.wagonTypeOption:focus-within {
		outline: 2px solid var(--color-forest);
		outline-offset: 1px;
	}

	.wagonTypeOption input[type='radio'] {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: 0;
		padding: 0;
	}

	.wagonTypeText {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		width: 100%;
	}

	.wagonTypeName {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-forest-dk);
		line-height: 1.2;
	}

	.wagonTypeMeta {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		line-height: 1.35;
	}

	.wagonTypeOption.selected .wagonTypeName {
		color: var(--color-forest);
	}

	.wagonBadge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.1rem 0.4rem;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-radius: 999px;
		background: var(--color-cream-dk);
		color: var(--color-forest);
		vertical-align: middle;
	}

	.timeRow {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.numberInput {
		display: flex;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.numberInput input {
		border: none;
		text-align: center;
		padding: 0.55rem 0;
		font-size: 0.9rem;
		pointer-events: none;
	}

	.numberInput button {
		background: var(--color-cream-dk);
		border: none;
		width: 2.25rem;
		font-size: 1.1rem;
		cursor: pointer;
		color: var(--color-forest);
		flex-shrink: 0;
	}

	.numberInput button:first-child {
		border-right: 1.5px solid var(--color-border);
	}

	.numberInput button:last-child {
		border-left: 1.5px solid var(--color-border);
	}

	/* Slots panel */
	.slotsList {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slotRow {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1rem 1.25rem;
		display: grid;
		grid-template-columns: 1fr auto auto auto;
		align-items: center;
		gap: 1.25rem;
		transition: box-shadow 0.15s;
	}

	.slotRow:hover {
		box-shadow: var(--shadow-sm);
	}

	.slotRow.inactive {
		opacity: 0.6;
	}

	.slotDate {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.2rem;
	}

	.slotTime {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.slotCap {
		min-width: 80px;
		text-align: center;
	}

	.slotActions {
		display: flex;
		gap: 0.4rem;
	}

	@media (max-width: 900px) {
		.availLayout {
			grid-template-columns: 1fr;
		}

		.sidebarCol {
			position: static;
		}
	}

	@media (max-width: 600px) {
		.slotRow {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}

		.slotActions {
			justify-content: flex-start;
		}
	}
</style>
