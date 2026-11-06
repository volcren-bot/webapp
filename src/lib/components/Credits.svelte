<script lang="ts">
	import Coin from "./Coin.svelte"
	import { fmt } from "#lib/format.svelte.js"

	let { amount, class: className = "" }: { amount: number; class?: string } = $props()
</script>

<!-- A number of credits with the coin in place of the word, at 1 = 1 EUR, on the side the locale puts its currency symbol -->
<span
	class="inline-flex items-center gap-1 whitespace-nowrap {className}"
	title="{fmt.creditAmount(amount)} credits"
>
	{#if fmt.coinAfter}{fmt.creditAmount(amount)}<Coin />{:else}<Coin />{fmt.creditAmount(amount)}{/if}
</span>
