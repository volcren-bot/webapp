<script lang="ts">
	import type { Snippet } from "svelte"
	import { page } from "$app/state"
	import { FAQ_DIR, editPageUrl } from "#lib/github"

	let { question, children }: { question: string; children: Snippet } = $props()
</script>

<article class="nv-float flex flex-col gap-2">
	<span class="nv-title">answer</span>
	<h2 class="font-bold">{question}</h2>
	<p>{@render children()}</p>
	<a
		href={editPageUrl(FAQ_DIR, page.url.pathname)}
		target="_blank"
		rel="noopener noreferrer"
		class="nv-dim self-start">edit this answer on GitHub</a
	>
</article>
