<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import { pricePerMonth } from "#lib/scripts"

	/** A script's price, given in microcredits per hour: shown per month, per hour and per minute. */
	let { price, class: className = "" }: { price: number; class?: string } = $props()
</script>

{#if price === 0}
	<span class="text-lg font-bold text-(--tn-green) {className}">free</span>
{:else}
	<span class="inline-flex flex-col leading-tight {className}">
		<span class="text-lg font-bold text-(--tn-orange)"
			>{fmt.creditAmount(pricePerMonth(price))} CREDIT/MONTH</span
		>
		<span class="nv-dim text-xs">{fmt.creditAmount(price)} CREDIT/HOUR</span>
		<span class="nv-dim text-xs">{fmt.creditAmount(price / 60)} CREDIT/MIN</span>
	</span>
{/if}
