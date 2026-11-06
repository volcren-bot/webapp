<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"

	/** A script's price, given in credits per minute: shown per hour, with the per-minute rate beneath. */
	let { credits, class: className = "" }: { credits: number; class?: string } = $props()
</script>

{#if credits === 0}
	<span class="text-lg font-bold text-(--tn-green) {className}">free</span>
{:else}
	<span class="inline-flex flex-col leading-tight {className}">
		<span class="text-lg font-bold">{fmt.credits(credits * 60)}/h</span>
		<span class="nv-dim text-xs">{fmt.credits(credits)}/min</span>
	</span>
{/if}
