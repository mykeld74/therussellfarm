<script lang="ts">
	import { enhance } from '$app/forms';
	import IMask from 'imask';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let profileSubmitting = $state(false);
	let passwordSubmitting = $state(false);

	const phoneMaskConfig = { mask: '(000) 000-0000' };

	// Show saved values after a successful update, otherwise fall back to loaded values
	const nameValue = $derived(
		form && 'updatedName' in form && typeof form.updatedName === 'string'
			? form.updatedName
			: data.user.name
	);

	const phoneValue = $derived(
		form && 'updatedPhone' in form && typeof form.updatedPhone === 'string'
			? form.updatedPhone
			: (data.phone ?? '')
	);
</script>

<svelte:head>
	<title>Account – The Russell Farm</title>
</svelte:head>

<div class="pageHero">
	<div class="container">
		<h1>Account Settings</h1>
		<p>Manage your profile and password</p>
	</div>
</div>

<div class="accountPage container">
	<!-- Profile section -->
	<section class="accountSection">
		<div class="sectionHead">
			<h2>Profile Information</h2>
		</div>

		{#if form?.profileSuccess}
			<div class="alert alertSuccess">Profile updated successfully.</div>
		{/if}
		{#if form?.profileError}
			<div class="alert alertError">{form.profileError}</div>
		{/if}

		<form
			method="POST"
			action="?/updateProfile"
			use:enhance={() => {
				profileSubmitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					profileSubmitting = false;
				};
			}}
		>
			<div class="field">
				<label for="name">Full Name</label>
				<input id="name" name="name" type="text" value={nameValue} required minlength="2" />
			</div>

			<div class="field">
				<label for="email">Email Address</label>
				<input id="email" type="email" value={data.user.email} disabled />
				<p class="fieldNote">
					Email cannot be changed — it's used to link your bookings to your account.
				</p>
			</div>

			<div class="field">
				<label for="phone">Phone Number <span class="labelOptional">(optional)</span></label>
				<input
					use:IMask={phoneMaskConfig}
					id="phone"
					name="phone"
					type="tel"
					value={phoneValue}
					placeholder="(555) 555-5555"
				/>
			</div>

			<button type="submit" class="btn btnPrimary" disabled={profileSubmitting}>
				{profileSubmitting ? 'Saving…' : 'Save Changes'}
			</button>
		</form>
	</section>

	<!-- Password section -->
	<section class="accountSection">
		<div class="sectionHead">
			<h2>Change Password</h2>
		</div>

		{#if form?.passwordSuccess}
			<div class="alert alertSuccess">Password changed successfully.</div>
		{/if}
		{#if form?.passwordError}
			<div class="alert alertError">{form.passwordError}</div>
		{/if}

		<form
			method="POST"
			action="?/changePassword"
			use:enhance={() => {
				passwordSubmitting = true;
				return async ({ update, result }) => {
					await update({ reset: result.type === 'success' });
					passwordSubmitting = false;
				};
			}}
		>
			<div class="field">
				<label for="currentPassword">Current Password</label>
				<input id="currentPassword" name="currentPassword" type="password" required />
			</div>

			<div class="field">
				<label for="newPassword">New Password</label>
				<input
					id="newPassword"
					name="newPassword"
					type="password"
					required
					minlength="8"
				/>
			</div>

			<div class="field">
				<label for="confirmPassword">Confirm New Password</label>
				<input id="confirmPassword" name="confirmPassword" type="password" required minlength="8" />
			</div>

			<button type="submit" class="btn btnPrimary" disabled={passwordSubmitting}>
				{passwordSubmitting ? 'Saving…' : 'Update Password'}
			</button>
		</form>
	</section>
</div>

<style>
	.pageHero {
		background: linear-gradient(150deg, #1a3d18 0%, var(--color-forest) 60%, #2d5a27 100%);
		color: var(--color-cream);
		padding: 3rem 0 2.5rem;
		text-align: center;
	}

	.pageHero h1 {
		color: var(--color-white);
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		margin-bottom: 0.375rem;
	}

	.pageHero p {
		color: rgba(249, 245, 238, 0.8);
		margin: 0;
	}

	.accountPage {
		padding: 3rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 560px;
	}

	.accountSection {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 2rem;
	}

	.sectionHead {
		margin-bottom: 1.5rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 1rem;
	}

	.sectionHead h2 {
		font-size: 1.05rem;
		color: var(--color-text);
		margin: 0;
	}

	.fieldNote {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin: 0.375rem 0 0;
	}

	.labelOptional {
		font-weight: 400;
		color: var(--color-text-muted);
		font-size: 0.85em;
	}

	input:disabled {
		background: var(--color-cream);
		color: var(--color-text-muted);
		cursor: not-allowed;
	}
</style>
