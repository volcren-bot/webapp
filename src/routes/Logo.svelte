<script lang="ts">
	import { SITE_NAME } from "#lib/utils"

	let { selected }: { selected: boolean } = $props()
</script>

<!-- Website Logo: replace the glyph and name with your own -->
<img src="/favicon.svg" alt="" class="size-8" />
<span class="my-auto" class:font-bold={selected}>{SITE_NAME}</span>
