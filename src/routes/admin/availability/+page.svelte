<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { formatDate, formatTime } from '$lib/utils';

	let { data }: { data: PageData } = $props();

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
	let newDate = $state('');
	let newStartTime = $state('10:00');
	let newEndTime = $state('');
	let endTimeTouched = $state(false);
	// Each slot is for one group; capacity is fixed at 1
	let newCapacity = $state(1);
	let formError = $state('');
	let formSuccess = $state('');
	let submitting = $state(false);
	let fullDayLoading = $state(false);
	let deletingInactive = $state(false);
	let updatingId = $state<number | null>(null);
	let seedMessage = $state('');
	let seedError = $state('');
	let seeding = $state(false);

	$effect(() => {
		if (!endTimeTouched) {
			newEndTime = addMinutesToTime(newStartTime, 15);
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
					maxCapacity: newCapacity
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
					maxCapacity: newCapacity
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
		<!-- Create slot form -->
		<div class="createPanel">
			<h2>Add New Slot</h2>

			{#if formError}
				<div class="alert alertError">{formError}</div>
			{/if}
			{#if formSuccess}
				<div class="alert alertSuccess">{formSuccess}</div>
			{/if}

			<form onsubmit={createSlot} class="slotForm">
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
					<label for="capacity">Max Groups (capacity)</label>
					<div class="numberInput">
						<button type="button" onclick={() => (newCapacity = Math.max(1, newCapacity - 1))}
							>−</button
						>
						<input id="capacity" type="number" bind:value={newCapacity} min="1" max="50" readonly />
						<button type="button" onclick={() => (newCapacity = Math.min(50, newCapacity + 1))}
							>+</button
						>
					</div>
				</div>

				<button
					type="button"
					class="btn btnSecondary"
					style="width:100%; margin-bottom: 0.5rem;"
					disabled={submitting || fullDayLoading || !newDate}
					onclick={createFullDay}
				>
					{fullDayLoading ? 'Adding full day…' : 'Add full day (10:00–4:00 every 15 min)'}
				</button>

				<button type="submit" class="btn btnPrimary" style="width:100%;" disabled={submitting}>
					{submitting ? 'Creating…' : '+ Add Slot'}
				</button>
			</form>

			<div class="seedSection">
				<h3>Holiday slots (Sat & Sun)</h3>
				<p class="seedDesc">
					Add slots for Fri–Sun: Friday after Thanksgiving through the last Sunday before Christmas,
					every 15&nbsp;min from 10:00&nbsp;am–4:00&nbsp;pm.
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
					{#each data.slots as slot}
						<div class="slotRow" class:inactive={!slot.isActive}>
							<div class="slotInfo">
								<div class="slotDate">{formatDate(slot.date)}</div>
								<div class="slotTime">
									{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
								</div>
							</div>

							<div class="slotCap">
								{#if slot.remaining > 0}
									<span class="badge badgeConfirmed">Available</span>
								{:else}
									<span class="badge badgeCancelled">Booked</span>
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

	/* Create panel */
	.createPanel {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		position: sticky;
		top: calc(var(--header-height) + 2rem);
	}

	.createPanel h2,
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

	.seedDesc {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
		line-height: 1.4;
	}

	.slotForm .field {
		margin-bottom: 1rem;
	}

	.slotForm .field label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 0.3rem;
		display: block;
	}

	.slotForm input {
		width: 100%;
		padding: 0.55rem 0.75rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		background: var(--color-white);
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

		.createPanel {
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
