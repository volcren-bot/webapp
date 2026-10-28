<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"
	import { untrack } from "svelte"
	import { Constants } from "#lib/types/supabase"

	const { data, form } = $props()

	type Suggestion = { id: string; username: string; avatar: string }

	let query = $state(untrack(() => data.search))
	let suggestions = $state<Suggestion[]>([])
	let more = $state(false)
	let timer: ReturnType<typeof setTimeout>
	let controller: AbortController | undefined

	let documentKind = $state("community_tos")
	let documentContent = $state("")
	let documentStatus = $state("")
	let loadingDocument = $state(false)

	async function loadLatest() {
		loadingDocument = true
		documentStatus = ""
		try {
			const res = await fetch(`/admin/documents?kind=${encodeURIComponent(documentKind)}`)
			if (!res.ok) {
				documentStatus = "Could not load the document."
				return
			}
			const body = await res.json()
			if (body.version === null) {
				documentStatus = `No published version of ${documentKind} yet.`
				return
			}
			documentContent = body.content
			documentStatus = `Loaded v${body.version}.`
		} catch {
			documentStatus = "Could not load the document."
		} finally {
			loadingDocument = false
		}
	}

	// Waits for a pause in typing and drops stale requests, so a fast typist sends few queries
	function search() {
		clearTimeout(timer)
		controller?.abort()
		const q = query.trim()
		if (q.length < 2) {
			suggestions = []
			more = false
			return
		}
		timer = setTimeout(async () => {
			controller = new AbortController()
			try {
				const res = await fetch(`/admin/users?q=${encodeURIComponent(q)}`, { signal: controller.signal })
				if (!res.ok) return
				const body = await res.json()
				suggestions = body.users
				more = body.more
			} catch {
				// aborted by a newer keystroke, or offline
			}
		}, 250)
	}
</script>

<Head title="Admin" description="Adjust credits, log in as users and ban accounts." noindex />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<form class="nv-float flex flex-col gap-3" method="GET">
		<span class="nv-title">find user</span>
		<label class="label">
			<span class="label-text">username or UUID</span>
			<input
				class="input"
				name="user"
				bind:value={query}
				oninput={search}
				maxlength="64"
				autocomplete="off"
				required
			/>
		</label>

		{#if suggestions.length}
			<ul class="flex flex-col gap-1">
				{#each suggestions as s (s.id)}
					<li>
						<a class="underline" href="?user={s.id}">{s.username}</a>
						<span class="nv-dim">({s.id})</span>
					</li>
				{/each}
			</ul>
		{:else if more}
			<small class="nv-dim">More than 5 matches, keep typing.</small>
		{/if}

		<button type="submit" class="btn self-start">search</button>
	</form>

	{#if data.inspected}
		{@const u = data.inspected}
		<section class="nv-float flex flex-col gap-1">
			<span class="nv-title">{u.username}</span>
			<span><span class="nv-dim">UUID</span> {u.id}</span>
			<span><span class="nv-dim">email</span> {u.email ?? "none"}</span>
			<span><span class="nv-dim">role</span> {u.role}</span>
			<span><span class="nv-dim">joined</span> {fmt.dateTime(u.created_at)}</span>
			<span><span class="nv-dim">credits</span> {fmt.credits(u.credits)}</span>
			<span><span class="nv-dim">earnings</span> {fmt.credits(u.earnings)}</span>
			<span>
				<span class="nv-dim">status</span>
				{#if u.banned_at}
					<span class="text-error-400">banned {fmt.dateTime(u.banned_at)}</span>
				{:else}
					<span class="text-success-400">active</span>
				{/if}
			</span>
		</section>
	{:else if data.search}
		<small class="text-error-400">No user matches "{data.search}".</small>
	{/if}

	<header>
		<h1 class="text-2xl font-bold">Adjust credits</h1>
		<p class="nv-dim">Every change is recorded with your name and the note.</p>
	</header>

	<form class="nv-float flex flex-col gap-3" method="POST" action="?/adjust" use:enhance>
		<span class="nv-title">adjustment</span>

		{#if form?.message && !("login" in form) && !("ban" in form) && !("document" in form)}
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

	<form class="nv-float flex flex-col gap-3" method="POST" action="?/publishDocument" use:enhance>
		<span class="nv-title">publish a document</span>
		<p class="nv-dim">
			Adds a new version in markdown; published versions can't be edited. A new <b>scripter_tos</b> or
			<b>community_tos</b> version asks every script creator to accept it again before they can create scripts,
			upload revisions or generate share codes. Their existing scripts keep running.
		</p>

		{#if form?.message && "document" in form}
			<small class={"ok" in form ? "text-success-400" : "text-error-400"}>{form.message}</small>
		{/if}

		<label class="label">
			<span class="label-text">document</span>
			<select class="input" name="kind" bind:value={documentKind} required>
				{#each Constants.info.Enums.kind as kind (kind)}
					<option value={kind}>{kind}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			<span class="label-text">content (markdown)</span>
			<textarea class="input min-h-48 font-mono" name="content" maxlength="200000" bind:value={documentContent} required></textarea>
		</label>

		<div class="mt-1 flex items-center gap-2">
			<button type="submit" class="btn">publish</button>
			<button type="button" class="btn" onclick={loadLatest} disabled={loadingDocument}>
				load latest version
			</button>
			{#if documentStatus}<small class="nv-dim">{documentStatus}</small>{/if}
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
