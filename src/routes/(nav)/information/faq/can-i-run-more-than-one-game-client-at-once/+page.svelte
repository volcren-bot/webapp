<script lang="ts" module>
	export const question = "Can I run more than one game client at once?"
	export const order = 7
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	Yes. Each game client is handled on its own, so you can pick which one a script should control.
</FaqAnswer>
