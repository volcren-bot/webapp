<script lang="ts" module>
	export const question = "What does running several scripts at once cost?"
	export const order = 8
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
	import { fmt } from "#lib/format.svelte.js"

	const { data } = $props()
	const credits = (times: number) => fmt.credits(times * data.extraSessionFee)
</script>

<FaqAnswer {question}>
	Each script you run pays its own price per minute. Your first running script pays nothing more. Every extra
	script running at the same time on your account adds a fee of {credits(1)}
	per 30 days of running: two scripts at once add {credits(1)} a month, three add {credits(2)}, five add {credits(
		4
	)}, ten add {credits(9)}. The fee accrues per minute and is charged a whole credit at a time, so a short run
	only pays its share, and it follows your running scripts: when the oldest one stops, the next one becomes
	the free one. It applies to free scripts too, and you need at least a credit of balance to start an extra
	script. Testers and script authors pay no fee.
</FaqAnswer>
