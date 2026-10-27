<script lang="ts" module>
	export const question = "How do share codes work?"
	export const order = 10
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
</script>

<FaqAnswer {question}>
	A script's author can generate a share code to give one person private access to it, whether the script is
	community or official. A code is a long random string you copy and paste. It works once, for one person, and
	expires on its own (up to 30 days). Paste it in the redeem box on the scripts page or in the loader and the
	script is added to your list, free to run even if it is premium. The author can take your access away, and
	you can remove the script from your account yourself. A used code can't be used again, so ask for a new one
	if you lose access.
</FaqAnswer>
