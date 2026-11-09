<script lang="ts">
	import { invalidateAll } from "$app/navigation"
	import Upload from "@lucide/svelte/icons/upload"
	import { fmt } from "#lib/format.svelte.js"
	import { getSupabaseBrowser } from "#lib/supabase.browser"
	import { createRevision, filesProblem, storeRevision } from "#lib/revisions"

	let { id }: { id: string } = $props()

	let files = $state<File[]>([])
	let chosen = $state("")
	let busy = $state(false)
	let status = $state("")
	let failed = $state(false)

	const problem = $derived(filesProblem(files, fmt.locale))

	// One file is the entry. With several, the author picks (main.luau is offered first if there is one).
	const entry = $derived(
		files.length === 1 ? files[0].name : files.some((f) => f.name === chosen) ? chosen : ""
	)

	async function upload() {
		if (!files.length || problem || !entry || busy) return
		busy = true
		failed = false

		const supabase = await getSupabaseBrowser()
		try {
			status = "creating revision..."
			const created = await createRevision(supabase, id, files, entry)
			if (created.error) throw created.error
			const revision = created.data.revision

			const count = files.length
			status = `uploading files (0/${count})...`
			await storeRevision(supabase, id, revision, files, (done) => {
				status = done < count ? `uploading files (${done}/${count})...` : "publishing..."
			})

			status = `Revision ${revision} is live.`
			files = []
		} catch (e) {
			failed = true
			status = `Upload failed: ${e instanceof Error ? e.message : "unknown error"}`
		} finally {
			busy = false
		}
		await invalidateAll()
	}
</script>

<div class="flex flex-col gap-3">
	<label class="label">
		<span class="label-text">files (Luau or any other)</span>
		<input
			class="input"
			type="file"
			multiple
			disabled={busy}
			onchange={(e) => {
				files = [...(e.currentTarget.files ?? [])]
				chosen = files.find((f) => f.name === "main.luau")?.name ?? ""
			}}
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
	{#if problem}<small class="text-error-400">{problem}</small>{/if}
	{#if status}
		<small class={failed ? "text-error-400" : status.endsWith("live.") ? "text-success-400" : "nv-dim"}
			>{status}</small
		>
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
