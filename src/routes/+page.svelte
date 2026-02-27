<script lang="ts">
	import {
		horseDrawn,
		newCottageInTheSnow,
		cottageInTheSnow,
		carriageInTheSnow,
		snowCoveredTrees,
		family
	} from '$lib/assets';
</script>

<svelte:head>
	<title>The Russell Farm – Christmas Tree Experience</title>
	<meta
		name="description"
		content="Pick your tree, relax at the cottage with hot chocolate and the fire, and we'll cut and load it. A family tradition worth making."
	/>
</svelte:head>

<!-- Hero -->
<section class="hero">
	<div class="heroContent container">
		<p class="heroEyebrow">Welcome to The Russell Farm</p>
		<h1>A Christmas Memory<br />Worth Making</h1>
		<p class="heroTagline">
			Hop on the wagon, pick the perfect tree, then relax at the cottage with hot chocolate and the
			fire while we cut and load it for you.
		</p>
		<div class="heroCtas">
			<a href="/book" class="btn btnCream btnLg">Book Your Experience</a>
			<a href="/christmas-trees#experience" class="btn btnOutlineLight btnLg">Learn More</a>
		</div>
	</div>
	<div class="heroScrollHint">↓</div>
</section>

<!-- Features -->
<section class="featuresSection">
	<div class="container">
		<h2 class="sectionTitle">A Classic Farm Experience</h2>
		<p class="sectionSubtitle">Everything you need for an unforgettable holiday tradition.</p>
		<div class="featuresGrid">
			<div class="featureCard">
				<div class="featureImage">
					<img src={carriageInTheSnow} class="wagonRides" alt="Horse-drawn carriage in the snow" />
				</div>
				<h3>Wagon Rides</h3>
				<p>
					A scenic horse-drawn wagon ride carries your family from the barn out to the tree fields.
				</p>
			</div>
			<div class="featureCard">
				<div class="featureImage">
					<img src={snowCoveredTrees} class="pickYourTree" alt="Snow-covered trees" />
				</div>
				<h3>Pick Your Tree</h3>
				<p>
					Walk the rows together and choose your tree. Then head to the cottage for hot chocolate,
					games, and the fire while we cut it down and load it on the wagon for you.
				</p>
			</div>
			<div class="featureCard">
				<div class="featureImage">
					<img src={family} class="family" alt="Family" />
				</div>
				<h3>Family Groups</h3>
				<p>Booked per family. No crowds, no rush — just your group and the open fields.</p>
			</div>
		</div>
	</div>
</section>

<!-- Story section -->
<section class="storySection">
	<div class="container storyInner">
		<div class="storyText">
			<h2>The Russell Family Farm</h2>
			<p>
				Nestled in the countryside, our family farm has been a place of warmth and welcome for
				generations. Every November, we open our gates for the Christmas tree season — and we'd love
				for your family to be part of it.
			</p>
			<p>
				From the crunch of frost underfoot to the smell of fresh-cut pine, the whole experience is
				designed to slow down and savour the season together.
			</p>
			<a href="/christmas-trees#experience" class="btn btnSecondary">See What to Expect</a>
		</div>
		<div class="storyImage" aria-hidden="true">
			<div class="imageContainer">
				<img src={cottageInTheSnow} alt="The Cottage in the Snow" />
			</div>
		</div>
	</div>
</section>

<!-- How it works -->
<section class="howSection">
	<div class="container">
		<h2 class="sectionTitle">How It Works</h2>
		<div class="stepsRow">
			<div class="step">
				<div class="stepNum">1</div>
				<h3>Book Online</h3>
				<p>Choose your date and time slot. Limited families per session.</p>
			</div>
			<div class="stepArrow">→</div>
			<div class="step">
				<div class="stepNum">2</div>
				<h3>Arrive & Ride</h3>
				<p>Check in at the barn and hop on the wagon for the ride out.</p>
			</div>
			<div class="stepArrow">→</div>
			<div class="step">
				<div class="stepNum">3</div>
				<h3>Pick Your Tree</h3>
				<p>Walk the rows and choose the one that's just right.</p>
			</div>
			<div class="stepArrow">→</div>
			<div class="step">
				<div class="stepNum">4</div>
				<h3>Cottage & Load Up</h3>
				<p>
					Hot chocolate, games, and the fire at the cottage while we cut your tree and load it on
					the wagon. Then take it home.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- CTA Band -->
<section class="ctaBand">
	<div class="container">
		<h2>Ready to Start a New Tradition?</h2>
		<p>Spots fill up fast — book your family's session today.</p>
		<a href="/book" class="btn btnPrimary btnLg">Reserve Your Slot</a>
	</div>
</section>

