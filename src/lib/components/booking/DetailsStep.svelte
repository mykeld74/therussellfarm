<script lang="ts">
	import type { BookingFormData } from '$lib/types';

	import { untrack } from 'svelte';

	let {
		initialData,
		onSubmit,
		onBack
	}: {
		initialData: BookingFormData;
		onSubmit: (data: Partial<BookingFormData>) => void;
		onBack: () => void;
	} = $props();

	// untrack: read initial prop values without creating reactive dependency
	// This is intentional — form fields are independently mutable after initialization
	let name = $state(untrack(() => initialData.name));
	let email = $state(untrack(() => initialData.email));
	let phone = $state(untrack(() => initialData.phone));
	let partySizeAdults = $state(untrack(() => initialData.partySizeAdults || 2));
	let partySizeKids = $state(untrack(() => initialData.partySizeKids || 0));

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSubmit({ name, email, phone, partySizeAdults, partySizeKids });
	}
</script>

<div class="detailsStep">
	<button class="backBtn" onclick={onBack}>← Back to time slots</button>
	<h2>Your Details</h2>
	<p class="stepHint">Tell us a bit about your group so we can get ready for you.</p>

	<form class="detailsForm" onsubmit={handleSubmit} novalidate>
		<div class="field">
			<label for="name">Full Name</label>
			<input
				id="name"
				type="text"
				bind:value={name}
				placeholder="Jane Smith"
				required
				autocomplete="name"
			/>
		</div>

		<div class="field">
			<label for="email">Email Address</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				placeholder="jane@example.com"
				required
				autocomplete="email"
			/>
			<span class="fieldHint">Your confirmation will be sent here.</span>
		</div>

		<div class="field">
			<label for="phone">Phone Number</label>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				placeholder="(555) 000-0000"
				required
				autocomplete="tel"
			/>
		</div>

		<div class="partyRow">
			<div class="field">
				<label for="adults">Adults</label>
				<div class="numberInput">
					<button
						type="button"
						onclick={() => (partySizeAdults = Math.max(1, partySizeAdults - 1))}
						aria-label="Decrease adults">−</button
					>
					<input
						id="adults"
						type="number"
						bind:value={partySizeAdults}
						min="1"
						max="8"
						readonly
					/>
					<button
						type="button"
						onclick={() => (partySizeAdults = Math.min(8, partySizeAdults + 1))}
						aria-label="Increase adults">+</button
					>
				</div>
			</div>

			<div class="field">
				<label for="kids">Children</label>
				<div class="numberInput">
					<button
						type="button"
						onclick={() => (partySizeKids = Math.max(0, partySizeKids - 1))}
						aria-label="Decrease children">−</button
					>
					<input
						id="kids"
						type="number"
						bind:value={partySizeKids}
						min="0"
						max="10"
						readonly
					/>
					<button
						type="button"
						onclick={() => (partySizeKids = Math.min(10, partySizeKids + 1))}
						aria-label="Increase children">+</button
					>
				</div>
			</div>
		</div>

		<button
			type="submit"
			class="btn btnPrimary btnLg"
			style="width: 100%; margin-top: 0.5rem;"
			disabled={!name || !email || !phone}
		>
			Continue to Review →
		</button>
	</form>
</div>

<style>
	.detailsStep h2 {
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

	.detailsForm {
		max-width: 480px;
	}

	.fieldHint {
		font-size: 0.8rem;
		color: var(--color-text-muted);
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

	.numberInput button:hover {
		background: var(--color-border);
	}
</style>
