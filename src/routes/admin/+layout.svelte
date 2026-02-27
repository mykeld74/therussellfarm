<script lang="ts">
	import { page } from '$app/state';

	let { children, data } = $props();

	const baseNavItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/bookings', label: 'Bookings', icon: '📋' },
		{ href: '/admin/availability', label: 'Availability', icon: '📅' },
		{ href: '/admin/pricing', label: 'Pricing', icon: '💲' }
	];

	const superAdminItems = [{ href: '/admin/users', label: 'Users', icon: '👥' }];

	const navItems = $derived(
		data.role === 'super_admin' ? [...baseNavItems, ...superAdminItems] : baseNavItems
	);

	function isActive(href: string): boolean {
		if (href === '/admin') return page.url.pathname === '/admin';
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="adminShell">
	<aside class="adminSidebar">
		<div class="sidebarHeader">
			<a href="/admin" class="sidebarBrand">
				<span>🌲</span>
				<span>Farm Admin</span>
			</a>
		</div>

		<nav class="sidebarNav">
			{#each navItems as item}
				<a href={item.href} class="sidebarLink" class:active={isActive(item.href)}>
					<span class="navIcon">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebarFooter">
			<a href="/" class="sidebarLink muted">
				<span class="navIcon">←</span>
				<span>Back to Site</span>
			</a>
		</div>
	</aside>

	<div class="adminContent">
		{@render children()}
	</div>
</div>

<style>
	.adminShell {
		display: flex;
		min-height: calc(100vh - var(--header-height));
	}

	.adminSidebar {
		width: 240px;
		background: var(--color-forest-dk);
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--header-height);
		height: calc(100vh - var(--header-height));
		overflow-y: auto;
	}

	.sidebarHeader {
		padding: 1.5rem 1.25rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.sidebarBrand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-cream);
		text-decoration: none;
		font-family: var(--font-serif);
		font-size: 1rem;
		font-weight: bold;
	}

	.sidebarNav {
		padding: 1rem 0.75rem;
		flex: 1;
	}

	.sidebarLink {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius);
		color: rgba(249, 245, 238, 0.75);
		text-decoration: none;
		font-size: 0.9rem;
		transition: background 0.15s, color 0.15s;
		margin-bottom: 0.2rem;
	}

	.sidebarLink:hover {
		background: rgba(255, 255, 255, 0.1);
		color: var(--color-white);
	}

	.sidebarLink.active {
		background: var(--color-forest);
		color: var(--color-white);
		font-weight: 600;
	}

	.sidebarLink.muted {
		color: rgba(249, 245, 238, 0.5);
		font-size: 0.85rem;
	}

	.navIcon {
		font-size: 1rem;
		width: 1.25rem;
		text-align: center;
		flex-shrink: 0;
	}

	.sidebarFooter {
		padding: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	.adminContent {
		flex: 1;
		padding: 2rem;
		overflow: auto;
	}

	@media (max-width: 768px) {
		.adminShell {
			flex-direction: column;
		}

		.adminSidebar {
			width: 100%;
			height: auto;
			position: static;
			flex-direction: row;
		}

		.sidebarHeader {
			border-bottom: none;
			border-right: 1px solid rgba(255, 255, 255, 0.1);
			padding: 0.75rem 1rem;
		}

		.sidebarNav {
			display: flex;
			flex-direction: row;
			padding: 0.5rem;
			gap: 0.25rem;
		}

		.sidebarLink {
			margin-bottom: 0;
		}

		.sidebarFooter {
			display: none;
		}
	}
</style>
