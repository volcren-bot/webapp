<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument, { type DocumentVersion } from "#lib/components/VersionedDocument.svelte"

	/** A page for one legal document; `back` is the parent page, named by its last segment. */
	let {
		title,
		description,
		intro,
		back,
		id,
		document
	}: {
		title: string
		description: string
		intro?: string
		back: string
		id: string
		document: { versions: DocumentVersion[]; error?: string }
	} = $props()
</script>

<Head {title} {description} />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href={back} class="nv-dim">← {back.split("/").at(-1)}</a>
		<h1 class="text-2xl font-bold">{title}</h1>
		{#if intro}<p class="nv-dim">{intro}</p>{/if}
	</header>

	{#if document.error}
		<small class="text-error-400">{document.error}</small>
	{/if}
	<VersionedDocument {id} {title} versions={document.versions} />
</section>
