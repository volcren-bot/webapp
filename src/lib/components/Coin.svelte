<script lang="ts">
	import Coins from "@lucide/svelte/icons/coins"

	let { class: className = "" }: { class?: string } = $props()
</script>

<!-- The credits icon, in the text colour -->
<Coins
	class="inline-block size-[1em] shrink-0 align-[-0.125em] {className}"
	aria-label="credits"
	role="img"
/>
