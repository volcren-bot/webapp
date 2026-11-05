<script lang="ts" module>
	export const question = "What does running several scripts at once cost?"
	export const order = 8
</script>

<script lang="ts">
	import FaqAnswer from "#lib/components/FaqAnswer.svelte"
	import { fmt } from "#lib/format.svelte.js"
	import { CREDITS_PER_CENT } from "#lib/credits"

	const { data } = $props()
	const eur = (times: number) => fmt.eur((times * data.extraSessionFee) / CREDITS_PER_CENT)
</script>

<FaqAnswer {question}>
	Each script you run pays its own price per minute. Your first running script pays nothing more. Every extra
	script running at the same time on your account adds a fee of {fmt.credits(data.extraSessionFee)} ({eur(1)})
	per 30 days of running: two scripts at once add {eur(1)} a month, three add {eur(2)}, five add {eur(4)}, ten
	add {eur(9)}. The fee accrues per minute and is charged a whole credit at a time, so a short run only pays
	its share, and it follows your running scripts: when the oldest one stops, the next one becomes the free
	one. It applies to free scripts too, and you need at least a credit of balance to start an extra script.
	Testers and script authors pay no fee.
</FaqAnswer>
