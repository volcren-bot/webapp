<script lang="ts" module>
	export const question = "How does it work?"
	export const order = 2
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	It runs alongside your game client and reads what is happening in the game, such as your items, skills and
	surroundings. It then sends mouse and keyboard input back, just like you would.
</FaqAnswer>