<style>
	/* ── Hero ── */
	.hero {
		background:
			linear-gradient(
				150deg,
				rgba(0, 0, 0, 0.25) 0%,
				rgba(0, 0, 0, 0.6) 60%,
				rgba(0, 0, 0, 0.25) 100%
			),
			url('../lib/assets/horseDrawn.jpg') no-repeat center 40% / cover;
		color: var(--color-cream);
		padding: 6rem 0 5rem;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.heroContent {
		position: relative;
		z-index: 1;
	}

	.heroEyebrow {
		font-size: 0.9rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(249, 245, 238, 0.6);
		margin-bottom: 1rem;
	}

	.hero h1 {
		font-size: clamp(2.2rem, 6vw, 4rem);
		color: var(--color-white);
		margin-bottom: 1.25rem;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
	}

	.heroTagline {
		font-size: clamp(1rem, 2.5vw, 1.25rem);
		color: rgba(249, 245, 238, 0.85);
		max-width: 520px;
		margin: 0 auto 2.5rem;
	}

	.heroCtas {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btnCream {
		background: var(--color-cream);
		color: var(--color-forest-dk);
		border-color: var(--color-cream);
	}

	.btnCream:hover {
		background: var(--color-white);
		border-color: var(--color-white);
		color: var(--color-forest-dk);
	}

	.btnOutlineLight {
		background: transparent;
		color: var(--color-cream);
		border-color: rgba(249, 245, 238, 0.5);
	}

	.btnOutlineLight:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: var(--color-cream);
		color: var(--color-white);
	}

	.heroScrollHint {
		position: relative;
		color: rgba(249, 245, 238, 0.35);
		font-size: 1.5rem;
		margin-top: 3rem;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(6px);
		}
	}

	/* ── Features ── */
	.featuresSection {
		padding: 5rem 0;
		background: var(--color-white);
	}

	.sectionTitle {
		text-align: center;
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		color: var(--color-forest-dk);
		margin-bottom: 0.5rem;
	}

	.sectionSubtitle {
		text-align: center;
		color: var(--color-text-muted);
		font-size: 1.05rem;
		margin-bottom: 3rem;
	}

	.featuresGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.featureCard {
		background: var(--color-cream);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 0 0 1.5rem 0;
		text-align: center;
		transition: box-shadow 0.2s;
		overflow: clip;
	}

	.featureImage {
		aspect-ratio: 5/3.5;
		overflow: hidden;
		margin-bottom: 1rem;
	}

	.wagonRides,
	.pickYourTree {
		transform: translateY(-25%);
	}
	.pickYourTree {
		transform: translateY(-12%);
	}

	.featureCard {
		h3 {
			color: var(--color-forest);
			margin-bottom: 0.5rem;
			font-size: 1.2rem;
		}
		p {
			color: var(--color-text-muted);
			font-size: 0.95rem;
			width: 94%;
			margin: 0 auto;
			line-height: 1.2;
		}
	}

	/* ── Story ── */
	.storySection {
		padding: 5rem 0;
		background: var(--color-cream-dk);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}

	.storyInner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.storyText h2 {
		color: var(--color-forest-dk);
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.storyText p {
		color: var(--color-text-muted);
		line-height: 1.75;
		margin-bottom: 1.25rem;
	}

	.imageContainer {
		background: var(--color-forest);
		border-radius: var(--radius-lg);
		aspect-ratio: 4/3;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: rgba(249, 245, 238, 0.6);
		font-size: 2.5rem;
		gap: 0.75rem;
		overflow: hidden;
	}

	/* ── How it works ── */
	.howSection {
		padding: 5rem 0;
		background: var(--color-white);
	}

	.stepsRow {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.step {
		flex: 1;
		min-width: 160px;
		max-width: 200px;
		text-align: center;
	}

	.stepNum {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--color-forest);
		color: var(--color-white);
		font-weight: 700;
		font-size: 1.1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
	}

	.step h3 {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		color: var(--color-forest-dk);
	}

	.step p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
	}

	.stepArrow {
		color: var(--color-border);
		font-size: 1.5rem;
		padding-top: 0.75rem;
		flex-shrink: 0;
	}

	/* ── CTA Band ── */
	.ctaBand {
		background: linear-gradient(135deg, var(--color-forest-dk), var(--color-forest));
		color: var(--color-cream);
		text-align: center;
		padding: 5rem 1.5rem;
	}

	.ctaBand h2 {
		color: var(--color-white);
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		margin-bottom: 0.75rem;
	}

	.ctaBand p {
		color: rgba(249, 245, 238, 0.8);
		margin-bottom: 2rem;
		font-size: 1.05rem;
	}

	@media (max-width: 768px) {
		.storyInner {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.storyImage {
			order: -1;
		}

		.stepArrow {
			display: none;
		}

		.stepsRow {
			gap: 1.5rem;
		}
	}
</style>
