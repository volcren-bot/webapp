<script lang="ts" module>
	export const question = "Which operating systems are supported?"
	export const order = 3
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	Windows, and Linux if you run the game client through Wine. macOS is not supported at the moment.
</FaqAnswer>
