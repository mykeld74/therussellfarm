<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let openFaq = $state<number | null>(null);

	const faqs = [
		{
			q: 'How long does the experience take?',
			a: 'Most families spend 1–2 hours with us. The wagon ride is about 15 minutes each way, and the rest of the time is yours to pick your tree and enjoy the cottage.'
		},
		{
			q: 'What should we wear?',
			a: 'Dress for the weather! Boots are highly recommended — the field can be muddy. Layers are always a good idea for late autumn and early winter days.'
		},
		{
			q: 'Can we bring our dog?',
			a: 'Friendly, leashed dogs are welcome! Just be mindful of other families and keep them on lead throughout.'
		},
		{
			q: 'How many families per time slot?',
			a: 'We keep slots small and intimate — typically just 4–6 families per session, so you never feel rushed or crowded.'
		},
		{
			q: 'What if the weather is bad?',
			a: "We run rain or shine for light weather, but may cancel in severe conditions. If we need to cancel, you'll be notified by email and offered a full rescheduling or refund."
		},
		{
			q: 'How do I cancel or reschedule?',
			a: "Email us with your booking reference and we'll do our best to accommodate. Cancellations more than 48 hours before are fully refunded."
		}
	];

	function toggleFaq(i: number) {
		openFaq = openFaq === i ? null : i;
	}
</script>

<svelte:head>
	<title>Christmas Trees – The Russell Farm</title>
	<meta
		name="description"
		content="Christmas trees, wagon rides, and the full farm experience at The Russell Farm. Pricing, what to expect, hours, and directions."
	/>
</svelte:head>

<!-- Hero -->
<div class="pageHero">
	<div class="container">
		<h1>Christmas Trees</h1>
		<p>Wagon ride &amp; pick-your-own experience, or cut-your-own in the South Lot</p>
		<div class="heroLinks">
			<a href="/book" class="btn btnPrimary">Book the Wagon Experience</a>
			<a href="#visit" class="btn btnOutlineLight">Hours &amp; Directions</a>
		</div>
	</div>
</div>

<!-- ── Pricing ── -->
<section class="sectionWhite" id="pricing">
	<div class="container">
		<h2 class="sectionTitle">Two Ways to Get Your Tree</h2>
		<div class="optionsGrid">
			<div class="optionCard featured">
				<h3>Tree &amp; Horse-Drawn Wagon Ride</h3>
				<p class="price">${data.experiencePrice.toFixed(0)} per household</p>
				<p>
					Our full experience: ride out to the fields, pick your tree, then relax at the cottage
					with hot chocolate, games, and the fire. We cut your tree and load it on the wagon for
					you. One tree included per household.
				</p>
				<a href="/book" class="btn btnPrimary">Book Your Experience</a>
			</div>
			<div class="optionCard">
				<h3>South Lot — No Wagon Ride</h3>
				<p class="price">${data.treePrice.toFixed(0)} per tree</p>
				<p>
					Pre-cut trees at the barn, or walk out and cut your own in the South Lot. Same great trees
					— no reservation required. Perfect if you'd prefer to pick and cut on your own.
				</p>
				<a href="/south-lot" class="btn btnSecondary">More About the South Lot</a>
			</div>
		</div>
	</div>
</section>

