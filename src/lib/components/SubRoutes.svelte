<script lang="ts">
	import { goto } from "$app/navigation"
	import { useShortcuts } from "#lib/shortcuts.svelte.js"

	let { items }: { items: { key: string; label: string; href: string }[] } = $props()

	useShortcuts(() =>
		items.map((i) => ({
			display: i.key,
			label: i.label,
			scope: "This page",
			keys: [i.key],
			run: () => goto(i.href)
		}))
	)
</script>

<nav class="nv-menu w-full max-w-xs self-center" aria-label="Sub pages">
	{#each items as item (item.key)}
		<a href={item.href}>
			<span class="nv-key">{item.key}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
