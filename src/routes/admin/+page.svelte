<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate, formatTime } from '$lib/utils';

	function formatPhone(raw: string | null | undefined): string {
		if (!raw) return '—';
		const digits = raw.replace(/\D/g, '');
		if (digits.length !== 10) return raw;
		const area = digits.slice(0, 3);
		const prefix = digits.slice(3, 6);
		const line = digits.slice(6);
		return `(${area}) ${prefix}-${line}`;
	}

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard – The Russell Farm</title>
</svelte:head>

<div class="adminPage">
	<div class="dashTitle">
		<h1>Dashboard</h1>
		<a href="/admin/availability" class="btn btnPrimary btnSm">+ Add Availability</a>
	</div>

	<!-- Stats row -->
	<div class="statsGrid">
		<div class="statCard">
			<span class="statLabel">Today's Bookings</span>
			<span class="statValue">{data.totalTodayBookings}</span>
		</div>
		<div class="statCard">
			<span class="statLabel">Upcoming Total</span>
			<span class="statValue">{data.totalUpcomingBookings}</span>
		</div>
		<div class="statCard">
			<span class="statLabel">Active Slots</span>
			<span class="statValue">{data.upcomingSlots.filter((s) => s.isActive).length}</span>
		</div>
	</div>

	<!-- Upcoming slots -->
	<section class="adminSection">
		<div class="adminSectionHeader">
			<h2>Upcoming Slots</h2>
			<a href="/admin/bookings" class="linkSm">View all bookings →</a>
		</div>

		{#if data.upcomingSlots.length === 0}
			<div class="emptyPanel">
				<p>No upcoming slots. <a href="/admin/availability">Add availability</a> to get started.</p>
			</div>
		{:else}
			<div class="slotsTable">
				<div class="tableHeader">
					<span>Date</span>
					<span>Time</span>
					<span>Status</span>
					<span>Name</span>
					<span>Email</span>
					<span>Phone</span>
				</div>
				{#each data.upcomingSlots as slot (slot.id)}
					<div class="tableRow" class:nearlyFull={slot.remaining <= 1 && slot.remaining > 0}>
						<span class="cellDate">{formatDate(slot.date)}</span>
						<span>{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</span>
						<span>
							{#if slot.isActive && slot.remaining > 0}
								<span class="badge badgeConfirmed">Available</span>
							{:else}
								<span class="badge badgeCancelled">Booked</span>
							{/if}
						</span>
						<span class="cellContact">{slot.bookingName ?? '—'}</span>
						<span class="cellContact">{slot.bookingEmail ?? '—'}</span>
						<span class="cellContact">{formatPhone(slot.bookingPhone)}</span>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	/* Grid columns specific to this dashboard table */
	.tableHeader,
	.tableRow {
		grid-template-columns: 140px 180px 100px 1fr 1fr 120px;
	}

	.slotsTable {
		font-size: 0.9rem;
	}

	.dashTitle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.dashTitle h1 {
		font-size: 1.75rem;
		color: var(--color-forest-dk);
		margin: 0;
	}

	.tableRow.nearlyFull {
		background: #fffbeb;
	}

	.cellDate {
		font-weight: 600;
	}

	.cellContact {
		font-size: 0.85rem;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
