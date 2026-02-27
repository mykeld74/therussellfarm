<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { page } from '$app/state';

	let { form }: { form: ActionData } = $props();

	let activeTab = $state<'signIn' | 'signUp'>('signIn');
	let loading = $state(false);

	const next = $derived(page.url.searchParams.get('next') ?? '/bookings');
</script>

<svelte:head>
	<title>Sign In – The Russell Farm</title>
</svelte:head>

<div class="authPage container">
	<div class="authCard">
		<div class="authHeader">
			<h1>The Russell Farm</h1>
			<p>Sign in to manage your bookings</p>
		</div>

		<!-- Tab switcher -->
		<div class="tabs">
			<button class="tab" class:active={activeTab === 'signIn'} onclick={() => (activeTab = 'signIn')}>
				Sign In
			</button>
			<button class="tab" class:active={activeTab === 'signUp'} onclick={() => (activeTab = 'signUp')}>
				Create Account
			</button>
		</div>

		{#if form?.message}
			<div class="alert alertError">{form.message}</div>
		{/if}

		<!-- Sign In Form -->
		{#if activeTab === 'signIn'}
			<form
				method="POST"
				action="?/signIn"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<input type="hidden" name="next" value={next} />

				<div class="field">
					<label for="email">Email</label>
					<input id="email" name="email" type="email" required placeholder="you@example.com" autocomplete="email" />
				</div>
				<div class="field">
					<label for="password">Password</label>
					<input id="password" name="password" type="password" required placeholder="Your password" autocomplete="current-password" />
				</div>

				<button type="submit" class="btn btnPrimary" style="width:100%;" disabled={loading}>
					{loading ? 'Signing in…' : 'Sign In'}
				</button>
			</form>
		{:else}
			<!-- Sign Up Form -->
			<form
				method="POST"
				action="?/signUp"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="field">
					<label for="name-reg">Full Name</label>
					<input id="name-reg" name="name" type="text" required placeholder="Jane Smith" autocomplete="name" />
				</div>
				<div class="field">
					<label for="email-reg">Email</label>
					<input id="email-reg" name="email" type="email" required placeholder="you@example.com" autocomplete="email" />
				</div>
				<div class="field">
					<label for="password-reg">Password</label>
					<input id="password-reg" name="password" type="password" required placeholder="Choose a password (min 8 chars)" minlength="8" autocomplete="new-password" />
				</div>

				<button type="submit" class="btn btnPrimary" style="width:100%;" disabled={loading}>
					{loading ? 'Creating account…' : 'Create Account'}
				</button>
			</form>
		{/if}

		<p class="backLink"><a href="/">← Back to home</a></p>
	</div>
</div>

<style>
	.authPage {
		padding: 4rem 1.5rem;
		display: flex;
		justify-content: center;
	}

	.authCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2.5rem;
		max-width: 420px;
		width: 100%;
		box-shadow: var(--shadow-md);
	}

	.authHeader {
		text-align: center;
		margin-bottom: 1.75rem;
	}

	.authHeader h1 {
		font-size: 1.5rem;
		color: var(--color-forest-dk);
		margin-bottom: 0.25rem;
	}

	.authHeader p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.tabs {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.tab {
		flex: 1;
		padding: 0.65rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-family: var(--font-sans);
		color: var(--color-text-muted);
		transition: background 0.15s, color 0.15s;
	}

	.tab.active {
		background: var(--color-forest);
		color: var(--color-white);
		font-weight: 600;
	}

	.backLink {
		text-align: center;
		margin-top: 1.25rem;
		font-size: 0.875rem;
	}

	.backLink a {
		color: var(--color-text-muted);
	}
</style>
