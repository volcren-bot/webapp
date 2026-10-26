<script lang="ts">
	import type { Snippet } from "svelte"
	import { page } from "$app/state"
	import { FAQ_DIR, editUrl } from "#lib/github"

	let { question, children }: { question: string; children: Snippet } = $props()

	// The route directory is the slug, so the page's own file is derived from the URL.
	const file = $derived(`${FAQ_DIR}/${page.url.pathname.split("/").at(-1)}/+page.svelte`)
</script>

<article class="nv-float flex flex-col gap-2">
	<span class="nv-title">answer</span>
	<h2 class="font-bold">{question}</h2>
	<p>{@render children()}</p>
	<a href={editUrl(file)} target="_blank" rel="noopener noreferrer" class="nv-dim self-start"
		>edit this answer on GitHub</a
	>
</article>
