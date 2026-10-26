<script lang="ts" module>
	export const question = "What are scripts written in?"
	export const order = 6
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	Scripts are written in Luau, a small and friendly language that is easy to pick up.
</FaqAnswer>
