<script lang="ts" module>
	export const question = "Do I need to know how to code?"
	export const order = 5
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	No. You just pick a script, press start and let it run. If you do like to code, you can write your own
	scripts too.
</FaqAnswer>
