<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { roleLabel } from '$lib/utils';
	import { isProtectedAccountEmail } from '$lib/protected-accounts';

	let { data }: { data: PageData } = $props();

	let updatingId = $state<string | null>(null);
	let deletingId = $state<string | null>(null);
	let updateError = $state('');

	type SortKey = 'name' | 'email' | 'role' | 'createdAt';
	let sortKey = $state<SortKey>('createdAt');
	let sortDir = $state<'asc' | 'desc'>('asc');

	let nameFilter = $state('');
	let emailFilter = $state('');
	let roleFilter = $state('');

	const roleBadgeClass: Record<string, string> = {
		user: 'badgeUser',
		admin: 'badgeAdmin',
		super_admin: 'badgeSuperAdmin'
	};

	const roleOptions: { value: string; label: string }[] = [
		{ value: 'user', label: 'User' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'super_admin', label: 'Super Admin' }
	];

	const roleSortOrder: Record<string, number> = {
		user: 0,
		admin: 1,
		super_admin: 2
	};

	function isLocked(user: { id: string; email: string }): boolean {
		return user.id === data.currentUserId || isProtectedAccountEmail(user.email);
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = key === 'createdAt' ? 'desc' : 'asc';
		}
	}

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortDir === 'asc' ? ' ↑' : ' ↓';
	}

	let filteredUsers = $derived.by(() => {
		const nameQ = nameFilter.trim().toLowerCase();
		const emailQ = emailFilter.trim().toLowerCase();

		let list = data.users.filter((user) => {
			if (nameQ && !user.name.toLowerCase().includes(nameQ)) return false;
			if (emailQ && !user.email.toLowerCase().includes(emailQ)) return false;
			if (roleFilter && user.role !== roleFilter) return false;
			return true;
		});

		const dir = sortDir === 'asc' ? 1 : -1;
		list = list.slice().sort((a, b) => {
			if (sortKey === 'createdAt') {
				return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
			}
			if (sortKey === 'role') {
				return ((roleSortOrder[a.role] ?? 0) - (roleSortOrder[b.role] ?? 0)) * dir;
			}
			return a[sortKey].localeCompare(b[sortKey], undefined, { sensitivity: 'base' }) * dir;
		});

		return list;
	});

	let hasActiveFilters = $derived(
		nameFilter.trim() !== '' || emailFilter.trim() !== '' || roleFilter !== ''
	);

	function clearFilters() {
		nameFilter = '';
		emailFilter = '';
		roleFilter = '';
	}

	async function changeRole(userId: string, role: string) {
		updatingId = userId;
		updateError = '';
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role })
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? 'Failed to update');
			}
			await invalidateAll();
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'Failed to update role.';
		} finally {
			updatingId = null;
		}
	}

	async function deleteUser(user: { id: string; name: string; email: string }) {
		if (
			!confirm(
				`Delete account for ${user.name} (${user.email})?\n\nThis cannot be undone. Their bookings will be kept but unlinked from the account.`
			)
		) {
			return;
		}

		deletingId = user.id;
		updateError = '';
		try {
			const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? 'Failed to delete');
			}
			await invalidateAll();
		} catch (e) {
			updateError = e instanceof Error ? e.message : 'Failed to delete account.';
		} finally {
			deletingId = null;
		}
	}

	function formatDate(dateStr: string | Date): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Users – Farm Admin</title>
</svelte:head>

