<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { formatDateLong, formatTime, isUpcoming, badgeClass } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	let cancellingRef = $state<string | null>(null);
	let cancelError = $state('');

	async function cancelBooking(ref: string) {
		cancellingRef = ref;
		cancelError = '';
		try {
			const res = await fetch(`/api/bookings/${encodeURIComponent(ref)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'cancelled' })
			});
			if (!res.ok) throw new Error('Failed to cancel');
			await invalidateAll();
		} catch {
			cancelError = 'Could not cancel booking. Please try again.';
		} finally {
			cancellingRef = null;
		}
	}

	const upcomingBookings = $derived(data.bookings.filter((b) => isUpcoming(b.date)));
	const pastBookings = $derived(data.bookings.filter((b) => !isUpcoming(b.date)));
</script>

<svelte:head>
	<title>My Bookings – The Russell Farm</title>
</svelte:head>

<div class="pageHero">
	<div class="container">
		<h1>My Bookings</h1>
		<p>Welcome back, {data.user.name}</p>
	</div>
</div>

<div class="bookingsPage container">
	{#if data.bookings.length === 0}
		<div class="emptyState">
			<p class="emptyIcon">🌲</p>
			<h2>No bookings yet</h2>
			<p>Ready to start a new holiday tradition?</p>
			<a href="/book" class="btn btnPrimary">Book an Experience</a>
		</div>
	{:else}
		{#if cancelError}
			<div class="alert alertError">{cancelError}</div>
		{/if}

		{#if upcomingBookings.length > 0}
			<section class="bookingsSection">
				<h2>Upcoming</h2>
				<div class="bookingsList">
					{#each upcomingBookings as booking (booking.bookingRef)}
						<div class="bookingCard" class:cancelled={booking.status === 'cancelled'}>
							<div class="bookingMain">
								<div class="bookingDate">
									<strong>{formatDateLong(booking.date)}</strong>
									<span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
								</div>
								<div class="bookingInfo">
									<p>Christmas Tree Wagon Ride & Cottage Experience</p>
									<p class="partyInfo">
										{booking.partySizeAdults} adult{booking.partySizeAdults !== 1 ? 's' : ''}
										{#if booking.partySizeKids > 0}
											+ {booking.partySizeKids} child{booking.partySizeKids !== 1 ? 'ren' : ''}
										{/if}
									</p>
								</div>
							</div>
							<div class="bookingMeta">
								<span class="badge {badgeClass[booking.status]}">{booking.status}</span>
								<span class="bookingRef">{booking.bookingRef}</span>
								{#if booking.status !== 'cancelled'}
									<button
										class="btn btnDanger btnSm cancelBtn"
										disabled={cancellingRef === booking.bookingRef}
										onclick={() => cancelBooking(booking.bookingRef)}
									>
										{cancellingRef === booking.bookingRef ? 'Cancelling…' : 'Cancel booking'}
									</button>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if pastBookings.length > 0}
			<section class="bookingsSection">
				<h2>Past Visits</h2>
				<div class="bookingsList">
					{#each pastBookings as booking (booking.bookingRef)}
						<div class="bookingCard past">
							<div class="bookingMain">
								<div class="bookingDate">
									<strong>{formatDateLong(booking.date)}</strong>
									<span>{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</span>
								</div>
								<div class="bookingInfo">
									<p>Christmas Tree Wagon Ride & Cottage Experience</p>
									<p class="partyInfo">
										{booking.partySizeAdults} adult{booking.partySizeAdults !== 1 ? 's' : ''}
										{#if booking.partySizeKids > 0}
											+ {booking.partySizeKids} child{booking.partySizeKids !== 1 ? 'ren' : ''}
										{/if}
									</p>
								</div>
							</div>
							<div class="bookingMeta">
								<span class="badge {badgeClass[booking.status]}">{booking.status}</span>
								<span class="bookingRef">{booking.bookingRef}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	{/if}

	<div class="ctaRow">
		<a href="/book" class="btn btnPrimary">Book Another Experience</a>
	</div>
</div>

<style>
	.bookingsPage {
		padding: 3rem 1.5rem;
	}

	.emptyState {
		text-align: center;
		padding: 5rem 1rem;
	}

	.emptyIcon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.emptyState h2 {
		color: var(--color-forest-dk);
		margin-bottom: 0.5rem;
	}

	.emptyState p {
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
	}

	.bookingsSection {
		margin-bottom: 3rem;
	}

	.bookingsSection h2 {
		color: var(--color-forest-dk);
		font-size: 1.25rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.bookingsList {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bookingCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.25rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		transition: box-shadow 0.15s;
	}

	.bookingCard:hover {
		box-shadow: var(--shadow-sm);
	}

	.bookingCard.past,
	.bookingCard.cancelled {
		opacity: 0.7;
	}

	.cancelBtn {
		margin-top: 0.35rem;
	}

	.bookingMain {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
		flex: 1;
	}

	.bookingDate {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 200px;
	}

	.bookingDate strong {
		color: var(--color-text);
		font-size: 0.95rem;
	}

	.bookingDate span {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.bookingInfo p {
		margin: 0;
		font-size: 0.9rem;
	}

	.bookingInfo p:first-child {
		color: var(--color-forest);
		font-weight: 600;
		margin-bottom: 0.2rem;
	}

	.partyInfo {
		color: var(--color-text-muted);
		font-size: 0.875rem !important;
	}

	.bookingMeta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
	}

	.bookingRef {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-family: monospace;
	}

	.ctaRow {
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}

	@media (max-width: 600px) {
		.bookingCard {
			flex-direction: column;
			align-items: flex-start;
		}

		.bookingMain {
			flex-direction: column;
			gap: 0.75rem;
		}

		.bookingMeta {
			align-items: flex-start;
		}
	}
</style>
