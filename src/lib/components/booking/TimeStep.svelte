<script lang="ts">
	import type { SlotSummary } from '$lib/types';
	import { seatsForParty } from '$lib/booking-capacity';

	let {
		date,
		partySizeAdults,
		partySizeKids,
		onSlotSelected,
		onBack
	}: {
		date: string;
		partySizeAdults: number;
		partySizeKids: number;
		onSlotSelected: (slot: SlotSummary) => void;
		onBack: () => void;
	} = $props();

	let slots = $state<SlotSummary[]>([]);
	let loading = $state(true);
	let error = $state('');

	let seatsNeeded = $derived(seatsForParty(partySizeAdults, partySizeKids));

	/** Slots that fit this party, partially filled first so wagons fill before new ones open. */
	let displaySlots = $derived(
		slots
			.filter((s) => s.remaining >= seatsNeeded)
			.slice()
			.sort((a, b) => {
				const aPartial = a.bookedSeats > 0 ? 0 : 1;
				const bPartial = b.bookedSeats > 0 ? 0 : 1;
				if (aPartial !== bPartial) return aPartial - bPartial;
				// Fuller wagons first among partials
				if (aPartial === 0 && b.bookedSeats !== a.bookedSeats) {
					return b.bookedSeats - a.bookedSeats;
				}
				return a.startTime.localeCompare(b.startTime);
			})
	);

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

	function seatLabel(remaining: number): string {
		if (remaining <= 0) return 'Full';
		return `${remaining} seat${remaining === 1 ? '' : 's'} left`;
	}
</script>

<div class="timeStep">
	<button class="backBtn" onclick={onBack}>← Back to calendar</button>
	<h2>Choose a Time</h2>
	<p class="stepHint">
		<strong>{formatDisplayDate(date)}</strong> — wagons that fit your group are listed first
		(partially filled wagons preferred).
	</p>

	{#if loading}
		<div class="loadingState">Loading time slots…</div>
	{:else if error}
		<div class="alert alertError">{error}</div>
	{:else if displaySlots.length === 0}
		<div class="emptyState">
			<p>No wagons on this date have enough seats for your group.</p>
			<button class="btn btnSecondary" onclick={onBack}>Choose a different date</button>
		</div>
	{:else}
		<div class="slotsGrid">
			{#each displaySlots as slot (slot.id)}
				{@const isPartial = slot.bookedSeats > 0}
				<button class="slotCard" class:partial={isPartial} onclick={() => onSlotSelected(slot)}>
					<div class="slotTime">
						{formatTime(slot.startTime)} – {formatTime(slot.endTime)}
					</div>
					<div class="slotCapacity">
						{seatLabel(slot.remaining)}
						{#if isPartial}
							<span class="partialTag">Filling up</span>
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

	.slotCard:hover {
		border-color: var(--color-forest);
		background: #f0faf0;
		box-shadow: var(--shadow-sm);
	}

	.slotCard.partial {
		border-color: #6ee7b7;
		background: #f0fdf4;
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.partialTag {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-forest-dk);
		background: #d1fae5;
		padding: 0.15rem 0.4rem;
		border-radius: var(--radius);
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
