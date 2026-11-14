<script lang="ts" module>
	export const question = "Do I need to know how to code?"
	export const order = 5
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	No. You just pick a script, press start and let it run. If you want a script that doesn't exist yet, you can
	write your own, or <a href="/tutorials/write-scripts-with-an-ai-agent">let an AI agent write and test it</a>
	with you from the loader.
</FaqAnswer>
