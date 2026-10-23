<script lang="ts">
	import { SITE_NAME } from "#lib/utils"

	let { selected }: { selected: boolean } = $props()
</script>

<!-- Website Logo: replace the glyph and name with your own -->
<span class="inline-flex items-center gap-2 whitespace-nowrap">
	<span aria-hidden="true" style="color: var(--tn-orange)">▲</span>
	<span class:font-bold={selected}>{SITE_NAME.toLowerCase()}</span>
</span>
