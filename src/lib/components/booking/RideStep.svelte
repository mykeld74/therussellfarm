<script lang="ts">
	import type { WagonType } from '$lib/types';
	import { WAGON_CONFIG, WAGON_TYPES } from '$lib/booking-capacity';

	let { onSubmit }: { onSubmit: (wagonType: WagonType) => void } = $props();
</script>

<div class="rideStep">
	<h2>Choose Your Ride</h2>
	<p class="stepHint">
		We offer two wagon rides out to the Christmas tree fields. Pick the one that fits your group.
	</p>

	<div class="rideOptions">
		{#each WAGON_TYPES as type (type)}
			{@const config = WAGON_CONFIG[type]}
			<button type="button" class="rideOption" onclick={() => onSubmit(type)}>
				<span class="rideLabel">{config.label}</span>
				<span class="rideMeta"
					>Up to {config.maxAdults} adults · {config.seatCapacity} seats · every {config.intervalMinutes}
					min</span
				>
				<span class="rideDesc">{config.description}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.rideStep {
		max-width: 36rem;
		margin-inline: auto;
		text-align: center;
	}

	.rideStep h2 {
		color: var(--color-forest-dk);
		font-size: 1.5rem;
		margin-bottom: 0.375rem;
	}

	.stepHint {
		color: var(--color-text-muted);
		margin: 0 auto 1.75rem;
		max-width: 32rem;
		line-height: 1.5;
	}

	.rideOptions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		text-align: left;
	}

	.rideOption {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		width: 100%;
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
		background: color-mix(in srgb, var(--color-forest) 8%, white);
	}

	.rideOption:focus-visible {
		outline: 2px solid var(--color-forest);
		outline-offset: 2px;
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
</style>
