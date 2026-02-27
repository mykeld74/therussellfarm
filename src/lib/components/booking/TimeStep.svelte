<script lang="ts">
	import type { SlotSummary } from '$lib/types';

	let {
		date,
		onSlotSelected,
		onBack
	}: {
		date: string;
		onSlotSelected: (slot: SlotSummary) => void;
		onBack: () => void;
	} = $props();

	let slots = $state<SlotSummary[]>([]);
	let loading = $state(true);
	let error = $state('');

	$effect(() => {
		if (date) fetchSlots(date);
	});

	async function fetchSlots(d: string) {
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/availability?from=${d}&to=${d}`);
			if (!res.ok) throw new Error();
			slots = await res.json();
		} catch {
			error = 'Could not load time slots. Please go back and try again.';
		} finally {
			loading = false;
		}
	}

	function formatTime(t: string): string {
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
	}

	function formatDisplayDate(dateStr: string): string {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="timeStep">
	<button class="backBtn" onclick={onBack}>← Back to calendar</button>
	<h2>Choose a Time</h2>
	<p class="stepHint">
		<strong>{formatDisplayDate(date)}</strong> — select a time slot below.
	</p>

	{#if loading}
		<div class="loadingState">Loading time slots…</div>
	{:else if error}
		<div class="alert alertError">{error}</div>
	{:else if slots.length === 0}
		<div class="emptyState">
			<p>No time slots are available on this date.</p>
			<button class="btn btnSecondary" onclick={onBack}>Choose a different date</button>
		</div>
	{:else}
		<div class="slotsGrid">
			{#each slots as slot}
				{@const isFull = slot.remaining <= 0}
				<button
					class="slotCard"
					class:full={isFull}
					disabled={isFull}
					onclick={() => onSlotSelected(slot)}
				>
					<div class="slotTime">
						{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
					</div>
					<div class="slotCapacity" class:full={isFull}>
						{#if isFull}
							Booked
						{:else}
							Available
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.timeStep h2 {
		color: var(--color-forest-dk);
		font-size: 1.5rem;
		margin-bottom: 0.375rem;
	}

	.stepHint {
		color: var(--color-text-muted);
		margin-bottom: 1.75rem;
	}

	.backBtn {
		background: none;
		border: none;
		color: var(--color-forest);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		margin-bottom: 1.25rem;
		font-family: var(--font-sans);
		transition: color 0.15s;
	}

	.backBtn:hover {
		color: var(--color-forest-dk);
	}

	.slotsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.slotCard {
		background: var(--color-white);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1rem;
		cursor: pointer;
		text-align: left;
		font-family: var(--font-sans);
		transition:
			border-color 0.15s,
			background 0.15s,
			box-shadow 0.15s;
	}

	.slotCard:hover:not(:disabled) {
		border-color: var(--color-forest);
		background: #f0faf0;
		box-shadow: var(--shadow-sm);
	}

	.slotCard.full {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slotTime {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--color-forest-dk);
		margin-bottom: 0.375rem;
	}

	.slotCapacity {
		font-size: 0.85rem;
		color: var(--color-forest);
	}

	.slotCapacity.full {
		color: var(--color-text-muted);
	}

	.loadingState,
	.emptyState {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted);
	}

	.emptyState p {
		margin-bottom: 1.25rem;
	}
</style>
