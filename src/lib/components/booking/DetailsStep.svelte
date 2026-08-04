<script lang="ts">
	import type { BookingFormData } from '$lib/types';
	import IMask from 'imask';
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

	const phoneMaskConfig = { mask: '(000) 000-0000' };

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		onSubmit({ name, email, phone });
	}
</script>

<div class="detailsStep">
	<button class="backBtn" onclick={onBack}>← Back to time slots</button>
	<h2>Your Details</h2>
	<p class="stepHint">Where should we send your confirmation?</p>

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
				use:IMask={phoneMaskConfig}
				id="phone"
				type="tel"
				bind:value={phone}
				placeholder="(555) 000-0000"
				required
				autocomplete="tel"
			/>
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
</style>
