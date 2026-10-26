<script lang="ts">
	import { goto } from "$app/navigation"
	import { page } from "$app/state"
	import Head from "#lib/components/Head.svelte"
	import { faqs } from "#lib/faqs"
	import { newFaqUrl } from "#lib/github"
	import { useShortcuts } from "#lib/shortcuts.svelte.js"

	let { children } = $props()

	const currentId = $derived(page.url.pathname.split("/")[3])

	useShortcuts(() => [
		{
			display: "↑ ↓",
			label: "Previous / next question",
			scope: "This page",
			keys: ["ArrowUp", "ArrowDown"],
			run: (e) => {
				const current = faqs.findIndex((f) => f.id === currentId)
				const next =
					current === -1
						? e.key === "ArrowDown"
							? 0
							: faqs.length - 1
						: Math.min(Math.max(current + (e.key === "ArrowDown" ? 1 : -1), 0), faqs.length - 1)
				if (next !== current) goto(`/information/faq/${faqs[next].id}`)
			}
		},
		{
			display: `${faqs[0].key}–${faqs[faqs.length - 1].key}`,
			label: "Open that question",
			scope: "This page",
			keys: faqs.flatMap((f) => (f.key ? [f.key] : [])),
			run: (e) => goto(`/information/faq/${faqs.find((f) => f.key === e.key)?.id}`)
		}
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
				class="grid min-h-9 shrink-0 grid-cols-[4ch_1fr] items-start gap-4 px-3 py-1.5 text-(--tn-fg) hover:bg-(--tn-bg-hl) hover:text-(--tn-blue) hover:no-underline {active
					? 'bg-(--tn-bg-hl)'
					: ''}"
				aria-current={active ? "page" : undefined}
			>
				<span class="nv-key">{faq.key}</span>
				<span class="min-w-0 wrap-break-word {active ? 'text-(--tn-blue)' : ''}">{faq.q}</span>
			</a>
		{/each}
	</nav>

	{@render children()}

	<small class="nv-dim">
		Missing a question?
		<a href={newFaqUrl()} target="_blank" rel="noopener noreferrer">Add one on GitHub</a>.
	</small>
</section>
