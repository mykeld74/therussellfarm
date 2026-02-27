<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>South Lot – The Russell Farm</title>
	<meta
		name="description"
		content={`Cut-your-own or pre-cut Christmas trees in the South Lot at The Russell Farm. $${data.treePrice.toFixed(
			0
		)} per tree, no reservation required.`}
	/>
</svelte:head>

<div class="pageHero">
	<div class="container">
		<h1>South Lot</h1>
		<p>Pre-cut trees or cut-your-own — no wagon ride</p>
	</div>
</div>

<section class="sectionWhite">
	<div class="container contentBlock">
		<p class="priceLead">${data.treePrice.toFixed(0)} per tree</p>
		<p>
			The South Lot is perfect if you'd like to skip the wagon ride and head straight to the trees.
			Choose from pre-cut trees at the barn or walk out and cut your own in the South Lot.
		</p>
		<p>
			Same great trees — Fraser fir, Douglas fir, and Scotch pine — at a lower price when you don't
			need the full wagon experience.
		</p>
		<p>
			<strong>No reservation required</strong> for the South Lot; just stop by during open hours.
			For the full wagon ride experience, book online.
		</p>
		<div class="btnRow">
			<a href="/book" class="btn btnPrimary">Book the Wagon Experience</a>
			<a href="/christmas-trees" class="btn btnSecondary">See All Tree Options</a>
		</div>
	</div>
</section>

<style>
	.pageHero {
		background: linear-gradient(150deg, #1a3d18 0%, var(--color-forest) 60%, #2d5a27 100%);
		color: var(--color-cream);
		padding: 4rem 0 3rem;
		text-align: center;
	}

	.pageHero h1 {
		color: var(--color-white);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		margin-bottom: 0.5rem;
	}

	.pageHero p {
		color: rgba(249, 245, 238, 0.85);
		margin: 0;
	}

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
		margin-bottom: 1.25rem;
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
