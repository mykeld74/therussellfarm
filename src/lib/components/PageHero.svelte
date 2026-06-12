<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '' }: { children: Snippet; class?: string } = $props();
</script>

<div class="pageHero {className}">
	<div class="pageHeroBackdrop" aria-hidden="true"></div>
	<div class="container pageHeroInner">
		{@render children()}
	</div>
</div>
