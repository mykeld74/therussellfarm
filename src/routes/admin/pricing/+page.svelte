<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);

	function fieldVal(key: string, fallback: number): string {
		if (form && key in form && typeof (form as Record<string, unknown>)[key] === 'string') {
			return (form as Record<string, string>)[key];
		}
		return fallback.toFixed(0);
	}
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
				These prices appear on the public Christmas Trees, South Lot, and Maple Syrup pages, and
				should match any signage on the farm.
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
			<!-- Christmas Trees / South Lot -->
			<div class="fieldGroup">
				<label for="experiencePrice">Tree &amp; Wagon Experience (per household)</label>
				<div class="priceInput">
					<span class="currency">$</span>
					<input
						id="experiencePrice"
						name="experiencePrice"
						type="number"
						min="1"
						step="1"
						value={fieldVal('experiencePrice', data.experiencePrice)}
						required
					/>
				</div>
				<p class="fieldHint">Shown as "per household" on the Christmas Trees page.</p>
			</div>

			<div class="fieldGroup">
				<label for="treePrice">Tree Only (South Lot)</label>
				<div class="priceInput">
					<span class="currency">$</span>
					<input
						id="treePrice"
						name="treePrice"
						type="number"
						min="1"
						step="1"
						value={fieldVal('treePrice', data.treePrice)}
						required
					/>
				</div>
				<p class="fieldHint">Shown as "per tree" on the Christmas Trees and South Lot pages.</p>
			</div>

			<!-- Maple Syrup -->
			<div class="groupDivider">
				<span class="groupLabel">Maple Syrup</span>
			</div>

			<div class="syrupGrid">
				<div class="fieldGroup">
					<label for="mapleSyrupPint">Pint</label>
					<div class="priceInput">
						<span class="currency">$</span>
						<input
							id="mapleSyrupPint"
							name="mapleSyrupPint"
							type="number"
							min="1"
							step="1"
							value={fieldVal('mapleSyrupPint', data.mapleSyrupPint)}
							required
						/>
					</div>
				</div>

				<div class="fieldGroup">
					<label for="mapleSyrupQuart">Quart</label>
					<div class="priceInput">
						<span class="currency">$</span>
						<input
							id="mapleSyrupQuart"
							name="mapleSyrupQuart"
							type="number"
							min="1"
							step="1"
							value={fieldVal('mapleSyrupQuart', data.mapleSyrupQuart)}
							required
						/>
					</div>
				</div>

				<div class="fieldGroup">
					<label for="mapleSyrupHalfGallon">Half Gallon</label>
					<div class="priceInput">
						<span class="currency">$</span>
						<input
							id="mapleSyrupHalfGallon"
							name="mapleSyrupHalfGallon"
							type="number"
							min="1"
							step="1"
							value={fieldVal('mapleSyrupHalfGallon', data.mapleSyrupHalfGallon)}
							required
						/>
					</div>
				</div>

				<div class="fieldGroup">
					<label for="mapleSyrupGallon">Gallon</label>
					<div class="priceInput">
						<span class="currency">$</span>
						<input
							id="mapleSyrupGallon"
							name="mapleSyrupGallon"
							type="number"
							min="1"
							step="1"
							value={fieldVal('mapleSyrupGallon', data.mapleSyrupGallon)}
							required
						/>
					</div>
				</div>
			</div>
			<p class="fieldHint" style="margin-top: -0.5rem;">
				Shown as individual size prices on the Maple Syrup page.
			</p>

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
		max-width: 480px;
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

	/* Maple syrup section divider */
	.groupDivider {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.25rem;
	}

	.groupDivider::before,
	.groupDivider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}

	.groupLabel {
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* 2×2 grid for the four syrup sizes */
	.syrupGrid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem 1.25rem;
	}

	.syrupGrid .priceInput {
		max-width: 100%;
	}
</style>
