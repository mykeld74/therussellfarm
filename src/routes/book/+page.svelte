<script lang="ts">
	import type { PageData } from './$types';
	import type { BookingStep, BookingFormData, SlotSummary } from '$lib/types';
	import DateStep from '$lib/components/booking/DateStep.svelte';
	import TimeStep from '$lib/components/booking/TimeStep.svelte';
	import DetailsStep from '$lib/components/booking/DetailsStep.svelte';
	import ReviewStep from '$lib/components/booking/ReviewStep.svelte';
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Wizard state
	let step: BookingStep = $state('date');

	let formData: BookingFormData = $state(
		untrack(() => ({
			slotId: null,
			selectedDate: '',
			selectedSlot: null,
			name: data.user?.name ?? '',
			email: data.user?.email ?? '',
			phone: data.phone ?? '',
			partySizeAdults: 0,
			partySizeKids: 0
		}))
	);

	let isSubmitting = $state(false);
	let submitError = $state('');

	// Step transitions
	function handleDateSelected(date: string) {
		formData.selectedDate = date;
		formData.selectedSlot = null;
		formData.slotId = null;
		step = 'time';
	}

	function handleSlotSelected(slot: SlotSummary) {
		formData.selectedSlot = slot;
		formData.slotId = slot.id;
		step = 'details';
	}

	function handleDetailsSubmit(details: Partial<BookingFormData>) {
		Object.assign(formData, details);
		step = 'review';
	}

	async function handleConfirm() {
		isSubmitting = true;
		submitError = '';
		try {
			const res = await fetch('/api/bookings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slotId: formData.slotId,
					name: formData.name,
					email: formData.email,
					phone: formData.phone,
					partySizeAdults: formData.partySizeAdults,
					partySizeKids: formData.partySizeKids
				})
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				submitError = err.message ?? 'Booking failed. Please try again.';
				return;
			}
			const { bookingRef } = await res.json();
			goto(`/book/confirmation?ref=${bookingRef}`);
		} catch {
			submitError = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	// Progress bar
	const steps: BookingStep[] = ['date', 'time', 'details', 'review'];
	const stepLabels: Record<BookingStep, string> = {
		date: 'Pick a Date',
		time: 'Choose a Time',
		details: 'Your Details',
		review: 'Review'
	};
	let currentStepIndex = $derived(steps.indexOf(step));
</script>

<svelte:head>
	<title>Book Your Experience – The Russell Farm</title>
	<meta
		name="description"
		content="Reserve your Christmas tree wagon ride and cottage experience at The Russell Farm."
	/>
</svelte:head>

<div class="bookingPage">
	<div class="container">
		<div class="pageHeader">
			<h1>Book Your Experience</h1>
			<p>Christmas Tree Wagon Ride & Cottage Experience · Reserve your family's spot</p>
		</div>

		<!-- Progress indicator -->
		<div class="progressBar" role="progressbar" aria-label="Booking progress">
			{#each steps as s, i}
				<div class="progressStep" class:completed={i < currentStepIndex} class:current={s === step}>
					<div class="stepDot">
						{#if i < currentStepIndex}
							✓
						{:else}
							{i + 1}
						{/if}
					</div>
					<span class="stepLabel">{stepLabels[s]}</span>
				</div>
				{#if i < steps.length - 1}
					<div class="progressConnector" class:filled={i < currentStepIndex}></div>
				{/if}
			{/each}
		</div>

		<!-- Step content -->
		<div class="stepContent">
			{#if step === 'date'}
				<DateStep onDateSelected={handleDateSelected} initialDate={data.firstAvailableDate} />
			{:else if step === 'time'}
				<TimeStep
					date={formData.selectedDate}
					onSlotSelected={handleSlotSelected}
					onBack={() => (step = 'date')}
				/>
			{:else if step === 'details'}
				<DetailsStep
					initialData={formData}
					onSubmit={handleDetailsSubmit}
					onBack={() => (step = 'time')}
				/>
			{:else if step === 'review'}
				<ReviewStep
					data={formData}
					{isSubmitting}
					error={submitError}
					onConfirm={handleConfirm}
					onBack={() => (step = 'details')}
				/>
			{/if}
		</div>
	</div>
</div>

<style>
	.bookingPage {
		padding: 3rem 0 5rem;
	}

	.pageHeader {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.pageHeader h1 {
		color: var(--color-forest-dk);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		margin-bottom: 0.5rem;
	}

	.pageHeader p {
		color: var(--color-text-muted);
		font-size: 1rem;
	}

	/* Progress bar */
	.progressBar {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 3rem;
		gap: 0;
		max-width: 560px;
		margin-left: auto;
		margin-right: auto;
	}

	.progressStep {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
	}

	.stepDot {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--color-cream-dk);
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--color-text-muted);
		transition:
			background 0.2s,
			border-color 0.2s,
			color 0.2s;
	}

	.progressStep.current .stepDot {
		background: var(--color-forest);
		border-color: var(--color-forest);
		color: var(--color-white);
	}

	.progressStep.completed .stepDot {
		background: #d1fae5;
		border-color: #6ee7b7;
		color: var(--color-forest);
	}

	.stepLabel {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.progressStep.current .stepLabel {
		color: var(--color-forest);
		font-weight: 600;
	}

	.progressConnector {
		flex: 1;
		height: 2px;
		background: var(--color-border);
		min-width: 2.5rem;
		max-width: 5rem;
		margin-bottom: 1.25rem;
		transition: background 0.2s;
	}

	.progressConnector.filled {
		background: #6ee7b7;
	}

	@media (max-width: 500px) {
		.stepLabel {
			display: none;
		}
		.progressConnector {
			min-width: 1.5rem;
		}
	}
</style>
