<script lang="ts">
	import type { PageData } from './$types';
	import { formatDate, formatTime } from '$lib/utils';
	import {
		farmDatetimeLocalToUtc,
		formatFarmDateTime,
		toFarmDatetimeLocalValue
	} from '$lib/farm-datetime';
	import { untrack } from 'svelte';
	import EmailRichTextEditor from '$lib/components/admin/EmailRichTextEditor.svelte';

	let { data }: { data: PageData } = $props();

	type RecipientMode = 'all' | 'day' | 'select' | 'custom';

	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	let mode: RecipientMode = $state('all');
	let selectedDate = $state(untrack(() => data.bookedDates[0] ?? ''));
	let selectedEmails = $state<string[]>([]);
	let customEmailsText = $state('');
	let addEmailInput = $state('');
	let recipientSearch = $state('');
	let subject = $state('');
	let body = $state('');
	let editorKey = $state(0);
	let sendTiming: 'now' | 'later' = $state('now');
	let scheduleLocal = $state(
		untrack(() => toFarmDatetimeLocalValue(new Date(Date.now() + 60 * 60 * 1000)))
	);
	let sending = $state(false);
	let sendError = $state('');
	let sendSuccess = $state('');

	let uniqueGuests = $derived.by(() => {
		const byEmail: Record<string, { email: string; name: string; dates: string[] }> = {};
		for (const guest of data.guests) {
			const key = guest.email.trim().toLowerCase();
			if (!key) continue;
			const existing = byEmail[key];
			if (existing) {
				if (!existing.dates.includes(guest.date)) existing.dates.push(guest.date);
				continue;
			}
			byEmail[key] = {
				email: guest.email.trim(),
				name: guest.name,
				dates: [guest.date]
			};
		}
		return Object.values(byEmail).sort((a, b) => a.name.localeCompare(b.name));
	});

	let filteredGuests = $derived.by(() => {
		const query = recipientSearch.trim().toLowerCase();
		if (!query) return uniqueGuests;
		return uniqueGuests.filter(
			(guest) =>
				guest.name.toLowerCase().includes(query) ||
				guest.email.toLowerCase().includes(query)
		);
	});

	let dayGuestCount = $derived.by(() => {
		if (!selectedDate) return 0;
		const emails: Record<string, true> = {};
		for (const guest of data.guests) {
			if (guest.date !== selectedDate) continue;
			const key = guest.email.trim().toLowerCase();
			if (key) emails[key] = true;
		}
		return Object.keys(emails).length;
	});

	let customEmailList = $derived.by(() =>
		[
			...new Set(
				customEmailsText
					.split(/[,;\s]+/)
					.map((value) => value.trim().toLowerCase())
					.filter(Boolean)
			)
		]
	);

	let recipientCount = $derived.by(() => {
		if (mode === 'all') return data.uniqueRecipientCount;
		if (mode === 'day') return dayGuestCount;
		if (mode === 'custom') return customEmailList.length;
		return selectedEmails.length;
	});

	let selectedGuestLookup = $derived.by(() => {
		const lookup: Record<string, { name: string; dates: string[] }> = {};
		for (const guest of uniqueGuests) {
			lookup[guest.email.trim().toLowerCase()] = {
				name: guest.name,
				dates: guest.dates
			};
		}
		return lookup;
	});

	let selectedExtraEmails = $derived(
		selectedEmails.filter((email) => !selectedGuestLookup[email])
	);

	let dayPreview = $derived.by(() => {
		if (!selectedDate) return [] as { name: string; email: string; startTime: string }[];
		const seen: Record<string, true> = {};
		const preview: { name: string; email: string; startTime: string }[] = [];
		for (const guest of data.guests) {
			if (guest.date !== selectedDate) continue;
			const key = guest.email.trim().toLowerCase();
			if (!key || seen[key]) continue;
			seen[key] = true;
			preview.push({ name: guest.name, email: guest.email, startTime: guest.startTime });
			if (preview.length >= 8) break;
		}
		return preview;
	});

	function toggleEmail(email: string) {
		const key = email.trim().toLowerCase();
		if (selectedEmails.includes(key)) {
			selectedEmails = selectedEmails.filter((value) => value !== key);
		} else {
			selectedEmails = [...selectedEmails, key];
		}
	}

	function selectAllFiltered() {
		const keys = filteredGuests.map((guest) => guest.email.trim().toLowerCase());
		selectedEmails = [...new Set([...selectedEmails, ...keys])];
	}

	function clearSelected() {
		selectedEmails = [];
	}

	function addCustomEmail() {
		const email = addEmailInput.trim().toLowerCase();
		if (!email) return;
		if (!EMAIL_RE.test(email)) {
			sendError = 'Enter a valid email address.';
			return;
		}
		sendError = '';
		if (!selectedEmails.includes(email)) {
			selectedEmails = [...selectedEmails, email];
		}
		addEmailInput = '';
	}

	function validateComposeFields(): string | null {
		const plainBody = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
		if (!subject.trim() || !plainBody) return 'Subject and message are required.';
		if (mode === 'day' && !selectedDate) return 'Choose a day with bookings.';
		if (mode === 'select' && selectedEmails.length === 0) {
			return 'Select or add at least one recipient.';
		}
		if (mode === 'custom') {
			if (customEmailList.length === 0) return 'Enter at least one email address.';
			const invalid = customEmailList.find((email) => !EMAIL_RE.test(email));
			if (invalid) return `Invalid email address: ${invalid}`;
		}
		if (recipientCount === 0) return 'No recipients match this selection.';
		return null;
	}

	function resetCompose() {
		subject = '';
		body = '';
		editorKey += 1;
		sendTiming = 'now';
		if (mode === 'select') selectedEmails = [];
		if (mode === 'custom') customEmailsText = '';
	}

	async function handleSend() {
		sendError = '';
		sendSuccess = '';

		const validationError = validateComposeFields();
		if (validationError) {
			sendError = validationError;
			return;
		}

		let scheduledAtIso: string | undefined;
		if (sendTiming === 'later') {
			const scheduledAt = farmDatetimeLocalToUtc(scheduleLocal);
			if (Number.isNaN(scheduledAt.getTime())) {
				sendError = 'Enter a valid schedule date and time.';
				return;
			}
			if (scheduledAt.getTime() <= Date.now() + 60_000) {
				sendError = 'Schedule time must be at least 1 minute from now.';
				return;
			}
			if (scheduledAt.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000) {
				sendError = 'Schedule time must be within 30 days.';
				return;
			}
			scheduledAtIso = scheduledAt.toISOString();
		}

		const actionLabel =
			sendTiming === 'later'
				? `Schedule this email with Resend for ${formatFarmDateTime(scheduledAtIso!)} to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'}? It can’t be edited here after scheduling.`
				: `Send this email to ${recipientCount} recipient${recipientCount === 1 ? '' : 's'} now?`;

		if (!window.confirm(actionLabel)) return;

		sending = true;
		try {
			const res = await fetch('/api/admin/messages', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mode,
					subject: subject.trim(),
					body: body.trim(),
					date: mode === 'day' ? selectedDate : undefined,
					emails:
						mode === 'select'
							? selectedEmails
							: mode === 'custom'
								? customEmailList
								: undefined,
					scheduledAt: scheduledAtIso
				})
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok) {
				sendError = result.error ?? 'Failed to send message.';
				return;
			}

			if (result.scheduled) {
				sendSuccess = `Handed off to Resend for ${formatFarmDateTime(result.scheduledAt)} (${result.sentCount} recipient${result.sentCount === 1 ? '' : 's'}).`;
				resetCompose();
				return;
			}

			if (result.failedCount > 0) {
				sendError = `Sent ${result.sentCount}, but ${result.failedCount} failed.`;
			} else {
				sendSuccess = `Sent to ${result.sentCount} recipient${result.sentCount === 1 ? '' : 's'}.`;
				resetCompose();
			}
		} catch {
			sendError = 'Network error. Please try again.';
		} finally {
			sending = false;
		}
	}
