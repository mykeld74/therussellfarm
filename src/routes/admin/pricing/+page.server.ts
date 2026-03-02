import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { pricing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';

const SINGLE_PRICING_ID = 1;

function validateDollar(value: string, label: string): { error: string } | { cents: number } {
	const n = Number(value);
	if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
		return { error: `${label} must be a whole dollar amount greater than 0.` };
	}
	return { cents: n * 100 };
}

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);

	const [row] = await db
		.select({
			id: pricing.id,
			treePriceCents: pricing.treePriceCents,
			experiencePriceCents: pricing.experiencePriceCents,
			mapleSyrupPintCents: pricing.mapleSyrupPintCents,
			mapleSyrupQuartCents: pricing.mapleSyrupQuartCents,
			mapleSyrupHalfGallonCents: pricing.mapleSyrupHalfGallonCents,
			mapleSyrupGallonCents: pricing.mapleSyrupGallonCents
		})
		.from(pricing)
		.where(eq(pricing.id, SINGLE_PRICING_ID))
		.limit(1);

	const current = row ?? {
		id: SINGLE_PRICING_ID,
		treePriceCents: 6500,
		experiencePriceCents: 11000,
		mapleSyrupPintCents: 1200,
		mapleSyrupQuartCents: 2000,
		mapleSyrupHalfGallonCents: 3500,
		mapleSyrupGallonCents: 6000
	};

	if (!row) {
		await db.insert(pricing).values(current).onConflictDoNothing();
	}

	return {
		treePrice: current.treePriceCents / 100,
		experiencePrice: current.experiencePriceCents / 100,
		mapleSyrupPint: current.mapleSyrupPintCents / 100,
		mapleSyrupQuart: current.mapleSyrupQuartCents / 100,
		mapleSyrupHalfGallon: current.mapleSyrupHalfGallonCents / 100,
		mapleSyrupGallon: current.mapleSyrupGallonCents / 100
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals);

		const form = await request.formData();
		const raw = {
			treePrice: form.get('treePrice')?.toString() ?? '',
			experiencePrice: form.get('experiencePrice')?.toString() ?? '',
			mapleSyrupPint: form.get('mapleSyrupPint')?.toString() ?? '',
			mapleSyrupQuart: form.get('mapleSyrupQuart')?.toString() ?? '',
			mapleSyrupHalfGallon: form.get('mapleSyrupHalfGallon')?.toString() ?? '',
			mapleSyrupGallon: form.get('mapleSyrupGallon')?.toString() ?? ''
		};

		const fields: [string, string, string][] = [
			['treePrice', raw.treePrice, 'Tree price'],
			['experiencePrice', raw.experiencePrice, 'Experience price'],
			['mapleSyrupPint', raw.mapleSyrupPint, 'Pint price'],
			['mapleSyrupQuart', raw.mapleSyrupQuart, 'Quart price'],
			['mapleSyrupHalfGallon', raw.mapleSyrupHalfGallon, 'Half gallon price'],
			['mapleSyrupGallon', raw.mapleSyrupGallon, 'Gallon price']
		];

		for (const [, value, label] of fields) {
			const result = validateDollar(value, label);
			if ('error' in result) {
				return fail(400, { error: result.error, ...raw });
			}
		}

		// All values are valid — safe to cast
		const treePrice = Number(raw.treePrice);
		const experiencePrice = Number(raw.experiencePrice);
		const mapleSyrupPint = Number(raw.mapleSyrupPint);
		const mapleSyrupQuart = Number(raw.mapleSyrupQuart);
		const mapleSyrupHalfGallon = Number(raw.mapleSyrupHalfGallon);
		const mapleSyrupGallon = Number(raw.mapleSyrupGallon);

		const values = {
			id: SINGLE_PRICING_ID,
			treePriceCents: treePrice * 100,
			experiencePriceCents: experiencePrice * 100,
			mapleSyrupPintCents: mapleSyrupPint * 100,
			mapleSyrupQuartCents: mapleSyrupQuart * 100,
			mapleSyrupHalfGallonCents: mapleSyrupHalfGallon * 100,
			mapleSyrupGallonCents: mapleSyrupGallon * 100
		};

		await db
			.insert(pricing)
			.values(values)
			.onConflictDoUpdate({ target: pricing.id, set: values });

		return { success: true, ...raw };
	}
};
