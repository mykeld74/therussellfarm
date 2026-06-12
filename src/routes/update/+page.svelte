<script lang="ts">
	import PageHero from '$lib/components/PageHero.svelte';
</script>

<svelte:head>
	<title>2023 Update – The Russell Farm</title>
	<meta name="description" content="Latest news and updates from The Russell Farm." />
</svelte:head>

<PageHero>
	<h1>2023 Update</h1>
	<p>News and updates from the farm</p>
</PageHero>

<section class="sectionWhite">
	<div class="container contentBlock">
		<p>
			We're open the day after Thanksgiving through December 20th for Christmas trees. Book your wagon
			experience online or stop by for pre-cut trees and cut-your-own in the South Lot.
		</p>
		<p>
			Hand-made wreaths and garland are available — please call ahead to order. Our maple syrup is
			available year-round; reach out by phone or email to arrange pickup.
		</p>
		<a href="/christmas-trees" class="btn btnPrimary">Christmas Trees & Pricing</a>
		<a href="/christmas-trees#visit" class="btn btnSecondary">Hours &amp; Directions</a>
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

	.contentBlock p {
		color: var(--color-text-muted);
		line-height: 1.75;
		margin-bottom: 1.25rem;
	}

	.contentBlock .btn {
		margin-right: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
