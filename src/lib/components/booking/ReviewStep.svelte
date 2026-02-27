<script lang="ts">
	import type { BookingFormData } from '$lib/types';

	let {
		data,
		isSubmitting,
		error,
		onConfirm,
		onBack
	}: {
		data: BookingFormData;
		isSubmitting: boolean;
		error: string;
		onConfirm: () => void;
		onBack: () => void;
	} = $props();

	function formatTime(t: string): string {
		const [h, m] = t.split(':').map(Number);
		const ampm = h >= 12 ? 'PM' : 'AM';
		const hour = h % 12 || 12;
		return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="reviewStep">
	<button class="backBtn" onclick={onBack}>← Edit details</button>
	<h2>Review Your Booking</h2>
	<p class="stepHint">Everything look right? Confirm your booking below.</p>

	{#if data.selectedSlot}
		<div class="reviewCard">
			<div class="reviewSection">
				<h3>Experience</h3>
				<p class="experienceName">Christmas Tree Wagon Ride & Cottage Experience</p>
			</div>

			<div class="reviewDivider"></div>

			<div class="reviewSection">
				<h3>Date & Time</h3>
				<div class="reviewRow">
					<span>Date</span>
					<strong>{formatDate(data.selectedSlot.date)}</strong>
				</div>
				<div class="reviewRow">
					<span>Time</span>
					<strong
						>{formatTime(data.selectedSlot.startTime)} – {formatTime(
							data.selectedSlot.endTime
						)}</strong
					>
				</div>
			</div>

			<div class="reviewDivider"></div>

			<div class="reviewSection">
				<h3>Your Group</h3>
				<div class="reviewRow">
					<span>Adults</span>
					<strong>{data.partySizeAdults}</strong>
				</div>
				{#if data.partySizeKids > 0}
					<div class="reviewRow">
						<span>Children</span>
						<strong>{data.partySizeKids}</strong>
					</div>
				{/if}
			</div>

			<div class="reviewDivider"></div>

			<div class="reviewSection">
				<h3>Your Details</h3>
				<div class="reviewRow">
					<span>Name</span>
					<strong>{data.name}</strong>
				</div>
				<div class="reviewRow">
					<span>Email</span>
					<strong>{data.email}</strong>
				</div>
				<div class="reviewRow">
					<span>Phone</span>
					<strong>{data.phone}</strong>
				</div>
			</div>
		</div>

		{#if error}
			<div class="alert alertError" style="margin-top: 1rem;">{error}</div>
		{/if}

		<div class="confirmActions">
			<button
				class="btn btnPrimary btnLg confirmBtn"
				onclick={onConfirm}
				disabled={isSubmitting}
			>
				{#if isSubmitting}
					<span class="spinner"></span> Confirming…
				{:else}
					Confirm Booking 🌲
				{/if}
			</button>
			<p class="confirmNote">
				A confirmation email will be sent to <strong>{data.email}</strong>
			</p>
		</div>
	{/if}
</div>

<style>
	.reviewStep h2 {
		color: var(--color-forest-dk);
		font-size: 1.5rem;
		margin-bottom: 0.375rem;
	}

	.stepHint {
		color: var(--color-text-muted);
		margin-bottom: 1.75rem;
	}

	.backBtn {
		background: none;
		border: none;
		color: var(--color-forest);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		margin-bottom: 1.25rem;
		font-family: var(--font-sans);
		transition: color 0.15s;
	}

	.backBtn:hover {
		color: var(--color-forest-dk);
	}

	.reviewCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		max-width: 480px;
	}

	.reviewSection {
		padding: 1.25rem 1.5rem;
	}

	.reviewSection h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
		font-family: var(--font-sans);
	}

	.experienceName {
		font-weight: 600;
		color: var(--color-forest);
		font-size: 1.05rem;
		margin: 0;
	}

	.reviewRow {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.3rem 0;
		font-size: 0.95rem;
	}

	.reviewRow span {
		color: var(--color-text-muted);
	}

	.reviewRow strong {
		color: var(--color-text);
	}

	.reviewDivider {
		height: 1px;
		background: var(--color-border);
	}

	.confirmActions {
		margin-top: 1.5rem;
		max-width: 480px;
	}

	.confirmBtn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.confirmNote {
		text-align: center;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-top: 0.75rem;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.4);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
