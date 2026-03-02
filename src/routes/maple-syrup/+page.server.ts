import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { pricing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const SINGLE_PRICING_ID = 1;

export const load: PageServerLoad = async () => {
	const [row] = await db
		.select({
			mapleSyrupPintCents: pricing.mapleSyrupPintCents,
			mapleSyrupQuartCents: pricing.mapleSyrupQuartCents,
			mapleSyrupHalfGallonCents: pricing.mapleSyrupHalfGallonCents,
			mapleSyrupGallonCents: pricing.mapleSyrupGallonCents
		})
		.from(pricing)
		.where(eq(pricing.id, SINGLE_PRICING_ID))
		.limit(1);

	// Fall back to defaults if the pricing row hasn't been seeded yet
	const data = row ?? {
		mapleSyrupPintCents: 1200,
		mapleSyrupQuartCents: 2000,
		mapleSyrupHalfGallonCents: 3500,
		mapleSyrupGallonCents: 6000
	};

	return {
		pint: data.mapleSyrupPintCents / 100,
		quart: data.mapleSyrupQuartCents / 100,
		halfGallon: data.mapleSyrupHalfGallonCents / 100,
		gallon: data.mapleSyrupGallonCents / 100
	};
};
