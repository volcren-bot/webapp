<script lang="ts">
	import { goto } from "$app/navigation"

	let { items }: { items: { key: string; label: string; href: string }[] } = $props()

	function onkeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) return
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
		const item = items.find((i) => i.key === e.key)
		if (item) goto(item.href)
	}
</script>

<svelte:window {onkeydown} />

<nav class="nv-menu w-full max-w-xs self-center" aria-label="Sub pages">
	{#each items as item (item.key)}
		<a href={item.href}>
			<span class="nv-key">{item.key}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
