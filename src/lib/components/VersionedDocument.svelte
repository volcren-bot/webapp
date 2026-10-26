<script lang="ts">
	export type DocumentVersion = {
		version: string
		publishedAt: string
		content: string
	}

	let { id, title, versions }: { id: string; title: string; versions: DocumentVersion[] } = $props()

	let selected = $state<string>()
	const current = $derived(versions.find((v) => v.version === selected) ?? versions[0])
</script>

<div class="nv-float flex flex-col gap-3" {id}>
	<span class="nv-title">{title.toLowerCase()}</span>

	{#if current}
		<label class="flex items-center gap-2 self-start">
			<span class="label-text">version</span>
			<select
				class="input cursor-pointer"
				value={current.version}
				onchange={(e) => (selected = e.currentTarget.value)}
			>
				{#each versions as v (v.version)}
					<option value={v.version}>{v.version} · {v.publishedAt}</option>
				{/each}
			</select>
		</label>

		<div class="whitespace-pre-line">{current.content}</div>
	{:else}
		<p class="nv-dim">Nothing published yet.</p>
	{/if}
</div>