</script>

<svelte:head>
	<title>Messages – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<h1 class="adminH1">Messages</h1>
	<p class="pageIntro">
		Email confirmed guests, or enter any address. Cancelled bookings are never included in guest lists,
		and duplicate emails are sent once. Scheduled sends are handed off to Resend immediately.
	</p>

	<section class="adminSection composeSection">
		<div class="adminSectionHeader">
			<h2>Compose</h2>
			<span class="recipientBadge">{recipientCount} recipient{recipientCount === 1 ? '' : 's'}</span>
		</div>

		<div class="composeBody">
			{#if sendError}
				<div class="alert alertError">{sendError}</div>
			{/if}
			{#if sendSuccess}
				<div class="alert alertSuccess">{sendSuccess}</div>
			{/if}

			<fieldset class="modeFieldset">
				<legend>Recipients</legend>
				<label class="modeOption">
					<input type="radio" name="mode" value="all" bind:group={mode} />
					<span>
						<strong>All registered</strong>
						<span class="modeHint">{data.uniqueRecipientCount} unique emails</span>
					</span>
				</label>
				<label class="modeOption">
					<input type="radio" name="mode" value="day" bind:group={mode} />
					<span>
						<strong>Registered on a specific day</strong>
						<span class="modeHint">Everyone confirmed for that date</span>
					</span>
				</label>
				<label class="modeOption">
					<input type="radio" name="mode" value="select" bind:group={mode} />
					<span>
						<strong>Select recipients</strong>
						<span class="modeHint">Pick from the guest list or add any email</span>
					</span>
				</label>
				<label class="modeOption">
					<input type="radio" name="mode" value="custom" bind:group={mode} />
					<span>
						<strong>Enter email addresses</strong>
						<span class="modeHint">Send to any addresses, registered or not</span>
					</span>
				</label>
			</fieldset>

			{#if mode === 'day'}
				<div class="fieldGroup">
					<label for="messageDate">Day</label>
					{#if data.bookedDates.length === 0}
						<p class="emptyHint">No confirmed bookings yet.</p>
					{:else}
						<select id="messageDate" bind:value={selectedDate}>
							{#each data.bookedDates as bookedDate (bookedDate)}
								<option value={bookedDate}>{formatDate(bookedDate)}</option>
							{/each}
						</select>
						{#if dayPreview.length > 0}
							<ul class="previewList">
								{#each dayPreview as guest (guest.email)}
									<li>
										{guest.name}
										<span class="previewMeta"
											>{formatTime(guest.startTime)} · {guest.email}</span
										>
									</li>
								{/each}
								{#if dayGuestCount > dayPreview.length}
									<li class="previewMore">
										+{dayGuestCount - dayPreview.length} more unique recipient{dayGuestCount -
											dayPreview.length ===
										1
											? ''
											: 's'}
									</li>
								{/if}
							</ul>
						{/if}
					{/if}
				</div>
			{/if}

			{#if mode === 'select'}
				<div class="fieldGroup">
					<div class="selectToolbar">
						<label for="recipientSearch">Find guests</label>
						<div class="selectActions">
							<button type="button" class="btnText" onclick={selectAllFiltered}
								>Select filtered</button
							>
							<button type="button" class="btnText" onclick={clearSelected}>Clear</button>
						</div>
					</div>
					<input
						id="recipientSearch"
						type="search"
						placeholder="Search by name or email"
						bind:value={recipientSearch}
					/>
					<div class="addEmailRow">
						<input
							type="email"
							placeholder="Add any email address"
							bind:value={addEmailInput}
							onkeydown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									addCustomEmail();
								}
							}}
						/>
						<button type="button" class="btn btnSecondary" onclick={addCustomEmail}>Add</button>
					</div>
					{#if selectedExtraEmails.length > 0}
						<ul class="customChipList">
							{#each selectedExtraEmails as email (email)}
								<li>
									<span>{email}</span>
									<button type="button" class="btnText" onclick={() => toggleEmail(email)}
										>Remove</button
									>
								</li>
							{/each}
						</ul>
					{/if}
					{#if uniqueGuests.length === 0}
						<p class="emptyHint">No confirmed guests on the list yet — you can still add emails above.</p>
					{:else}
						<div class="recipientList" role="group" aria-label="Recipients">
							{#each filteredGuests as guest (guest.email)}
								<label class="recipientRow">
									<input
										type="checkbox"
										checked={selectedEmails.includes(guest.email.trim().toLowerCase())}
										onchange={() => toggleEmail(guest.email)}
									/>
									<span class="recipientInfo">
										<span class="recipientName">{guest.name}</span>
										<span class="recipientEmail">{guest.email}</span>
										<span class="recipientDates"
											>{guest.dates.map((date) => formatDate(date)).join(' · ')}</span
										>
									</span>
								</label>
							{:else}
								<p class="emptyHint">No guests match that search.</p>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if mode === 'custom'}
				<div class="fieldGroup">
					<label for="customEmails">Email addresses</label>
					<textarea
						id="customEmails"
						rows="5"
						placeholder="one@example.com, two@example.com"
						bind:value={customEmailsText}
					></textarea>
					<p class="fieldHint">
						Separate addresses with commas, spaces, or new lines. Unregistered addresses are fine.
					</p>
				</div>
			{/if}

			<div class="fieldGroup">
				<label for="messageSubject">Subject</label>
				<input
					id="messageSubject"
					type="text"
					maxlength="200"
					placeholder="Update from The Russell Farm"
					bind:value={subject}
				/>
			</div>

			<div class="fieldGroup">
				<span class="fieldLabel" id="messageBodyLabel">Message</span>
				{#key editorKey}
					<EmailRichTextEditor id="messageBody" bind:value={body} />
				{/key}
				<p class="fieldHint">
					Use the toolbar for bold, italic, lists, and links — formatting is converted to email-safe HTML.
					Each email starts with “Hi [name],” (or “Hi Friend,” for unregistered addresses).
				</p>
			</div>

			<fieldset class="modeFieldset">
				<legend>When to send</legend>
				<label class="modeOption">
					<input type="radio" name="sendTiming" value="now" bind:group={sendTiming} />
					<span>
						<strong>Send now</strong>
						<span class="modeHint">Deliver immediately</span>
					</span>
				</label>
				<label class="modeOption">
					<input type="radio" name="sendTiming" value="later" bind:group={sendTiming} />
					<span>
						<strong>Schedule for later</strong>
						<span class="modeHint">Hand off to Resend (Eastern, within 30 days)</span>
					</span>
				</label>
				{#if sendTiming === 'later'}
					<div class="fieldGroup scheduleField">
						<label for="scheduleAt">Send at</label>
						<input id="scheduleAt" type="datetime-local" bind:value={scheduleLocal} />
						<p class="fieldHint">
							Times are in America/New_York (Eastern). After scheduling, manage or cancel in the
							Resend dashboard if needed.
						</p>
					</div>
				{/if}
			</fieldset>

			<div class="composeActions">
				<button
					type="button"
					class="btn btnPrimary"
					onclick={handleSend}
					disabled={sending || recipientCount === 0}
				>
					{#if sending}
						{sendTiming === 'later' ? 'Scheduling…' : 'Sending…'}
					{:else if sendTiming === 'later'}
						Schedule for {recipientCount}
					{:else}
						Send to {recipientCount}
					{/if}
				</button>
			</div>
		</div>
	</section>
</div>

<style>
	.pageIntro {
		margin: -1.25rem 0 1.75rem;
		color: var(--color-text-muted);
		max-width: 40rem;
	}

	.composeSection {
		max-width: 44rem;
	}

	.scheduleField {
		margin-top: 0.35rem;
	}

	.fieldGroup input[type='datetime-local'] {
		width: 100%;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font: inherit;
		background: var(--color-white);
	}

	.recipientBadge {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-forest);
		background: #e8f5e4;
		padding: 0.3rem 0.7rem;
		border-radius: var(--radius);
	}

	.composeBody {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.modeFieldset {
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		padding: 1rem 1.1rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.modeFieldset legend {
		padding: 0 0.35rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.modeOption {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		cursor: pointer;
	}

	.modeOption input {
		margin-top: 0.2rem;
	}

	.modeOption span {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.modeHint {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.fieldGroup {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.fieldGroup label,
	.fieldLabel {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.fieldGroup input[type='text'],
	.fieldGroup input[type='search'],
	.fieldGroup input[type='email'],
	.fieldGroup select,
	.fieldGroup textarea {
		width: 100%;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font: inherit;
		background: var(--color-white);
	}

	.addEmailRow {
		display: flex;
		gap: 0.5rem;
	}

	.addEmailRow input {
		flex: 1;
	}

	.customChipList {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.customChipList li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-cream);
		border-radius: var(--radius);
		font-size: 0.9rem;
	}

	.fieldGroup textarea {
		resize: vertical;
		min-height: 10rem;
		line-height: 1.5;
	}

	.fieldHint,
	.emptyHint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.previewList {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0.75rem 0.9rem;
		background: var(--color-cream);
		border-radius: var(--radius);
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.previewList li {
		font-size: 0.9rem;
	}

	.previewMeta,
	.previewMore {
		display: block;
		color: var(--color-text-muted);
		font-size: 0.8rem;
	}

	.selectToolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.selectActions {
		display: flex;
		gap: 0.75rem;
	}

	.btnText {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-forest);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.recipientList {
		max-height: 18rem;
		overflow: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-white);
	}

	.recipientRow {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		padding: 0.7rem 0.85rem;
		border-bottom: 1px solid var(--color-border);
		cursor: pointer;
	}

	.recipientRow:last-child {
		border-bottom: none;
	}

	.recipientRow input {
		margin-top: 0.2rem;
	}

	.recipientInfo {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.recipientName {
		font-weight: 600;
	}

	.recipientEmail,
	.recipientDates {
		font-size: 0.82rem;
		color: var(--color-text-muted);
		overflow-wrap: anywhere;
	}

	.composeActions {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.alert {
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		font-size: 0.95rem;
	}

	.alertError {
		background: #fde8e8;
		color: #8b1a1a;
	}

	.alertSuccess {
		background: #e8f5e4;
		color: var(--color-forest-dk);
	}
</style>
