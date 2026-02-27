<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTime(t: string): string {
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
	}
</script>

<svelte:head>
	<title>Booking Confirmed – The Russell Farm</title>
</svelte:head>

<div class="confirmationPage container">
	<div class="confirmationCard">
		<div class="successIcon">🌲</div>
		<h1>You're all set!</h1>
		<p class="successSubtitle">
			Your booking has been received. We'll see you at the farm!
		</p>

		<div class="bookingRefBanner">
			<span class="refLabel">Your booking reference</span>
			<span class="refCode">{data.booking.bookingRef}</span>
		</div>

		<!-- Details -->
		<div class="bookingDetails">
			<div class="detailRow">
				<span class="detailLabel">Experience</span>
				<span class="detailValue">Christmas Tree Wagon Ride & Cottage Experience</span>
			</div>
			<div class="detailRow">
				<span class="detailLabel">Date</span>
				<span class="detailValue">{formatDate(data.booking.date)}</span>
			</div>
			<div class="detailRow">
				<span class="detailLabel">Time</span>
				<span class="detailValue">{formatTime(data.booking.startTime)} – {formatTime(data.booking.endTime)}</span>
			</div>
			<div class="detailRow">
				<span class="detailLabel">Name</span>
				<span class="detailValue">{data.booking.name}</span>
			</div>
			<div class="detailRow">
				<span class="detailLabel">Party size</span>
				<span class="detailValue">
					{data.booking.partySizeAdults} adult{data.booking.partySizeAdults !== 1 ? 's' : ''}
					{#if data.booking.partySizeKids > 0}
						+ {data.booking.partySizeKids} child{data.booking.partySizeKids !== 1 ? 'ren' : ''}
					{/if}
				</span>
			</div>
		</div>

		<div class="emailNotice">
			<span class="emailIcon">📧</span>
			<p>
				A confirmation email has been sent to <strong>{data.booking.email}</strong>.<br />
				Keep an eye on your inbox (check spam if you don't see it).
			</p>
		</div>

		{#if !data.isLoggedIn}
			<div class="accountCta">
				<p>Want to manage your booking online?</p>
				<a href="/auth/login" class="btn btnSecondary">Create an Account</a>
			</div>
		{:else}
			<a href="/bookings" class="btn btnSecondary">View My Bookings</a>
		{/if}

		<div class="homeLink">
			<a href="/">← Back to home</a>
		</div>
	</div>
</div>

<style>
	.confirmationPage {
		padding: 4rem 1.5rem;
		display: flex;
		justify-content: center;
	}

	.confirmationCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 3rem 2.5rem;
		max-width: 520px;
		width: 100%;
		text-align: center;
		box-shadow: var(--shadow-md);
	}

	.successIcon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.confirmationCard h1 {
		color: var(--color-forest-dk);
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.successSubtitle {
		color: var(--color-text-muted);
		margin-bottom: 2rem;
	}

	.bookingRefBanner {
		background: var(--color-forest);
		color: var(--color-white);
		border-radius: var(--radius);
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.refLabel {
		font-size: 0.8rem;
		opacity: 0.8;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.refCode {
		font-size: 1.75rem;
		font-weight: 700;
		font-family: var(--font-serif);
		letter-spacing: 0.05em;
	}

	.bookingDetails {
		text-align: left;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.detailRow {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding: 0.75rem 1rem;
		gap: 1rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}

	.detailRow:last-child {
		border-bottom: none;
	}

	.detailLabel {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.detailValue {
		font-weight: 600;
		text-align: right;
	}

	.emailNotice {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		background: var(--color-cream);
		border-radius: var(--radius);
		padding: 1rem;
		margin-bottom: 1.5rem;
		text-align: left;
	}

	.emailIcon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.emailNotice p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.6;
	}

	.accountCta {
		margin-bottom: 1rem;
	}

	.accountCta p {
		color: var(--color-text-muted);
		font-size: 0.9rem;
		margin-bottom: 0.75rem;
	}

	.homeLink {
		margin-top: 1.5rem;
		font-size: 0.875rem;
	}

	.homeLink a {
		color: var(--color-text-muted);
	}
</style>
