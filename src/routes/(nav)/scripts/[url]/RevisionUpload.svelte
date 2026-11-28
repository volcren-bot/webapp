<script lang="ts">
	import { invalidateAll } from "$app/navigation"
	import Upload from "@lucide/svelte/icons/upload"
	import { fmt } from "#lib/format.svelte.js"
	import { getSupabaseBrowser } from "#lib/supabase"
	import {
		createRevision,
		filesProblem,
		MANIFEST_FILE,
		readManifest,
		RevisionCheckFailed,
		storeRevision,
		type RevisionProblem
	} from "#lib/revisions"
	import type { Json } from "#lib/types/supabase"

	let { id }: { id: string } = $props()

	let chosenFiles = $state<File[]>([])
	let files = $state<File[]>([])
	let manifest = $state<Json | null>(null)
	let manifestProblem = $state<string | null>(null)
	let chosen = $state("")
	let busy = $state(false)
	let status = $state("")
	let failed = $state(false)
	let checkProblems = $state<RevisionProblem[]>([])

	const problem = $derived(manifestProblem ?? (chosenFiles.length ? filesProblem(files, fmt.locale) : null))
	const queueable = $derived(
		typeof manifest === "object" &&
			manifest !== null &&
			!Array.isArray(manifest) &&
			manifest.queueable === true
	)

	let picks = 0

	async function choose(list: File[]) {
		const pick = ++picks
		chosenFiles = list
		const read = await readManifest(list)
		if (pick !== picks) return
		files = read.modules
		manifest = read.manifest
		manifestProblem = read.problem
		chosen = files.find((f) => f.name === "main.luau")?.name ?? ""
	}

	// One file is the entry. With several, the author picks (main.luau is offered first if there is one).
	const entry = $derived(
		files.length === 1 ? files[0].name : files.some((f) => f.name === chosen) ? chosen : ""
	)

	async function upload() {
		if (!files.length || problem || !entry || busy) return
		busy = true
		failed = false
		checkProblems = []

		const supabase = await getSupabaseBrowser()
		try {
			const { data: auth } = await supabase.auth.getSession()
			const token = auth.session?.access_token
			if (!token) throw new Error("you are signed out, sign in again")

			status = "creating revision..."
			const created = await createRevision(supabase, id, files, entry, manifest)
			if (created.error) throw created.error
			const revision = created.data.revision

			const count = files.length
			status = `uploading files (0/${count})...`
			await storeRevision(supabase, id, revision, files, token, (done) => {
				status = done < count ? `uploading files (${done}/${count})...` : "type checking..."
			})

			status = `Revision ${revision} is live.`
			await choose([])
		} catch (e) {
			failed = true
			if (e instanceof RevisionCheckFailed) checkProblems = e.problems
			status = `Upload failed: ${e instanceof Error ? e.message : "unknown error"}`
		} finally {
			busy = false
		}
		await invalidateAll()
	}
</script>

<div class="flex flex-col gap-3">
	<small class="nv-dim"
		>Each revision is type-checked against the newest lib before it goes live, so every .luau file starts with
		--!strict and has no type errors. A live revision that a newer lib breaks is hidden until you upload a
		fixed one.</small
	>
	<label class="label">
		<span class="label-text">files (Luau or any other)</span>
		<input
			class="input"
			type="file"
			multiple
			disabled={busy}
			onchange={(e) => choose([...(e.currentTarget.files ?? [])])}
		/>
	</label>
	{#if files.length > 1}
		<label class="label">
			<span class="label-text">entry file (the one the loader runs)</span>
			<select class="select" bind:value={chosen} disabled={busy}>
				<option value="" disabled>choose one...</option>
				{#each files as f (f.name)}<option value={f.name}>{f.name}</option>{/each}
			</select>
		</label>
	{/if}
	{#if manifest && !manifestProblem}
		<small class="nv-dim"
			>{MANIFEST_FILE} is stored with the revision{queueable ? ", which the loader can queue" : ""}.</small
		>
	{/if}
	{#if problem}<small class="text-error-400">{problem}</small>{/if}
	{#if status}
		<small class={failed ? "text-error-400" : status.endsWith("live.") ? "text-success-400" : "nv-dim"}
			>{status}</small
		>
	{/if}
	{#if checkProblems.length}
		<ul class="flex flex-col gap-1 text-sm">
			{#each checkProblems as p, i (i)}
				<li>
					<code class="nv-dim">{p.file}:{p.line}:{p.column}</code>
					<pre class="whitespace-pre-wrap text-error-400">{p.message}</pre>
				</li>
			{/each}
		</ul>
	{/if}
	<button
		type="button"
		class="btn self-start"
		disabled={busy || !files.length || !!problem || !entry}
		onclick={upload}
	>
		<Upload class="size-4 shrink-0" /> upload revision
	</button>
</div>
