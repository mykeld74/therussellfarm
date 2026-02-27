import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { pricing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SINGLE_PRICING_ID = 1;

export const load: PageServerLoad = async () => {
	const [row] = await db
		.select({
			id: pricing.id,
			treePriceCents: pricing.treePriceCents
		})
		.from(pricing)
		.where(eq(pricing.id, SINGLE_PRICING_ID))
		.limit(1);

	const current = row ?? { treePriceCents: 6500 };

	return {
		treePrice: current.treePriceCents / 100
	};
};

