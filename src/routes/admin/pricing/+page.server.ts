import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { pricing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/admin-guard';

const SINGLE_PRICING_ID = 1;

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);

	const [row] = await db
		.select({
			id: pricing.id,
			treePriceCents: pricing.treePriceCents,
			experiencePriceCents: pricing.experiencePriceCents
		})
		.from(pricing)
		.where(eq(pricing.id, SINGLE_PRICING_ID))
		.limit(1);

	const current = row ?? { id: SINGLE_PRICING_ID, treePriceCents: 6500, experiencePriceCents: 11000 };

	if (!row) {
		await db
			.insert(pricing)
			.values(current)
			.onConflictDoNothing();
	}

	return {
		treePrice: current.treePriceCents / 100,
		experiencePrice: current.experiencePriceCents / 100
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals);

		const form = await request.formData();
		const treePriceStr = form.get('treePrice')?.toString() ?? '';
		const experiencePriceStr = form.get('experiencePrice')?.toString() ?? '';

		const treePrice = Number(treePriceStr);
		const experiencePrice = Number(experiencePriceStr);

		if (!Number.isFinite(treePrice) || treePrice <= 0) {
			return fail(400, { error: 'Tree price must be a positive number.', treePrice: treePriceStr, experiencePrice: experiencePriceStr });
		}

		if (!Number.isFinite(experiencePrice) || experiencePrice <= 0) {
			return fail(400, { error: 'Experience price must be a positive number.', treePrice: treePriceStr, experiencePrice: experiencePriceStr });
		}

		await db
			.insert(pricing)
			.values({
				id: SINGLE_PRICING_ID,
				treePriceCents: Math.round(treePrice * 100),
				experiencePriceCents: Math.round(experiencePrice * 100)
			})
			.onConflictDoUpdate({
				target: pricing.id,
				set: {
					treePriceCents: Math.round(treePrice * 100),
					experiencePriceCents: Math.round(experiencePrice * 100)
				}
			});

		return {
			success: true,
			treePrice: treePriceStr,
			experiencePrice: experiencePriceStr
		};
	}
};

