<script lang="ts">
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import { roleLabel } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	let updatingId = $state<string | null>(null);
	let updateError = $state('');

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
		<span class="userCount">{data.users.length} user{data.users.length !== 1 ? 's' : ''}</span>
	</div>

	{#if updateError}
		<div class="alert alertError">{updateError}</div>
	{/if}

	<div class="usersTableWrap">
		<table class="usersTable">
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Role</th>
					<th>Joined</th>
					<th>Change Role</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user (user.id)}
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
							{:else}
								<select
									class="roleSelect"
									value={user.role}
									disabled={updatingId === user.id}
									onchange={(e) => changeRole(user.id, (e.target as HTMLSelectElement).value)}
								>
									{#each roleOptions as opt (opt.value)}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
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

	.usersTableWrap {
		background: var(--color-white);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		overflow-x: auto;
	}

	.usersTable {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.usersTable th {
		background: var(--color-cream);
		padding: 0.75rem 1rem;
		text-align: left;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		white-space: nowrap;
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
