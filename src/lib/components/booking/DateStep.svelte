<script lang="ts">
	import type { SlotSummary } from '$lib/types';

	let { onDateSelected }: { onDateSelected: (date: string) => void } = $props();

	// Calendar state
	const today = new Date();
	let viewYear = $state(today.getFullYear());
	let viewMonth = $state(today.getMonth()); // 0-indexed

	let availableDates = $state<Set<string>>(new Set());
	let loading = $state(true);
	let error = $state('');

	// Fetch availability whenever the viewed month changes
	$effect(() => {
		fetchAvailability(viewYear, viewMonth);
	});

	async function fetchAvailability(year: number, month: number) {
		loading = true;
		error = '';
		try {
			// Fetch current and next month for smooth navigation
			const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
			const lastDay = new Date(year, month + 2, 0).getDate();
			const nextMonth = month === 11 ? 0 : month + 1;
			const nextYear = month === 11 ? year + 1 : year;
			const to = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${lastDay}`;

			const res = await fetch(`/api/availability?from=${from}&to=${to}`);
			if (!res.ok) throw new Error('Failed to load availability');
			const slots: SlotSummary[] = await res.json();

			// Build a set of dates that have at least one slot with remaining capacity
			availableDates = new Set(slots.filter((s) => s.remaining > 0).map((s) => s.date));
		} catch (e) {
			error = 'Could not load availability. Please try again.';
		} finally {
			loading = false;
		}
	}

	// Calendar helpers
	function getDaysInMonth(year: number, month: number): number {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfWeek(year: number, month: number): number {
		return new Date(year, month, 1).getDay(); // 0=Sun
	}

	let calendarDays = $derived.by(() => {
		const daysInMonth = getDaysInMonth(viewYear, viewMonth);
		const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
		const days: Array<{ date: string | null; day: number | null; isPast: boolean }> = [];

		// Leading empty cells
		for (let i = 0; i < firstDay; i++) {
			days.push({ date: null, day: null, isPast: false });
		}

		// Actual days
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			const dateObj = new Date(dateStr + 'T12:00:00');
			const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
			days.push({
				date: dateStr,
				day: d,
				isPast: dateObj < todayMidnight
			});
		}
		return days;
	});

	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	// Can't go back before current month
	let canGoPrev = $derived(
		viewYear > today.getFullYear() ||
			(viewYear === today.getFullYear() && viewMonth > today.getMonth())
	);
</script>

<div class="dateStep">
	<h2>Pick a Date</h2>
	<p class="stepHint">Select an available date from the calendar below.</p>

	<div class="calendarCard">
		<!-- Month navigation -->
		<div class="calHeader">
			<button class="calNav" onclick={prevMonth} disabled={!canGoPrev} aria-label="Previous month">
				←
			</button>
			<span class="calMonthLabel">{monthNames[viewMonth]} {viewYear}</span>
			<button class="calNav" onclick={nextMonth} aria-label="Next month"> → </button>
		</div>

		<!-- Day labels -->
		<div class="calGrid calWeekdays">
			{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
				<div class="weekday">{day}</div>
			{/each}
		</div>

		{#if loading}
			<div class="calLoading">Loading availability…</div>
		{:else if error}
			<div class="calError">{error}</div>
		{:else}
			<!-- Day grid -->
			<div class="calGrid calDays">
				{#each calendarDays as cell}
					{#if cell.date === null}
						<div class="calCell empty"></div>
					{:else}
						{@const isAvailable = availableDates.has(cell.date)}
						{@const isDisabled = cell.isPast || !isAvailable}
						<button
							class="calCell day"
							class:available={isAvailable}
							class:past={cell.isPast}
							class:unavailable={!cell.isPast && !isAvailable}
							disabled={isDisabled}
							onclick={() => onDateSelected(cell.date!)}
							aria-label={`${cell.date}${isAvailable ? ', available' : ', unavailable'}`}
						>
							{cell.day}
						</button>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Legend -->
		<div class="calLegend">
			<span class="legendItem">
				<span class="legendDot available"></span> Available
			</span>
			<span class="legendItem">
				<span class="legendDot unavailable"></span> Unavailable / Full
			</span>
		</div>
	</div>
</div>

<style>
	.dateStep h2 {
		color: var(--color-forest-dk);
		font-size: 1.5rem;
		margin-bottom: 0.375rem;
	}

	.stepHint {
		color: var(--color-text-muted);
		margin-bottom: 1.5rem;
	}

	.calendarCard {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		max-width: 720px;
	}

	.calHeader {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.calMonthLabel {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		font-weight: bold;
		color: var(--color-forest-dk);
	}

	.calNav {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		width: 2rem;
		height: 2rem;
		cursor: pointer;
		font-size: 1rem;
		color: var(--color-forest);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s;
	}

	.calNav:hover:not(:disabled) {
		background: var(--color-cream);
	}

	.calNav:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.calGrid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.calWeekdays {
		margin-bottom: 6px;
	}

	.weekday {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		padding: 0.25rem 0;
	}

	.calCell {
		aspect-ratio: 1;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
	}

	.calCell.empty {
		background: none;
	}

	.calCell.day {
		background: none;
		border: 1px solid transparent;
		cursor: not-allowed;
		color: var(--color-text-muted);
		font-family: var(--font-sans);
		transition: background 0.15s;
	}

	.calCell.day.available {
		background: #d1fae5;
		border-color: #6ee7b7;
		color: var(--color-forest-dk);
		cursor: pointer;
		font-weight: 600;
	}

	.calCell.day.available:hover {
		background: var(--color-forest);
		border-color: var(--color-forest);
		color: var(--color-white);
	}

	.calCell.day.past {
		opacity: 0.35;
	}

	.calCell.day.unavailable {
		color: #ccc;
	}

	.calLoading,
	.calError {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		grid-column: 1 / -1;
	}

	.calError {
		color: var(--color-barn-red);
	}

	.calLegend {
		display: flex;
		gap: 1.25rem;
		margin-top: 1rem;
		justify-content: center;
	}

	.legendItem {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.legendDot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid transparent;
	}

	.legendDot.available {
		background: #d1fae5;
		border-color: #6ee7b7;
	}

	.legendDot.unavailable {
		background: var(--color-cream-dk);
		border-color: var(--color-border);
	}
</style>
