<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Forgot Password – The Russell Farm</title>
</svelte:head>

<div class="authPage container">
	<div class="authCard">
		<div class="authHeader">
			<h1>The Russell Farm</h1>
			<p>Reset your password</p>
		</div>

		{#if form?.sent}
			<div class="alert alertSuccess">
				If that email is registered, you'll receive a reset link shortly. Check your inbox.
			</div>
			<p class="backLink"><a href="/auth/login">← Back to sign in</a></p>
		{:else}
			<p class="instructions">
				Enter your email address and we'll send you a link to reset your password.
			</p>

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="field">
					<label for="email">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>

				<button type="submit" class="btn btnPrimary" style="width:100%;" disabled={loading}>
					{loading ? 'Sending…' : 'Send Reset Link'}
				</button>
			</form>

			<p class="backLink"><a href="/auth/login">← Back to sign in</a></p>
		{/if}
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

	.instructions {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
		line-height: 1.5;
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
