<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import '$lib/styles/global.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Nav user={data.user ?? null} role={data.role ?? null} />

<main>
	{@render children()}
</main>

<footer class="siteFooter">
	<p>© {new Date().getFullYear()} The Russell Farm · All rights reserved</p>
</footer>
