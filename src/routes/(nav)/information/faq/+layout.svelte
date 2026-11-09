<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/state"
	import Head from "#lib/components/Head.svelte"
	import { faqs } from "#lib/faqs"
	import { NEW_FAQ_URL } from "#lib/github"
	import { useKeys } from "#lib/keys.svelte.js"

	let { children } = $props()

	const currentId = $derived(page.url.pathname.split("/")[3])

	// Moves to the neighbouring question; from the index, down opens the first and up the last.
	function move(by: 1 | -1) {
		const current = faqs.findIndex((f) => f.id === currentId)
		const last = faqs.length - 1
		const next = current === -1 ? (by === 1 ? 0 : last) : Math.min(Math.max(current + by, 0), last)
		if (next !== current) goto(`/information/faq/${faqs[next].id}`)
	}

	useKeys(() => [
		{ keys: ["j", "ArrowDown"], display: "j ↓", label: "Next question", run: () => move(1) },
		{ keys: ["k", "ArrowUp"], display: "k ↑", label: "Previous question", run: () => move(-1) }
	])

	let list = $state<HTMLElement>()

	// Only scrolls when the selected row is outside the visible part of the list.
	$effect(() => {
		if (!currentId) return
		list?.querySelector("[aria-current]")?.scrollIntoView({ block: "nearest" })
	})
</script>

<Head title="FAQ" description="Frequently asked questions." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Frequently asked questions</h1>
	</header>

	<nav
		bind:this={list}
		class="flex max-h-[calc(5*2.25rem+0.125rem)] flex-col divide-y divide-(--tn-bg-hl) overflow-y-auto rounded-md border border-(--tn-bg-hl) bg-(--tn-bg-float)"
		aria-label="Questions"
	>
		{#each faqs as faq (faq.id)}
			{@const active = currentId === faq.id}
			<a
				href="/information/faq/{faq.id}"
				class="flex min-h-9 shrink-0 items-start px-3 py-1.5 text-(--tn-fg) hover:bg-(--tn-bg-hl) hover:text-(--tn-blue) hover:no-underline {active
					? 'bg-(--tn-bg-hl)'
					: ''}"
				aria-current={active ? "page" : undefined}
			>
				<span class="min-w-0 wrap-break-word {active ? 'text-(--tn-blue)' : ''}">{faq.q}</span>
			</a>
		{/each}
	</nav>

	{@render children()}

	<small class="nv-dim">
		Missing a question?
		<a href={NEW_FAQ_URL} target="_blank" rel="noopener noreferrer">Add one on GitHub</a>.
	</small>
</section>
