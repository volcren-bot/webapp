<script lang="ts">
	let { items }: { items: { key: string; label: string; href: string }[] } = $props()
</script>

<nav class="nv-menu w-full max-w-xs self-center" aria-label="Sub pages">
	{#each items as item (item.key)}
		<a href={item.href}>
			<span class="nv-key">{item.key}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
