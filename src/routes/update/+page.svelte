<svelte:head>
	<title>2023 Update – The Russell Farm</title>
	<meta name="description" content="Latest news and updates from The Russell Farm." />
</svelte:head>

<div class="pageHero">
	<div class="container">
		<h1>2023 Update</h1>
		<p>News and updates from the farm</p>
	</div>
</div>

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
