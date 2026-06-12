<script lang="ts">
	import { browser } from '$app/environment';
	import { onNavigate } from '$app/navigation';
	import favicon from '$lib/assets/favicon.webp';
	import Nav from '$lib/components/Nav.svelte';
	import '$lib/styles/global.css';

	let { children, data } = $props();

	if (browser) {
		onNavigate((navigation) => {
			if (!document.startViewTransition) return;
			if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

			return new Promise<void>((resolve) => {
				document.startViewTransition(async () => {
					resolve();
					await navigation.complete;
				});
			});
		});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} type="image/webp" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Nav user={data.user ?? null} role={data.role ?? null} />

<main>
	{@render children()}
</main>

<footer class="siteFooter">
	<p>© {new Date().getFullYear()} The Russell Farm · All rights reserved</p>
</footer>
