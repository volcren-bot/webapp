<script lang="ts">
	import { SITE_NAME } from "#lib/utils"

	let { selected }: { selected: boolean } = $props()
</script>

<!-- Website Logo: replace the glyph and name with your own -->
<span class="inline-flex items-center gap-2 whitespace-nowrap">
	<img src="/favicon.svg" alt="" class="h-[1.2em] w-[1.2em]" />
	<span class:font-bold={selected}>{SITE_NAME.toLowerCase()}</span>
</span>
