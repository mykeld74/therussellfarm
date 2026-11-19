/** Base height included in the tree-only / wagon price (under 8′). */
export const treeBaseMaxFeet = 7;

/** Tallest height shown on the public price chart. */
export const treeChartMaxFeet = 15;

export type TreePriceChartRow = {
	/** Whole feet, or null for the under-8′ base row. */
	feet: number | null;
	label: string;
	treeOnlyPrice: number;
	wagonPrice: number;
};

/** Tree-only price for a given height in whole feet. */
export function priceForTreeHeight(
	basePrice: number,
	overagePerFoot: number,
	feet: number
): number {
	if (feet <= treeBaseMaxFeet) return basePrice;
	return basePrice + overagePerFoot * (feet - treeBaseMaxFeet);
}

/** Public chart: under 8′ plus each foot from 8′–15′, wagon vs tree-only. */
export function treePriceChart(
	basePrice: number,
	overagePerFoot: number,
	experiencePrice: number
): TreePriceChartRow[] {
	const rows: TreePriceChartRow[] = [
		{
			feet: null,
			label: 'Under 8′',
			treeOnlyPrice: basePrice,
			wagonPrice: experiencePrice
		}
	];

	for (let feet = treeBaseMaxFeet + 1; feet <= treeChartMaxFeet; feet++) {
		const treeOnlyPrice = priceForTreeHeight(basePrice, overagePerFoot, feet);
		rows.push({
			feet,
			label: `${feet}′`,
			treeOnlyPrice,
			wagonPrice: experiencePrice + (treeOnlyPrice - basePrice)
		});
	}

	return rows;
}
