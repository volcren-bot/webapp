<script lang="ts">
	let { items }: { items: { key: string; label: string; href: string }[] } = $props()
</script>

<!-- Pulled out by the links' padding, so their text lines up with the content around the menu -->
<nav class="nv-menu mx-[-1.5ch] flex flex-col" aria-label="Sub pages">
	{#each items as item (item.key)}
		<a href={item.href}>
			<span class="nv-key">{item.key}</span>
			<span>{item.label}</span>
		</a>
	{/each}
</nav>