<div class="adminPage">
	<div class="adminPageTitle">
		<h1>Users</h1>
		<span class="userCount"
			>{filteredUsers.length}
			{hasActiveFilters ? `of ${data.users.length}` : ''} user{filteredUsers.length !== 1
				? 's'
				: ''}</span
		>
	</div>

	<form
		class="filtersBar"
		onsubmit={(e) => {
			e.preventDefault();
		}}
	>
		<div class="filterField">
			<label for="nameFilter">Name</label>
			<input
				id="nameFilter"
				type="text"
				bind:value={nameFilter}
				placeholder="Search name"
			/>
		</div>
		<div class="filterField">
			<label for="emailFilter">Email</label>
			<input
				id="emailFilter"
				type="text"
				bind:value={emailFilter}
				placeholder="Search email"
			/>
		</div>
		<div class="filterField">
			<label for="roleFilter">Role</label>
			<select id="roleFilter" bind:value={roleFilter}>
				<option value="">All roles</option>
				{#each roleOptions as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
		{#if hasActiveFilters}
			<button type="button" class="btn btnSm" onclick={clearFilters}>Clear</button>
		{/if}
	</form>

	{#if updateError}
		<div class="alert alertError">{updateError}</div>
	{/if}

	<div class="usersTableWrap">
		{#if filteredUsers.length === 0}
			<div class="emptyPanel">
				<p>No users match the current filters.</p>
			</div>
		{:else}
			<table class="usersTable">
				<thead>
					<tr>
						<th>
							<button type="button" class="sortBtn" onclick={() => toggleSort('name')}>
								Name{sortIndicator('name')}
							</button>
						</th>
						<th>
							<button type="button" class="sortBtn" onclick={() => toggleSort('email')}>
								Email{sortIndicator('email')}
							</button>
						</th>
						<th>
							<button type="button" class="sortBtn" onclick={() => toggleSort('role')}>
								Role{sortIndicator('role')}
							</button>
						</th>
						<th>
							<button type="button" class="sortBtn" onclick={() => toggleSort('createdAt')}>
								Joined{sortIndicator('createdAt')}
							</button>
						</th>
						<th>Change Role</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredUsers as user (user.id)}
						<tr class="userRow">
							<td class="nameCell">{user.name}</td>
							<td>
								<a href="mailto:{user.email}" class="emailLink">{user.email}</a>
							</td>
							<td>
								<span class="badge {roleBadgeClass[user.role] ?? 'badgeUser'}"
									>{roleLabel[user.role] ?? user.role}</span
								>
							</td>
							<td class="dateCell">{formatDate(user.createdAt)}</td>
							<td class="roleCell">
								{#if user.id === data.currentUserId}
									<span class="selfNote">You</span>
								{:else if isProtectedAccountEmail(user.email)}
									<span class="selfNote">Protected</span>
								{:else}
									<select
										class="roleSelect"
										value={user.role}
										disabled={updatingId === user.id || deletingId === user.id}
										onchange={(e) =>
											changeRole(user.id, (e.target as HTMLSelectElement).value)}
									>
										{#each roleOptions as opt (opt.value)}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								{/if}
							</td>
							<td class="actionsCell">
								{#if isLocked(user)}
									<span class="selfNote">—</span>
								{:else}
									<button
										type="button"
										class="btn btnSm btnDanger"
										disabled={deletingId === user.id || updatingId === user.id}
										onclick={() => deleteUser(user)}
									>
										{deletingId === user.id ? 'Deleting…' : 'Delete'}
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>

<style>
	.adminPage {
		width: 100%;
		max-width: none;
	}

	.adminPageTitle {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.adminPageTitle h1 {
		font-size: 1.75rem;
		color: var(--color-forest-dk);
		margin: 0;
	}

	.userCount {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		background: var(--color-cream-dk);
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}

	.filtersBar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		align-items: flex-end;
		margin-bottom: 1.25rem;
		padding: 1rem;
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
	}

	.filterField {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 160px;
	}

	.filterField label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.filterField input,
	.filterField select {
		padding: 0.45rem 0.65rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		background: var(--color-white);
	}

	.usersTableWrap {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		overflow-x: auto;
	}

	.emptyPanel {
		padding: 2.5rem 1.5rem;
		text-align: center;
		color: var(--color-text-muted);
	}

	.usersTable {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.usersTable th {
		background: var(--color-cream);
		padding: 0.5rem 0.75rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
	}

	.sortBtn {
		background: none;
		border: none;
		padding: 0.25rem 0.25rem;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.sortBtn:hover {
		color: var(--color-forest);
	}

	.usersTable td {
		padding: 0.875rem 1rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: middle;
	}

	.userRow:last-child td {
		border-bottom: none;
	}

	.userRow:hover td {
		background: var(--color-cream);
	}

	.nameCell {
		font-weight: 600;
	}

	.emailLink {
		color: var(--color-forest);
		font-size: 0.875rem;
	}

	.dateCell {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.roleCell {
		min-width: 160px;
	}

	.actionsCell {
		white-space: nowrap;
	}

	.roleSelect {
		padding: 0.4rem 0.6rem;
		border: 1.5px solid var(--color-border);
		border-radius: var(--radius);
		font-family: var(--font-sans);
		font-size: 0.875rem;
		background: var(--color-white);
		color: var(--color-text);
		cursor: pointer;
		width: 100%;
	}

	.roleSelect:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.selfNote {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.badgeUser {
		background: #e0e7ff;
		color: #3730a3;
	}

	.badgeAdmin {
		background: #fef3c7;
		color: #92400e;
	}

	.badgeSuperAdmin {
		background: #ede9fe;
		color: #5b21b6;
	}
</style>
