<script lang="ts">
	import { page } from '$app/state';

	interface NavUser {
		name: string;
		email: string;
	}

	let {
		user,
		role = null
	}: { user: NavUser | null; role?: 'user' | 'admin' | 'super_admin' | null } = $props();

	let menuOpen = $state(false);
	let accountOpen = $state(false);

	const canAccessAdmin = $derived(role === 'admin' || role === 'super_admin');

	const initials = $derived(
		user
			? user.name
					.split(' ')
					.map((n) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: ''
	);

	function closeAll() {
		menuOpen = false;
		accountOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') accountOpen = false;
	}

	function handleClickOutside(node: HTMLElement) {
		function onClick(e: MouseEvent) {
			if (!node.contains(e.target as Node)) accountOpen = false;
		}
		document.addEventListener('click', onClick, true);
		return () => {
			document.removeEventListener('click', onClick, true);
		};
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="siteHeader">
	<div class="container navInner">
		<a href="/" class="wordmark">The Russell Farm</a>

		<button class="menuToggle" onclick={() => (menuOpen = !menuOpen)} aria-label="Toggle menu">
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
			<span class:open={menuOpen}></span>
		</button>

		<nav class:open={menuOpen}>
			<a
				href="/christmas-trees"
				class:active={page.url.pathname === '/christmas-trees'}
				onclick={closeAll}>Christmas Trees</a
			>
			<a href="/maple-syrup" class:active={page.url.pathname === '/maple-syrup'} onclick={closeAll}
				>Maple Syrup</a
			>
			<a
				href="/book"
				class="btnNav"
				class:active={page.url.pathname.startsWith('/book')}
				onclick={closeAll}>Book Now</a
			>

			{#if user}
				<!-- Desktop: account dropdown trigger -->
				<div class="accountMenu" {@attach handleClickOutside}>
					<button
						class="accountTrigger"
						class:active={accountOpen}
						onclick={() => (accountOpen = !accountOpen)}
						aria-haspopup="true"
						aria-expanded={accountOpen}
					>
						<span class="accountAvatar">{initials}</span>
						<span class="accountName">{user.name.split(' ')[0]}</span>
						<svg
							class="chevron"
							class:flipped={accountOpen}
							width="12"
							height="12"
							viewBox="0 0 12 12"
							fill="none"
							aria-hidden="true"
						>
							<path
								d="M2 4l4 4 4-4"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{#if accountOpen}
						<div class="accountDropdown" role="menu">
							<a
								href="/account"
								class="dropdownItem"
								class:dropdownItemActive={page.url.pathname === '/account'}
								onclick={closeAll}
								role="menuitem"
							>
								<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
									<circle cx="7.5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.3"/>
									<path d="M2 13c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
								</svg>
								Account Settings
							</a>
							<a
								href="/bookings"
								class="dropdownItem"
								class:dropdownItemActive={page.url.pathname === '/bookings'}
								onclick={closeAll}
								role="menuitem"
							>
								<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
									<path
										d="M3 2h9a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
										stroke="currentColor"
										stroke-width="1.3"
									/>
									<path
										d="M5 7h5M5 9.5h3"
										stroke="currentColor"
										stroke-width="1.3"
										stroke-linecap="round"
									/>
									<path
										d="M5 4.5V2M10 4.5V2"
										stroke="currentColor"
										stroke-width="1.3"
										stroke-linecap="round"
									/>
								</svg>
								My Bookings
							</a>
							{#if canAccessAdmin}
								<a
									href="/admin"
									class="dropdownItem"
									class:dropdownItemActive={page.url.pathname.startsWith('/admin')}
									onclick={closeAll}
									role="menuitem"
								>
									<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
										<rect
											x="1.5"
											y="1.5"
											width="5"
											height="5"
											rx="1"
											stroke="currentColor"
											stroke-width="1.3"
										/>
										<rect
											x="8.5"
											y="1.5"
											width="5"
											height="5"
											rx="1"
											stroke="currentColor"
											stroke-width="1.3"
										/>
										<rect
											x="1.5"
											y="8.5"
											width="5"
											height="5"
											rx="1"
											stroke="currentColor"
											stroke-width="1.3"
										/>
										<rect
											x="8.5"
											y="8.5"
											width="5"
											height="5"
											rx="1"
											stroke="currentColor"
											stroke-width="1.3"
										/>
									</svg>
									Admin Dashboard
								</a>
							{/if}
							<div class="dropdownDivider"></div>
							<form method="POST" action="/auth/logout">
								<button
									type="submit"
									class="dropdownItem dropdownSignOut"
									role="menuitem"
								>
									<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
										<path
											d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6"
											stroke="currentColor"
											stroke-width="1.3"
											stroke-linecap="round"
										/>
										<path
											d="M10 10l3-3-3-3"
											stroke="currentColor"
											stroke-width="1.3"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M13 7H6"
											stroke="currentColor"
											stroke-width="1.3"
											stroke-linecap="round"
										/>
									</svg>
									Sign Out
								</button>
							</form>
						</div>
					{/if}
				</div>

				<!-- Mobile: flat account links (shown inline in open menu) -->
				<div class="mobileAccountLinks">
					<a href="/account" class:active={page.url.pathname === '/account'} onclick={closeAll}
						>Account Settings</a
					>
					<a href="/bookings" class:active={page.url.pathname === '/bookings'} onclick={closeAll}
						>My Bookings</a
					>
					{#if canAccessAdmin}
						<a
							href="/admin"
							class:active={page.url.pathname.startsWith('/admin')}
							onclick={closeAll}>Admin</a
						>
					{/if}
					<form method="POST" action="/auth/logout">
						<button type="submit" class="signOutBtn">Sign Out</button>
					</form>
				</div>
			{:else}
				<a href="/auth/login" class:active={page.url.pathname === '/auth/login'} onclick={closeAll}
					>Sign In</a
				>
			{/if}
		</nav>
	</div>
</header>

<style>
	.siteHeader {
		background: var(--color-forest);
		height: var(--header-height);
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
	}

	.navInner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.wordmark {
		font-family: var(--font-serif);
		font-size: 1.35rem;
		font-weight: bold;
		color: var(--color-cream);
		text-decoration: none;
		letter-spacing: -0.01em;
		flex-shrink: 0;
	}

	.wordmark:hover {
		color: var(--color-white);
	}

	nav {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}

	nav a {
		color: rgba(249, 245, 238, 0.85);
		text-decoration: none;
		font-size: 0.95rem;
		transition: color 0.15s;
	}

	nav a:hover,
	nav a.active {
		color: var(--color-white);
	}

	.btnNav {
		background: rgba(255, 255, 255, 0.15);
		padding: 0.45rem 1rem;
		border-radius: var(--radius);
		font-weight: 600;
	}

	.btnNav:hover,
	.btnNav.active {
		background: rgba(255, 255, 255, 0.25);
		color: var(--color-white);
	}

	/* Account dropdown */
	.accountMenu {
		position: relative;
	}

	.accountTrigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 999px;
		padding: 0.3rem 0.65rem 0.3rem 0.3rem;
		cursor: pointer;
		color: rgba(249, 245, 238, 0.9);
		font-size: 0.9rem;
		font-family: inherit;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
	}

	.accountTrigger:hover,
	.accountTrigger.active {
		background: rgba(255, 255, 255, 0.2);
		color: var(--color-white);
		border-color: rgba(255, 255, 255, 0.35);
	}

	.accountAvatar {
		width: 26px;
		height: 26px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		flex-shrink: 0;
	}

	.accountName {
		font-weight: 500;
	}

	.chevron {
		opacity: 0.7;
		transition: transform 0.2s;
	}

	.chevron.flipped {
		transform: rotate(180deg);
	}

	.accountDropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		min-width: 200px;
		overflow: hidden;
		z-index: 200;
	}

	.dropdownItem {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
		padding: 0.7rem 1rem;
		font-size: 0.9rem;
		color: var(--color-text);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: background 0.1s;
		text-align: left;
	}

	.dropdownItem:hover {
		background: var(--color-cream);
		color: var(--color-text);
	}

	.dropdownItem svg {
		opacity: 0.5;
		flex-shrink: 0;
	}

	.dropdownItemActive {
		color: var(--color-forest);
		font-weight: 600;
	}

	.dropdownItemActive svg {
		opacity: 1;
		color: var(--color-forest);
	}

	.dropdownDivider {
		height: 1px;
		background: var(--color-border);
		margin: 0.25rem 0;
	}

	.dropdownSignOut {
		color: var(--color-barn-red);
	}

	.dropdownSignOut:hover {
		background: #fee2e2;
		color: var(--color-barn-red);
	}

	/* Mobile account links — hidden on desktop, shown in mobile menu */
	.mobileAccountLinks {
		display: none;
	}

	/* Mobile account links — hide the desktop dropdown trigger */
	.signOutBtn {
		background: none;
		border: none;
		color: rgba(249, 245, 238, 0.75);
		font-size: 0.95rem;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
		transition: color 0.15s;
	}

	.signOutBtn:hover {
		color: var(--color-white);
	}

	/* Hamburger */
	.menuToggle {
		display: none;
		flex-direction: column;
		gap: 5px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.menuToggle span {
		display: block;
		width: 24px;
		height: 2px;
		background: var(--color-cream);
		transition:
			transform 0.2s,
			opacity 0.2s;
	}

	.menuToggle span.open:nth-child(1) {
		transform: translateY(7px) rotate(45deg);
	}
	.menuToggle span.open:nth-child(2) {
		opacity: 0;
	}
	.menuToggle span.open:nth-child(3) {
		transform: translateY(-7px) rotate(-45deg);
	}

	@media (max-width: 680px) {
		.menuToggle {
			display: flex;
		}

		nav {
			display: none;
			position: absolute;
			top: var(--header-height);
			left: 0;
			right: 0;
			background: var(--color-forest-dk);
			flex-direction: column;
			align-items: stretch;
			padding: 1rem;
			gap: 0;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		}

		nav.open {
			display: flex;
		}

		nav a,
		.signOutBtn {
			padding: 0.75rem 0;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			font-size: 1rem;
		}

		.btnNav {
			background: none;
			border-radius: 0;
			color: rgba(249, 245, 238, 0.85);
		}

		/* Hide desktop dropdown, show flat mobile links */
		.accountMenu {
			display: none;
		}

		.mobileAccountLinks {
			display: contents;
		}
	}
</style>
