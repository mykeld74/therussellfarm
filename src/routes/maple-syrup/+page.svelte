<script lang="ts">
	import {
		daveAndBrandon,
		distilling,
		sapCollection,
		sugaringBarn,
		snowCoveredTrees,
		family
	} from '$lib/assets';
</script>

<svelte:head>
	<title>Maple Syrup – The Russell Farm</title>
	<meta
		name="description"
		content="Russell Farm maple syrup. Pints, quarts, half gallons and gallons. Starksboro, VT."
	/>
</svelte:head>

<div class="pageHero">
	<div class="container">
		<h1>Russell Farm Maple Syrup</h1>
		<p>Pure Vermont maple syrup from our sugarbush</p>
	</div>
</div>

<section class="sectionWhite">
	<div class="container">
		<div class="pricingGrid">
			<div class="priceCard">
				<span class="priceSize">Pint</span>
				<span class="priceAmount">$10</span>
			</div>
			<div class="priceCard">
				<span class="priceSize">Quart</span>
				<span class="priceAmount">$18</span>
			</div>
			<div class="priceCard">
				<span class="priceSize">Half Gallon</span>
				<span class="priceAmount">$30</span>
			</div>
			<div class="priceCard">
				<span class="priceSize">Gallon</span>
				<span class="priceAmount">$50</span>
			</div>
		</div>
		<p class="orderNote">
			Maple syrup is available year-round. Please call or email to order and arrange pickup.
		</p>
		<div class="contactInline">
			<a href="tel:802-453-2208">802-453-2208</a>
			<a href="mailto:Maplehillside@gmail.com">Maplehillside@gmail.com</a>
		</div>
		<hr class="sectionDivider" />
		<div class="mapleContent">
			<h2>100% Pure Maple Syrup</h2>
			<p>
				Our delicate and delicious maple syrup comes straight off of our mountain and boiled in our
				sugar house. The tradition of making syrup has been passed down through generations of
				Vermonters. A lot of passion and hard work goes in to bring it from the trees to your table.
			</p>

			<h3>2021: New Beginnings</h3>
			<div class="mapleContentBlock blockOne">
				<p>
					2021 marks a new start for The Russell Farm as the oldest grandchild of Dave and Janet,
					Brandon, takes over the 5000 tap sugaring operation. Brandon is the next up and coming
					generation for the farm and graduated from the University of Vermont in May of 2020. As
					the farm goes through its transition process from Dave and Janet to Brandon, it was
					decided that the most logical place to start was the sugaring operation.
				</p>
				<div class="mapleContentBlockImage">
					<img src={daveAndBrandon} alt="Dave and Brandon" />
				</div>
			</div>

			<h3>The Process</h3>
			<p>
				The process of turning maple sap into maple syrup has been a tradition that traces back to
				days before colonial settlers came west to New England. Today the process is different, the
				product is different, but the concept remains the same. Today we work to tame the woods and
				harvest a crop that is hard earned and provides a sweet reward.
			</p>

			<h4>Sap Collection</h4>
			<p>
				The sap collection process is done primarily with buckets or lines. When Dave (Grandpa) was
				a boy, Percheron horses would tow a collection tank around and collect sap with buckets.
				Today, we use a sap collection system with lines and vacuum pump that pulls sap from over
				5000 maple trees. Once the sap is collected, next comes the boiling process...
			</p>

			<h4>The Boiling Process</h4>
			<p>
				Boiling is the sweetest part of the sugaring process and takes careful precision. The sap
				goes through a series of steps to condense the sap down to syrup. It takes an average of
				45-85 gallons of sap to make one gallon of syrup. Thats a lot of sap! the average tree
				produces 1/2 a gallon of syrup every year. Before the syrup is canned into food-grade
				barrels, the syrup must reach a temperature of 219° F, followed by an intense filtering
				process. This completes the boiling and canning process that brings syrup from our woods to
				your table.
			</p>

			<p>
				Though this is a simple explanation of our sugaring process, a lot was left out to
				accommodate some highlights that produce our product. If you would like to learn more, we
				encourage you to read THIS ARTICLE for a deeper understanding of how maple syrup is
				produced.
			</p>
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

	.pricingGrid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1.25rem;
		margin-bottom: 2rem;
	}

	.priceCard {
		background: var(--color-cream);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		text-align: center;
	}

	.priceSize {
		display: block;
		font-weight: 600;
		color: var(--color-forest);
		margin-bottom: 0.5rem;
	}

	.priceAmount {
		font-family: var(--font-serif);
		font-size: 1.5rem;
		color: var(--color-forest-dk);
	}

	.orderNote {
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.contactInline {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}

	.contactInline a {
		font-weight: 600;
	}

	.sectionDivider {
		margin: 3rem 0 2rem;
		border: 0;
		border-top: 1px solid var(--color-border);
	}

	.mapleContent h2 {
		font-size: clamp(1.5rem, 3vw, 2rem);
		color: var(--color-forest-dk);
		margin-bottom: 0.75rem;
	}
	.mapleContent {
		h3 {
			font-size: clamp(1.25rem, 3vw, 1.5rem);
		}
		h4 {
			font-size: clamp(1.1rem, 2vw, 1.25rem);
		}
		p {
			color: var(--color-text);
			font-size: clamp(1rem, 2vw, 1.25rem);
			margin-bottom: 0.75rem;
		}
	}

	.mapleContent h3,
	.mapleContent h4 {
		color: var(--color-forest);
		margin-top: 2rem;
		margin-bottom: 0.5rem;
	}

	.blockOne {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		@media (max-width: 768px) {
			grid-template-columns: 1fr;
			align-items: center;
			justify-content: center;
		}
	}
	.mapleContentBlockImage {
		img {
			width: 100%;
			height: auto;
			object-fit: cover;
		}
	}
</style>
