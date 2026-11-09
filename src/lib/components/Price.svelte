<script lang="ts">
	import { MINUTES_PER_MONTH } from "#lib/credits"
	import { fmt } from "#lib/format.svelte.js"

	/** A script's price, given in credits per minute: shown per month, per hour and per minute. */
	let { credits, class: className = "" }: { credits: number; class?: string } = $props()
</script>

{#if credits === 0}
	<span class="text-lg font-bold text-(--tn-green) {className}">free</span>
{:else}
	<span class="inline-flex flex-col leading-tight {className}">
		<span class="text-lg font-bold text-(--tn-orange)"
			>{fmt.creditAmount(credits * MINUTES_PER_MONTH)} CREDIT/MONTH</span
		>
		<span class="nv-dim text-xs">{fmt.creditAmount(credits * 60)} CREDIT/HOUR</span>
		<span class="nv-dim text-xs">{fmt.creditAmount(credits)} CREDIT/MIN</span>
	</span>
{/if}
