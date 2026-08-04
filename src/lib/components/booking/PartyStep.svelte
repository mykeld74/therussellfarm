<script lang="ts">
	import type { BookingFormData } from '$lib/types';
	import {
		WAGON_SEAT_CAPACITY,
		seatsForParty,
		maxAdultsForKids,
		maxKidsForAdults,
		partyFitsWagon
	} from '$lib/booking-capacity';
	import { untrack } from 'svelte';

	let {
		initialData,
		onSubmit
	}: {
		initialData: BookingFormData;
		onSubmit: (data: Partial<BookingFormData>) => void;
	} = $props();

	let partySizeAdults = $state(untrack(() => initialData.partySizeAdults || 2));
	let partySizeKids = $state(untrack(() => initialData.partySizeKids ?? 0));

	let seatsNeeded = $derived(seatsForParty(partySizeAdults, partySizeKids));
	let seatsRemaining = $derived(WAGON_SEAT_CAPACITY - seatsNeeded);
	let canContinue = $derived(partyFitsWagon(partySizeAdults, partySizeKids));

	function adjustAdults(delta: number) {
		const next = partySizeAdults + delta;
		const maxAdults = maxAdultsForKids(partySizeKids);
		partySizeAdults = Math.max(0, Math.min(maxAdults, next));
	}

	function adjustKids(delta: number) {
		const next = partySizeKids + delta;
		if (delta < 0) {
			partySizeKids = Math.max(0, next);
			return;
		}
		partySizeKids = Math.min(maxKidsForAdults(partySizeAdults), Math.max(0, next));
	}

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canContinue) return;
		onSubmit({ partySizeAdults, partySizeKids });
	}
</script>

<div class="partyStep">
	<h2>Your Group</h2>
	<p class="stepHint">
		Each wagon holds up to 8 adults or 16 children (1 adult uses 2 child seats). We'll show times
		that fit your group and help fill each wagon before it heads out.
	</p>

	<form class="partyForm" onsubmit={handleSubmit}>
		<div class="partyRow">
			<div class="field">
				<label for="adults">Adults</label>
				<div class="numberInput">
					<button
						type="button"
						onclick={() => adjustAdults(-1)}
						aria-label="Decrease adults"
						disabled={partySizeAdults <= 0}>−</button
					>
					<input id="adults" type="number" value={partySizeAdults} min="0" max="8" readonly />
					<button
						type="button"
						onclick={() => adjustAdults(1)}
						aria-label="Increase adults"
						disabled={partySizeAdults >= maxAdultsForKids(partySizeKids)}>+</button
					>
				</div>
			</div>

			<div class="field">
				<label for="kids">Children</label>
				<div class="numberInput">
					<button
						type="button"
						onclick={() => adjustKids(-1)}
						aria-label="Decrease children"
						disabled={partySizeKids <= 0}>−</button
					>
					<input id="kids" type="number" value={partySizeKids} min="0" max="14" readonly />
					<button
						type="button"
						onclick={() => adjustKids(1)}
						aria-label="Increase children"
						disabled={partySizeAdults < 1 || partySizeKids >= maxKidsForAdults(partySizeAdults)}
						>+</button
					>
				</div>
			</div>
		</div>

		<div class="seatMeter" class:overCapacity={!canContinue && partySizeAdults >= 1}>
			<div class="seatMeterBar">
				<div
					class="seatMeterFill"
					style="width: {Math.min(100, (seatsNeeded / WAGON_SEAT_CAPACITY) * 100)}%"
				></div>
			</div>
			<p class="seatMeterLabel">
				{#if partySizeAdults < 1}
					Add at least one adult to continue.
				{:else}
					{seatsNeeded} of {WAGON_SEAT_CAPACITY} wagon seats
					{#if seatsRemaining > 0}
						· {seatsRemaining} seat{seatsRemaining === 1 ? '' : 's'} free for other families
					{:else}
						· full wagon
					{/if}
				{/if}
			</p>
		</div>

		<button type="submit" class="btn btnPrimary btnLg continueBtn" disabled={!canContinue}>
			Continue to Dates →
		</button>
	</form>
</div>

<style>
	.partyStep h2 {
		color: var(--color-forest-dk);
		font-size: 1.5rem;
		margin-bottom: 0.375rem;
	}

	.stepHint {
		color: var(--color-text-muted);
		margin-bottom: 1.75rem;
		max-width: 36rem;
		line-height: 1.5;
	}

	.partyForm {
		max-width: 480px;
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
		font-size: 1rem;
		font-family: var(--font-sans);
		color: var(--color-text);
		pointer-events: none;
	}

	.numberInput input:focus {
		outline: none;
	}

	.numberInput button {
		background: var(--color-cream-dk);
		border: none;
		border-right: 1.5px solid var(--color-border);
		width: 2.5rem;
		height: 100%;
		font-size: 1.25rem;
		cursor: pointer;
		color: var(--color-forest);
		transition: background 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	.numberInput button:last-child {
		border-right: none;
		border-left: 1.5px solid var(--color-border);
	}

	.numberInput button:hover:not(:disabled) {
		background: var(--color-border);
	}

	.numberInput button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.seatMeter {
		margin-top: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.seatMeterBar {
		height: 0.5rem;
		background: var(--color-cream-dk);
		border-radius: 999px;
		overflow: hidden;
	}

	.seatMeterFill {
		height: 100%;
		background: var(--color-forest);
		border-radius: 999px;
		transition: width 0.2s ease;
	}

	.seatMeter.overCapacity .seatMeterFill {
		background: var(--color-barn-red);
	}

	.seatMeterLabel {
		margin: 0.5rem 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.continueBtn {
		width: 100%;
	}
</style>
