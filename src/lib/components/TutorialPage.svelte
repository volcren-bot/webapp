<script lang="ts">
	import type { Snippet } from "svelte"
	import { page } from "$app/state"
	import Head from "#lib/components/Head.svelte"
	import { TUTORIAL_DIR, editUrl } from "#lib/github"

	let {
		title,
		description = "",
		children
	}: { title: string; description?: string; children: Snippet } = $props()

	// The route directory is the slug, so the page's own file is derived from the URL.
	const file = $derived(`${TUTORIAL_DIR}/${page.url.pathname.split("/").at(-1)}/+page.svelte`)
</script>

<Head {title} {description} />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/tutorials" class="nv-dim">← tutorials</a>
		<h1 class="text-2xl font-bold">{title}</h1>
	</header>

	<article class="nv-float flex flex-col gap-2">
		<span class="nv-title">guide</span>
		{@render children()}
		<a href={editUrl(file)} target="_blank" rel="noopener noreferrer" class="nv-dim self-start"
			>edit this tutorial on GitHub</a
		>
	</article>
</section>
