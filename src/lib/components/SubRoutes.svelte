<script lang="ts">
	import { useRouteTree } from "#lib/keys.svelte.js"
	import { sequences } from "#lib/routes"

	let { items }: { items: { label: string; href: string }[] } = $props()

	const tree = useRouteTree()
	const keys = $derived(new Map(sequences(tree()).map(({ node, keys }) => [node.href, keys.join(" ")])))
</script>

<!-- Pulled out by the links' padding, so their text lines up with the content around the menu -->
<nav class="nv-menu mx-[-1.5ch] flex flex-col" aria-label="Sub pages">
	{#each items as item (item.href)}
		<a href={item.href}>
			<span class="nv-key">{keys.get(item.href) ?? ""}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
