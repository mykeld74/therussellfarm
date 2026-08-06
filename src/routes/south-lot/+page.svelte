<script lang="ts">
	import type { PageData } from './$types';
	import PageHero from '$lib/components/PageHero.svelte';

	let { data }: { data: PageData } = $props();

	const treeOveragePerFoot = $derived(data.treeOveragePerFoot);
	const exampleFeetOver = 5; // 12 ft − 7 ft
	const exampleTotal = $derived(data.treePrice + treeOveragePerFoot * exampleFeetOver);
</script>

<svelte:head>
	<title>South Lot – The Russell Farm</title>
	<meta
		name="description"
		content={`Cut-your-own or pre-cut Christmas trees (when available) in the South Lot at The Russell Farm. From $${data.treePrice.toFixed(
			0
		)} per tree (up to 7 ft), no reservation required.`}
	/>
</svelte:head>

<PageHero>
	<h1>South Lot</h1>
	<p>Pre-cut trees (when available) or cut-your-own — no wagon ride</p>
</PageHero>

<section class="sectionWhite">
	<div class="container contentBlock">
		<p class="priceLead">
			${data.treePrice.toFixed(0)} per tree <span class="priceNote">(up to 7 ft)</span>
		</p>
		<p class="treePricingNote">
			Trees 7 feet and under are ${data.treePrice.toFixed(0)}. For trees taller than 7 feet, add
			${treeOveragePerFoot} per additional foot. For example, a 12-foot tree is
			${data.treePrice.toFixed(0)} + (${treeOveragePerFoot} × {exampleFeetOver} ft) =
			${exampleTotal.toFixed(0)}.
		</p>
		<p>
			The South Lot is perfect if you'd like to skip the wagon ride and head straight to the trees.
			Choose from pre-cut trees at the barn (when available) or walk out and cut your own in the
			South Lot.
		</p>
		<p>
			Same great trees — Balsam fir and Fraser fir — at a lower price when you don't need the full
			wagon experience.
		</p>
		<p>
			<strong>No reservation required</strong> for the South Lot; just stop by during open hours. Our
			"South Lot" is located in Starksboro, directly across from Ireland rd. on Highway VT-116, 1 mile
			SOUTH of the farm heading towards Bristol. For the full wagon ride experience, book online.
		</p>
		<div class="btnRow">
			<a href="/book" class="btn btnPrimary">Book the Wagon Experience</a>
			<a href="/christmas-trees" class="btn btnSecondary">See All Tree Options</a>
		</div>
	</div>
</section>

<style>
	.sectionWhite {
		padding: 4rem 0;
		background: var(--color-white);
	}

	.contentBlock {
		max-width: 640px;
	}

	.priceLead {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--color-forest);
		margin-bottom: 0.75rem;
	}

	.priceNote {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.treePricingNote {
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
		padding: 0.85rem 1rem;
		background: var(--color-cream);
		border-radius: var(--radius);
	}

	.contentBlock p {
		color: var(--color-text-muted);
		line-height: 1.75;
		margin-bottom: 1.25rem;
	}

	.btnRow {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}
</style>
