<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	const treePriceValue = $derived(
		form && 'treePrice' in form && typeof form.treePrice === 'string'
			? form.treePrice
			: data.treePrice.toFixed(0)
	);

	const experiencePriceValue = $derived(
		form && 'experiencePrice' in form && typeof form.experiencePrice === 'string'
			? form.experiencePrice
			: data.experiencePrice.toFixed(0)
	);
</script>

<svelte:head>
	<title>Pricing – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<h1 class="adminH1">Pricing</h1>

	<section class="adminSection">
		<div class="sectionHeader">
			<h2>Public Pricing</h2>
			<p class="sectionSub">
				These prices appear on the public Christmas Trees and South Lot pages, and should match any
				signage on the farm.
			</p>
		</div>

		{#if form?.error}
			<div class="alert alertError">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="alert alertSuccess">Pricing updated.</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
			class="pricingForm"
		>
			<div class="fieldGroup">
				<label for="experiencePrice">Tree &amp; Wagon Experience (per household)</label>
				<div class="priceInput">
					<span class="currency">$</span>
					<input
						id="experiencePrice"
						name="experiencePrice"
						type="number"
						min="0"
						step="1"
						value={experiencePriceValue}
						required
					/>
				</div>
				<p class="fieldHint">This price is shown as “per household” on the Christmas Trees page.</p>
			</div>

			<div class="fieldGroup">
				<label for="treePrice">Tree Only (South Lot)</label>
				<div class="priceInput">
					<span class="currency">$</span>
					<input
						id="treePrice"
						name="treePrice"
						type="number"
						min="0"
						step="1"
						value={treePriceValue}
						required
					/>
				</div>
				<p class="fieldHint">
					This price is shown as “per tree” on both the Christmas Trees and South Lot pages.
				</p>
			</div>

			<button type="submit" class="btn btnPrimary btnLg" disabled={submitting}>
				{submitting ? 'Saving…' : 'Save Pricing'}
			</button>
		</form>
	</section>
</div>

<style>
	.adminSection {
		max-width: 640px;
		padding: 1rem 2rem;
	}
	.sectionHeader {
		margin-bottom: 1.25rem;
	}

	.sectionSub {
		margin: 0.4rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.pricingForm {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 420px;
	}

	.fieldGroup label {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.35rem;
	}

	.priceInput {
		display: flex;
		align-items: center;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		background: var(--color-white);
		max-width: 260px;
	}

	.currency {
		padding: 0.55rem 0.75rem;
		background: var(--color-cream-dk);
		color: var(--color-text-muted);
		font-size: 0.9rem;
		border-right: 1.5px solid var(--color-border);
	}

	.priceInput input {
		border: none;
		flex: 1;
		padding: 0.55rem 0.75rem;
		font-size: 0.95rem;
		font-family: var(--font-sans);
	}

	.priceInput input:focus {
		outline: none;
	}

	.fieldHint {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}
</style>
