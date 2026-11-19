<script lang="ts">
	import { treePriceChart } from '$lib/tree-pricing';

	let {
		basePrice,
		overagePerFoot,
		experiencePrice
	}: {
		basePrice: number;
		overagePerFoot: number;
		experiencePrice: number;
	} = $props();

	const chartRows = $derived(treePriceChart(basePrice, overagePerFoot, experiencePrice));
</script>

<div class="treePricing">
	<div class="chartWrap">
		<table class="priceChart">
			<caption>Pricing by tree height</caption>
			<thead>
				<tr>
					<th scope="col">Height</th>
					<th scope="col">Wagon experience</th>
					<th scope="col">Tree only</th>
				</tr>
			</thead>
			<tbody>
				{#each chartRows as row (row.label)}
					<tr>
						<td>{row.label}</td>
						<td>${row.wagonPrice.toFixed(0)}</td>
						<td>${row.treeOnlyPrice.toFixed(0)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.treePricing {
		max-width: 36rem;
		margin: 1.75rem auto 0;
	}

	.chartWrap {
		overflow-x: auto;
	}

	.priceChart {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
		background: var(--color-cream);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.priceChart caption {
		caption-side: top;
		text-align: left;
		font-weight: 600;
		color: var(--color-forest-dk);
		padding: 0 0 0.5rem;
		font-size: 0.9rem;
	}

	.priceChart th,
	.priceChart td {
		padding: 0.55rem 0.85rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.priceChart th {
		background: rgba(45, 90, 39, 0.08);
		color: var(--color-forest-dk);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.priceChart td:nth-child(n + 2),
	.priceChart th:nth-child(n + 2) {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.priceChart tbody tr:last-child td {
		border-bottom: none;
	}

	.priceChart tbody tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.45);
	}
</style>