<!-- ── The Experience ── -->
<section class="sectionCream" id="experience">
	<div class="container">
		<h2 class="sectionTitle">The Wagon Ride Experience</h2>
		<div class="twoCol">
			<div class="colText">
				<div class="experienceSteps">
					<div class="exStep">
						<div class="exStepIcon">🏠</div>
						<div>
							<h3>1. Arrive at the Barn</h3>
							<p>Check in at the farmhouse. We'll point out the best rows for your tree size.</p>
						</div>
					</div>
					<div class="exStep">
						<div class="exStepIcon">🐴</div>
						<div>
							<h3>2. Wagon Ride Out</h3>
							<p>
								Climb aboard the horse-drawn wagon for a scenic ride through the property out to the
								Christmas tree fields.
							</p>
						</div>
					</div>
					<div class="exStep">
						<div class="exStepIcon">🌲</div>
						<div>
							<h3>3. Browse &amp; Choose</h3>
							<p>
								Walk the rows at your own pace. Fraser fir, Douglas fir, and Scotch pine in various
								heights. Take your time — there's no rush.
							</p>
						</div>
					</div>
					<div class="exStep">
						<div class="exStepIcon">🏡</div>
						<div>
							<h3>4. Cottage Time</h3>
							<p>
								Head to the cottage for hot chocolate, games, and the fire. While you relax, we cut
								your tree and load it on the wagon for you.
							</p>
						</div>
					</div>
					<div class="exStep">
						<div class="exStepIcon">🚜</div>
						<div>
							<h3>5. Take It Home</h3>
							<p>Your tree is cut, wrapped, and ready. We'll help load it onto your vehicle.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="colSidebar">
				<div class="infoCard">
					<h3>Visit Details</h3>
					<dl class="detailsList">
						<div>
							<dt>Season</dt>
							<dd>First Friday after Thanksgiving – Last Sunday before Christmas</dd>
						</div>
						<div>
							<dt>Hours</dt>
							<dd>Saturday and Sunday: 10:00 AM – 4:00 PM</dd>
						</div>

						<div>
							<dt>Bring</dt>
							<dd>Warm clothes, boots, your excitement</dd>
						</div>
						<div>
							<dt>We provide</dt>
							<dd>Wagon ride, hot chocolate, tree cut &amp; loaded, netting for transport</dd>
						</div>
					</dl>
				</div>

				<div class="infoCard" style="margin-top: 1.25rem;">
					<h3>Tree Varieties</h3>
					<div class="treeList">
						<div class="treeItem">
							<span class="treeEmoji">🌲</span>
							<div>
								<strong>Fraser Fir</strong>
								<p>Excellent needle retention, pleasant scent. A family favourite.</p>
							</div>
						</div>
						<div class="treeItem">
							<span class="treeEmoji">🌲</span>
							<div>
								<strong>Douglas Fir</strong>
								<p>Full, classic shape with soft needles. Great for ornaments.</p>
							</div>
						</div>
					</div>
				</div>

				<div style="margin-top: 1.5rem; text-align: center;">
					<a href="/book" class="btn btnPrimary" style="width: 100%; display: block;">
						Book Your Experience →
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ── Wreaths & Garland ── -->
<section class="sectionCream wreathsBand">
	<div class="container">
		<h2 class="sectionTitle">Wreaths &amp; Garland</h2>
		<p>Hand-made wreaths: $40–$75. Garland: $4 per foot. Please call to order in advance.</p>
		<a href="tel:802-453-2208" class="btn btnSecondary">Call to Order</a>
	</div>
</section>

