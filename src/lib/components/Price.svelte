<script lang="ts">
	import Credits from "./Credits.svelte"

	/** A script's price, given in credits per minute: shown per hour, with the per-minute rate beneath. */
	let { credits, class: className = "" }: { credits: number; class?: string } = $props()
</script>

{#if credits === 0}
	<span class="text-lg font-bold text-(--tn-green) {className}">free</span>
{:else}
	<span class="inline-flex flex-col leading-tight {className}">
		<span class="text-lg font-bold"><Credits amount={credits * 60} />/h</span>
		<span class="nv-dim text-xs"><Credits amount={credits} />/min</span>
	</span>
{/if}
