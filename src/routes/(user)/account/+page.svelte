<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"
	import UUID from "#lib/components/UUID.svelte"
	import { creditSource } from "#lib/utils"
	import Price from "#lib/components/Price.svelte"

	const runningFor = (iso: string) => {
		const minutes = Math.max(Math.floor((Date.now() - new Date(iso).getTime()) / 60_000), 0)
		return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
	}
	const END_REASONS: Record<string, string> = {
		stopped: "stopped",
		timeout: "timed out",
		insufficient_credits: "out of CREDIT"
	}

	const { data, form } = $props()
	const profile = $derived(data.profile!)
</script>

<Head title="Account" description="Manage your account." noindex />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex flex-col items-start gap-2">
		<h1 class="text-2xl font-bold">Account: {profile.username || "No username"}</h1>
		<UUID uuid={profile.id}></UUID>
		<p class="nv-dim">
			Role: <b class="text-(--tn-fg)">{profile.role}</b>{#if profile.role === "contributor"}
				· you have community scripts{/if}
		</p>
	</header>

	<section class="nv-float flex flex-col items-start gap-3">
		<span class="nv-title">balance</span>
		<p class="text-lg font-bold">{fmt.credits(data.credits, true)}</p>
		<a class="btn" href="/credits">add funds</a>
	</section>

	<section class="nv-float flex flex-col gap-3">
		<span class="nv-title">running scripts</span>
		{#if data.running.length}
			<p class="nv-dim">
				Stopping a script here ends its session; the loader stops the script within a minute. Every running
				script past the oldest pays the extra-session fee.
			</p>
			<ul class="flex flex-col gap-2">
				{#each data.running as session (session.id)}
					<li class="flex flex-wrap items-center gap-x-4 gap-y-1">
						{#if session.url}
							<a href="/scripts/{session.url}" class="font-bold">{session.title}</a>
						{:else}
							<span class="font-bold">{session.title}</span>
						{/if}
						<span class="nv-dim">started {fmt.dateTime(session.started_at)}</span>
						<span class="nv-dim">running {runningFor(session.started_at)}</span>
						<Price credits={session.price} />
						{#if session.fee_charged}
							<span class="nv-dim">fee so far {fmt.credits(session.fee_charged)}</span>
						{/if}
						<form
							method="POST"
							action="?/stop"
							class="ml-auto"
							use:enhance={({ cancel }) => {
								if (!confirm(`Stop ${session.title}? The loader stops it within a minute.`)) cancel()
							}}
						>
							<input type="hidden" name="session" value={session.id} />
							<button type="submit" class="btn btn-danger">stop</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="nv-dim">Nothing is running right now.</p>
		{/if}
		{#if form && "stopMessage" in form}
			<small class={form.stopError ? "text-error-400" : "text-success-400"}>{form.stopMessage}</small>
		{/if}
		{#if data.ended.length}
			<p class="nv-dim mt-2">Recent sessions:</p>
			<ul class="flex flex-col gap-1 text-sm">
				{#each data.ended as session (session.id)}
					<li class="flex flex-wrap items-baseline gap-x-3">
						<span>{session.title}</span>
						<span class="nv-dim">{fmt.dateTime(session.started_at)}</span>
						<span class="nv-dim">→ {session.ended_at ? fmt.dateTime(session.ended_at) : ""}</span>
						<span class="nv-dim">{END_REASONS[session.end_reason ?? ""] ?? session.end_reason}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="nv-float">
		<span class="nv-title">history</span>
		{#if data.ledger.length}
			<ul class="flex flex-col gap-1">
				{#each data.ledger as entry (entry.id)}
					<li class="flex justify-between gap-4">
						<span>
							<span class="nv-dim">{fmt.dateTime(entry.created_at)} ·</span>
							{creditSource(entry)}
							{#if entry.topupBonus}
								<span class="nv-dim">(incl. {fmt.credits(entry.topupBonus)} bonus)</span>
							{/if}
							{#if entry.fee}
								<span class="nv-dim">(incl. {fmt.credits(entry.fee)} extra-session fee)</span>
							{/if}
							{#if entry.kind !== "topup" && entry.bonus}
								<span class="nv-dim">({fmt.credits(-entry.bonus)} of it bonus CREDIT)</span>
							{/if}
							{#if entry.note}<span class="nv-dim">({entry.note})</span>{/if}
						</span>
						<span
							class="shrink-0 text-right whitespace-nowrap {entry.amount < 0
								? 'text-error-400'
								: 'text-success-400'}"
						>
							{entry.amount > 0 ? "+" : ""}{fmt.credits(entry.amount)}
							<span class="nv-dim">→ {fmt.credits(entry.balance_after, true)}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="nv-dim">No transactions yet.</p>
		{/if}
	</section>

	<form class="nv-float nv-danger flex flex-col gap-3" method="POST" action="?/delete" use:enhance>
		<span class="nv-title">delete account</span>
		<p>
			this permanently deletes your profile, discord link and stats, and signs you out.
			<strong>
				your {fmt.credits(data.credits, true)} are lost.
			</strong>
			payment and usage records are kept, linked only to your account id (see the
			<a href="/information/privacy">privacy policy</a>).
		</p>

		{#if data.blockers.length}
			<ul class="flex flex-col gap-1">
				{#each data.blockers as blocker (blocker)}
					<li class="text-error-400">✗ {blocker}</li>
				{/each}
			</ul>
		{:else}
			{#if form && "deleteMessage" in form}
				<small class="text-error-400">{form.deleteMessage}</small>
			{/if}

			<label class="label">
				<span class="label-text">type <strong>{profile.username}</strong> to confirm</span>
				<input class="input" name="confirm" autocomplete="off" required />
			</label>

			<button type="submit" class="btn mt-1 self-start">delete my account</button>
		{/if}
	</form>
</section>
