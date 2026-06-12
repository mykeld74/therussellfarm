<script lang="ts">
	export type AdminNavIconName =
		| 'dashboard'
		| 'bookings'
		| 'availability'
		| 'pricing'
		| 'users'
		| 'tree'
		| 'arrowLeft';

	let {
		name,
		size = 20
	}: { name: AdminNavIconName; size?: number } = $props();
</script>

<svg
	class="adminNavIcon"
	width={size}
	height={size}
	viewBox="0 0 20 20"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'dashboard'}
		<rect x="2.75" y="2.75" width="6" height="6" rx="1.25" />
		<rect x="11.25" y="2.75" width="6" height="6" rx="1.25" />
		<rect x="2.75" y="11.25" width="6" height="6" rx="1.25" />
		<rect x="11.25" y="11.25" width="6" height="6" rx="1.25" />
	{:else if name === 'bookings'}
		<path d="M6.5 3.5h7a1.25 1.25 0 0 1 1.25 1.25v11.5a1.25 1.25 0 0 1-1.25 1.25h-7a1.25 1.25 0 0 1-1.25-1.25V4.75a1.25 1.25 0 0 1 1.25-1.25Z" />
		<path d="M7.5 3.5V3a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v.5" />
		<path d="M7 9h6M7 12h4.5" />
	{:else if name === 'availability'}
		<path d="M4 4.5h12v12.5H4V4.5Z" />
		<path d="M4 8.5h12" />
		<path d="M7 2.75v2.5M13 2.75v2.5" />
		<path d="M7 11.5h2.5M7 14.5h4" />
	{:else if name === 'pricing'}
		<path d="M10 3.25v13.5" />
		<path
			d="M12.85 6.35C12.85 4.95 11.55 4 10 4 8.2 4 6.85 5.05 6.85 6.55c0 1.75 1.45 2.2 3.4 2.7 2.1.5 3.4 1.3 3.4 3.05 0 1.8-1.55 3.05-3.65 3.05-2.05 0-3.7-1.1-4-2.75"
		/>
	{:else if name === 'users'}
		<circle cx="7.25" cy="7" r="2.25" />
		<path d="M3 16.25c0-2.65 1.9-4.25 4.25-4.25s4.25 1.6 4.25 4.25" />
		<circle cx="14.25" cy="7.75" r="1.85" />
		<path d="M16.75 16.25c0-1.85-1.1-3.1-2.75-3.45" />
	{:else if name === 'tree'}
		<path d="M10 2.75 6.25 9.25H8.5L6.25 14.25h7.5L11.5 9.25H13.75L10 2.75Z" />
		<path d="M8.75 14.25V17.25h2.5v-3" />
	{:else if name === 'arrowLeft'}
		<path d="M8.5 4.5 4.5 10l4 5.5" />
		<path d="M4.5 10h11" />
	{/if}
</svg>

<style>
	.adminNavIcon {
		display: block;
		flex-shrink: 0;
	}
</style>
