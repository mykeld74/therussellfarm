<script lang="ts">
	import type { WagonType } from '$lib/types';
	import { WAGON_CONFIG, WAGON_TYPES } from '$lib/booking-capacity';
	import { untrack } from 'svelte';

	let {
		initialType = null,
		onSubmit
	}: {
		initialType?: WagonType | null;
		onSubmit: (wagonType: WagonType) => void;
	} = $props();

	let selected = $state<WagonType | null>(untrack(() => initialType));
</script>

<div class="rideStep">
	<h2>Choose Your Ride</h2>
	<p class="stepHint">
		We offer two wagon rides out to the Christmas tree fields. Pick the one that fits your group.
	</p>

	<div class="rideOptions" role="radiogroup" aria-label="Wagon type">
		{#each WAGON_TYPES as type (type)}
			{@const config = WAGON_CONFIG[type]}
			<button
				type="button"
				class="rideOption"
				class:selected={selected === type}
				role="radio"
				aria-checked={selected === type}
				onclick={() => (selected = type)}
			>
				<span class="rideLabel">{config.label}</span>
				<span class="rideMeta"
					>Up to {config.maxAdults} adults · {config.seatCapacity} seats · every {config.intervalMinutes}
					min</span
				>
				<span class="rideDesc">{config.description}</span>
			</button>
		{/each}
	</div>

	<button
		type="button"
		class="btn btnPrimary btnLg continueBtn"
		disabled={!selected}
		onclick={() => selected && onSubmit(selected)}
	>
		Continue to Your Group →
	</button>
</div>

<style>
	.rideStep h2 {
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

	.rideOptions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 36rem;
		margin-bottom: 1.5rem;
	}

	.rideOption {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		text-align: left;
		padding: 1rem 1.15rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-white);
		cursor: pointer;
		font-family: var(--font-sans);
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.rideOption:hover {
		border-color: var(--color-forest);
	}

	.rideOption.selected {
		border-color: var(--color-forest);
		background: color-mix(in srgb, var(--color-forest) 8%, white);
	}

	.rideLabel {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--color-forest-dk);
	}

	.rideMeta {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-forest);
	}

	.rideDesc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
		margin-top: 0.15rem;
	}

	.continueBtn {
		width: 100%;
		max-width: 36rem;
	}
</style>
