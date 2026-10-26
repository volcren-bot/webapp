<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"

	const { data, form } = $props()
</script>

<Head title="Admin" description="Adjust credits, log in as users and ban accounts." noindex />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Adjust credits</h1>
		<p class="nv-dim">Every change is recorded with your name and the note.</p>
	</header>

	<form class="nv-float flex flex-col gap-3" method="POST" action="?/adjust" use:enhance>
		<span class="nv-title">adjustment</span>

		{#if form?.message && !("login" in form) && !("ban" in form)}
			<small class={form.ok ? "text-success-400" : "text-error-400"}>{form.message}</small>
		{/if}

		<label class="label">
			<span class="label-text">user UUID</span>
			<input class="input" name="user" required />
		</label>
		<label class="label">
			<span class="label-text">credits <span class="nv-dim">negative to remove, 10,000 = €1</span></span>
			<input class="input" name="amount" type="number" step="1" required />
		</label>
		<label class="label">
			<span class="label-text">note</span>
			<input class="input" name="note" required />
		</label>

		<button type="submit" class="btn mt-1 self-start">apply</button>
	</form>

	<form class="nv-float flex flex-col gap-3" method="POST" action="?/impersonate" use:enhance>
		<span class="nv-title">login as user</span>
		<p class="nv-dim">
			This replaces your own session. Log out and back in to return. Every login is recorded, and
			administrators can't be logged in as.
		</p>

		{#if form?.message && "login" in form}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<label class="label">
			<span class="label-text">user UUID</span>
			<input class="input" name="user" required />
		</label>

		<button type="submit" class="btn mt-1 self-start">login</button>
	</form>

	<form class="nv-float flex flex-col gap-3" method="POST" use:enhance>
		<span class="nv-title">ban user</span>
		<p class="nv-dim">
			A banned user is signed out, their running scripts stop, and they can't sign in, run scripts or publish
			revisions. Their scripts stay up. Administrators can't be banned. Every ban and unban is recorded with
			your name and the reason.
		</p>

		{#if form?.message && "ban" in form}
			<small class={"ok" in form ? "text-success-400" : "text-error-400"}>{form.message}</small>
		{/if}

		<label class="label">
			<span class="label-text">user UUID</span>
			<input class="input" name="user" required />
		</label>
		<label class="label">
			<span class="label-text">reason</span>
			<input class="input" name="reason" maxlength="500" required />
		</label>

		<div class="mt-1 flex gap-2">
			<button type="submit" class="btn" formaction="?/ban">ban</button>
			<button type="submit" class="btn" formaction="?/unban">unban</button>
		</div>
	</form>

	{#if data.bans.length}
		<section class="nv-float">
			<span class="nv-title">recent bans</span>
			<ul class="flex flex-col gap-2">
				{#each data.bans as row (row.id)}
					<li class="flex flex-col">
						<span>
							<span class="nv-dim">{fmt.dateTime(row.created_at)} ·</span>
							{row.user} <span class="nv-dim">({row.user_id})</span>:
							<span class={row.banned ? "text-error-400" : "text-success-400"}
								>{row.banned ? "banned" : "unbanned"}</span
							>
						</span>
						<small class="nv-dim">by {row.admin} · {row.reason}</small>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.adjustments.length}
		<section class="nv-float">
			<span class="nv-title">recent adjustments</span>
			<ul class="flex flex-col gap-2">
				{#each data.adjustments as row (row.id)}
					<li class="flex flex-col">
						<span>
							<span class="nv-dim">{fmt.dateTime(row.created_at)} ·</span>
							{row.user} <span class="nv-dim">({row.user_id})</span>:
							<span class={row.amount < 0 ? "text-error-400" : "text-success-400"}
								>{row.amount > 0 ? "+" : ""}{fmt.credits(row.amount)}</span
							>
						</span>
						<small class="nv-dim">by {row.admin ?? "unknown"} · {row.note}</small>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.impersonations.length}
		<section class="nv-float">
			<span class="nv-title">recent logins as users</span>
			<ul class="flex flex-col gap-2">
				{#each data.impersonations as row (row.id)}
					<li class="flex flex-col">
						<span>
							<span class="nv-dim">{fmt.dateTime(row.created_at)} ·</span>
							{row.user} <span class="nv-dim">({row.user_id})</span>
						</span>
						<small class="nv-dim">by {row.admin}</small>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>
