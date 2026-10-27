<script lang="ts" module>
	export const question = "What are community scripts?"
	export const order = 9
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	Anyone can write a script once they accept the creator terms. A script by a scripter is <b>official</b>; a
	script by anyone else is a <b>community</b> script. Community scripts are always free, are not reviewed by staff,
	and are not listed for everyone: only their author, testers and people who were given a share code can see and
	run them. The loader warns you before it runs one, because it runs on your computer and controls your game client.
	Only run community scripts from people you trust.
</FaqAnswer>