<!-- ── FAQ ── -->
<section class="faqSection" id="faq">
	<div class="container">
		<h2 class="sectionTitle">Frequently Asked Questions</h2>
		<div class="faqList">
			{#each faqs as faq, i (i)}
				<div class="faqItem" class:open={openFaq === i}>
					<button class="faqQuestion" onclick={() => toggleFaq(i)}>
						<span>{faq.q}</span>
						<span class="faqIcon">{openFaq === i ? '−' : '+'}</span>
					</button>
					{#if openFaq === i}
						<div class="faqAnswer">
							<p>{faq.a}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ── Visit Us ── -->
<section class="sectionWhite" id="visit">
	<div class="container">
		<h2 class="sectionTitle">Hours, Directions &amp; Contact</h2>
		<div class="infoGrid">
			<div class="visitCard">
				<h3>Hours</h3>
				<p><strong>Friday (day after Thanksgiving):</strong> 10 AM – 4 PM</p>
				<p><strong>Saturdays &amp; Sundays</strong> (through Dec 20): 10 AM – 4 PM</p>
				<p class="hoursNote">Open the day after Thanksgiving through December 20th.</p>
			</div>
			<div class="visitCard">
				<h3>Where</h3>
				<p class="address">1248 VT Route 116<br />Starksboro, VT</p>
				<a
					href="https://www.google.com/maps/search/?api=1&query=1248+VT+Route+116+Starksboro+VT"
					target="_blank"
					rel="noopener noreferrer"
					class="btn btnSecondary">Get Directions</a
				>
			</div>
			<div class="visitCard">
				<h3>Contact Us</h3>
				<p>David &amp; Janet Russell</p>
				<p><a href="tel:802-453-2208">802-453-2208</a></p>
				<p><a href="mailto:Maplehillside@gmail.com">Maplehillside@gmail.com</a></p>
			</div>
		</div>
	</div>
</section>

<!-- ── CTA Band ── -->
<section class="ctaBand">
	<div class="container">
		<h2>Open the Day After Thanksgiving – December 20th</h2>
		<a href="/book" class="btn btnPrimary btnLg">Reserve Your Slot</a>
	</div>
</section>

<style>
	/* Hero */
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
		margin: 0 0 1.75rem;
	}

	.heroLinks {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btnOutlineLight {
		background: transparent;
		color: var(--color-cream);
		border-color: rgba(249, 245, 238, 0.5);
		border-width: 2px;
	}

	.btnOutlineLight:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: var(--color-cream);
		color: var(--color-white);
	}

	/* Sections */
	.sectionWhite {
		padding: 5rem 0;
		background: var(--color-white);
	}

	.sectionCream {
		padding: 5rem 0;
		background: var(--color-cream-dk);
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}

	.sectionTitle {
		text-align: center;
		font-size: clamp(1.5rem, 3vw, 2rem);
		color: var(--color-forest-dk);
		margin-bottom: 2rem;
	}

	/* Pricing cards */
	.optionsGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.optionCard {
		background: var(--color-cream);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2rem;
	}

	.optionCard.featured {
		border-color: var(--color-forest-lt);
		background: rgba(45, 90, 39, 0.06);
	}

	.optionCard h3 {
		font-size: 1.2rem;
		color: var(--color-forest-dk);
		margin-bottom: 0.5rem;
	}

	.optionCard .price {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--color-forest);
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.optionCard p {
		color: var(--color-text-muted);
		margin-bottom: 1.25rem;
		line-height: 1.65;
	}

	/* Experience two-column */
	.twoCol {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 4rem;
		align-items: start;
	}

	.experienceSteps {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.exStep {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}

	.exStepIcon {
		font-size: 1.75rem;
		flex-shrink: 0;
		margin-top: 0.15rem;
	}

	.exStep h3 {
		font-size: 1rem;
		margin-bottom: 0.375rem;
		color: var(--color-forest);
	}

	.exStep p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.65;
	}

	/* Sidebar cards */
	.infoCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	.infoCard h3 {
		color: var(--color-forest);
		font-size: 1.05rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.75rem;
	}

	.detailsList {
		margin: 0;
	}

	.detailsList div {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.detailsList div:last-child {
		border-bottom: none;
	}

	.detailsList dt {
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.detailsList dd {
		margin: 0;
		color: var(--color-text);
	}

	.treeList {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.treeItem {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.treeEmoji {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.treeItem strong {
		display: block;
		font-size: 0.9rem;
		margin-bottom: 0.2rem;
		color: var(--color-forest);
	}

	.treeItem p {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* Wreaths band */
	.wreathsBand {
		text-align: center;
	}

	.wreathsBand p {
		color: var(--color-text-muted);
		margin-bottom: 1.25rem;
	}

	/* FAQ */
	.faqSection {
		padding: 5rem 0;
		background: var(--color-cream-dk);
		border-top: 1px solid var(--color-border);
	}

	.faqList {
		max-width: 720px;
		margin: 0 auto;
	}

	.faqItem {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		margin-bottom: 0.75rem;
		background: var(--color-white);
		overflow: hidden;
	}

	.faqQuestion {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.1rem 1.25rem;
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-sans);
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
		text-align: left;
		gap: 1rem;
		transition: background 0.15s;
	}

	.faqQuestion:hover {
		background: var(--color-cream);
	}

	.faqItem.open .faqQuestion {
		background: var(--color-cream);
		color: var(--color-forest);
	}

	.faqIcon {
		font-size: 1.25rem;
		color: var(--color-forest);
		flex-shrink: 0;
	}

	.faqAnswer {
		padding: 0 1.25rem 1.1rem;
		border-top: 1px solid var(--color-border);
	}

	.faqAnswer p {
		margin: 1rem 0 0;
		color: var(--color-text-muted);
		line-height: 1.7;
	}

	/* Visit Us */
	.infoGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.visitCard {
		background: var(--color-cream);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.75rem;
	}

	.visitCard h3 {
		font-size: 1.1rem;
		color: var(--color-forest-dk);
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.visitCard p {
		color: var(--color-text-muted);
		margin: 0 0 0.5rem;
		line-height: 1.6;
	}

	.visitCard .address {
		margin-bottom: 1rem;
	}

	.hoursNote {
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	/* CTA band */
	.ctaBand {
		background: linear-gradient(135deg, var(--color-forest-dk), var(--color-forest));
		color: var(--color-cream);
		text-align: center;
		padding: 4rem 1.5rem;
	}

	.ctaBand h2 {
		color: var(--color-white);
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		margin-bottom: 1.5rem;
	}

	@media (max-width: 900px) {
		.twoCol {
			grid-template-columns: 1fr;
		}

		.colSidebar {
			order: -1;
		}
	}
</style>
