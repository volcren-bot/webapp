<script lang="ts" module>
	export const question = "What is this?"
	export const order = 1
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	It is a tool that lets you run scripts that play the game for you, handling repetitive tasks so you don't
	have to.
</FaqAnswer>
