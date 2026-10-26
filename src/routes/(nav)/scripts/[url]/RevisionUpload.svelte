<script lang="ts">
	import { invalidateAll } from "$app/navigation"
	import Upload from "@lucide/svelte/icons/upload"
	import { getSupabaseBrowser } from "#lib/supabase.browser"
	import { MAX_FILES, MAX_FILE_BYTES, uploadAll, validFileName } from "#lib/scripts"

	let { id }: { id: string } = $props()

	let files = $state<File[]>([])
	let busy = $state(false)
	let status = $state("")
	let failed = $state(false)

	const problem = $derived.by(() => {
		if (files.length > MAX_FILES) return `At most ${MAX_FILES} files per revision.`
		const big = files.find((f) => f.size > MAX_FILE_BYTES)
		if (big) return `${big.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`
		if (new Set(files.map((f) => f.name)).size !== files.length) return "File names must be unique."
		const bad = files.find((f) => !validFileName(f.name))
		if (bad) return `${bad.name}: file names may only use letters, digits, _ . and -.`
		return ""
	})

	async function upload() {
		if (!files.length || problem || busy) return
		busy = true
		failed = false
		let revision: number | undefined

		const supabase = await getSupabaseBrowser()
		try {
			status = "creating revision..."
			const created = await supabase
				.schema("scripts")
				.from("versions")
				// Clients may only insert id + files (column grants); a trigger assigns the revision, so the
				// generated type's required `revision` is cast away. Sending it would be a 403.
				.insert({ id, files: files.map((f) => f.name) } as { id: string; files: string[]; revision: number })
				.select("revision")
				.single()
			if (created.error) throw created.error
			revision = created.data.revision
			const folder = `${id}/${String(revision).padStart(9, "0")}`

			let uploaded = 0
			status = `uploading files (0/${files.length})...`
			await uploadAll(files, async (file) => {
				const { error } = await supabase.storage.from("scripts").upload(`${folder}/${file.name}`, file)
				if (error) throw error
				status = `uploading files (${++uploaded}/${files.length})...`
			})

			status = "publishing..."
			const published = await supabase.schema("scripts").rpc("publish_version", { script_id: id, revision })
			if (published.error) throw published.error

			status = `Revision ${revision} is live.`
			files = []
			await invalidateAll()
		} catch (e) {
			failed = true
			status = `Upload failed: ${e instanceof Error ? e.message : "unknown error"}`
			// A pending revision blocks the next one, so drop it.
			if (revision != null)
				await supabase.schema("scripts").rpc("discard_version", { script_id: id, revision })
			await invalidateAll()
		} finally {
			busy = false
		}
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
			onchange={(e) => (files = [...(e.currentTarget.files ?? [])])}
		/>
	</label>
	{#if problem}<small class="text-error-400">{problem}</small>{/if}
	{#if status}
		<small class={failed ? "text-error-400" : status.endsWith("live.") ? "text-success-400" : "nv-dim"}
			>{status}</small
		>
	{/if}
	<button type="button" class="btn self-start" disabled={busy || !files.length || !!problem} onclick={upload}>
		<Upload class="size-4 shrink-0" /> upload revision
	</button>
</div>
