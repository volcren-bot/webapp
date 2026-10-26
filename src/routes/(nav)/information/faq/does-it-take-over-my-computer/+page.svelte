<script lang="ts" module>
	export const question = "Does it take over my computer?"
	export const order = 4
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	No. It only talks to the game client you choose. The rest of your computer is left alone.
</FaqAnswer>
