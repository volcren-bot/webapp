<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"
	import { formatCredits } from "#lib/utils"

	const { data, form } = $props()
</script>

<Head title="Adjust credits" description="Grant or remove credits." noindex />

<main class="mx-auto my-6 flex w-full max-w-3xl flex-col">
	<header class="my-8 flex flex-col">
		<h1 class="text-2xl font-bold">Adjust credits</h1>
		<p class="nv-dim">Every change is recorded with your name and the note.</p>
	</header>

	<form class="nv-float flex w-full flex-col" method="POST" action="?/adjust" use:enhance>
		<span class="nv-title">adjustment</span>

		{#if form?.message && !("login" in form)}
			<small class={form.ok ? "text-success-400" : "text-error-400"}>{form.message}</small>
		{/if}

		<label class="label my-3">
			<span class="label-text">user UUID</span>
			<input class="input" name="user" required />
		</label>
		<label class="label my-3">
			<span class="label-text">credits (negative to remove, 10,000 = €1)</span>
			<input class="input" name="amount" type="number" step="1" required />
		</label>
		<label class="label my-3">
			<span class="label-text">note</span>
			<input class="input" name="note" required />
		</label>

		<button type="submit" class="btn my-2 mr-auto">apply</button>
	</form>

	<form class="nv-float mt-6 flex w-full flex-col" method="POST" action="?/impersonate" use:enhance>
		<span class="nv-title">login as user</span>
		<small class="nv-dim">
			This replaces your own session. Log out and back in to return. Every login is recorded, and
			administrators can't be logged in as.
		</small>

		{#if form?.message && "login" in form}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<label class="label my-3">
			<span class="label-text">user UUID</span>
			<input class="input" name="user" required />
		</label>

		<button type="submit" class="btn my-2 mr-auto">login</button>
	</form>

	{#if data.adjustments.length}
		<section class="nv-float mt-6 flex w-full flex-col">
			<span class="nv-title">recent adjustments</span>
			<ul class="my-3 flex flex-col gap-1">
				{#each data.adjustments as row (row.id)}
					<li class="flex flex-col">
						<span>
							{fmt.dateTime(row.created_at)} · {row.user} ({row.user_id}):
							{row.amount > 0 ? "+" : ""}{fmt.credits(row.amount)}
						</span>
						<small class="nv-dim">by {row.admin ?? "unknown"} · {row.note}</small>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.impersonations.length}
		<section class="nv-float mt-6 flex w-full flex-col">
			<span class="nv-title">recent logins as users</span>
			<ul class="my-3 flex flex-col gap-1">
				{#each data.impersonations as row (row.id)}
					<li class="flex flex-col">
						<span>{fmt.dateTime(row.created_at)} · {row.user} ({row.user_id})</span>
						<small class="nv-dim">by {row.admin}</small>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
