<script lang="ts">
	import Coin from "./Coin.svelte"
	import { fmt } from "#lib/format.svelte.js"

	let { amount, class: className = "" }: { amount: number; class?: string } = $props()
</script>

<!-- A number of credits with the coin in place of the word, at 1 = 1 EUR -->
<span
	class="inline-flex items-center gap-1 whitespace-nowrap {className}"
	title="{fmt.creditAmount(amount)} credits"
>
	<Coin />{fmt.creditAmount(amount)}
</span>
