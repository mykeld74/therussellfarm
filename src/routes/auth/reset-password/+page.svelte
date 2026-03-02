<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let loading = $state(false);
	let confirmPassword = $state('');
	let newPassword = $state('');

	const passwordMismatch = $derived(confirmPassword.length > 0 && confirmPassword !== newPassword);
	const isInvalidLink = $derived(data.tokenError === 'INVALID_TOKEN' || !data.token);
</script>

<svelte:head>
	<title>Reset Password – The Russell Farm</title>
</svelte:head>

<div class="authPage container">
	<div class="authCard">
		<div class="authHeader">
			<h1>The Russell Farm</h1>
			<p>Choose a new password</p>
		</div>

		{#if isInvalidLink}
			<div class="alert alertError">
				This reset link is invalid or has expired. Please request a new one.
			</div>
			<p class="backLink"><a href="/auth/forgot-password">Request a new reset link</a></p>
		{:else}
			{#if form?.message}
				<div class="alert alertError">{form.message}</div>
			{/if}

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
				<input type="hidden" name="token" value={data.token} />

				<div class="field">
					<label for="newPassword">New Password</label>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						required
						minlength="8"
						placeholder="At least 8 characters"
						autocomplete="new-password"
						bind:value={newPassword}
					/>
				</div>

				<div class="field">
					<label for="confirmPassword">Confirm Password</label>
					<input
						id="confirmPassword"
						type="password"
						required
						placeholder="Repeat your new password"
						autocomplete="new-password"
						bind:value={confirmPassword}
						class:fieldError={passwordMismatch}
					/>
					{#if passwordMismatch}
						<span class="fieldErrorMsg">Passwords do not match.</span>
					{/if}
				</div>

				<button
					type="submit"
					class="btn btnPrimary"
					style="width:100%;"
					disabled={loading || passwordMismatch}
				>
					{loading ? 'Saving…' : 'Set New Password'}
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

	.fieldError {
		border-color: var(--color-barn-red) !important;
	}

	.fieldErrorMsg {
		display: block;
		color: var(--color-barn-red);
		font-size: 0.8rem;
		margin-top: 0.25rem;
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
