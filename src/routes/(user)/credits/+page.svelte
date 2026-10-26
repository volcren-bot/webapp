<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"
	import { formatCredits } from "#lib/utils"
	import { bonusRate, creditsFor, CREDITS_PER_CENT, CREDITS_PER_EUR, MAX_BONUS } from "#lib/credits"

	const { data, form } = $props()

	const presets = [5, 7, 12]

	let amount = $state(10)
	const credits = $derived(Number.isFinite(amount) ? Math.round(amount * CREDITS_PER_EUR) : "")

	// Same rounding as the server: the invoice is created for whole cents
	const cents = $derived(Number.isFinite(amount) ? Math.round(amount * 100) : 0)
	const purchase = $derived(creditsFor(cents))
	const valid = $derived(cents >= data.limits.min && cents <= data.limits.max)
</script>

<Head title="Balance" description="Add funds to your account." noindex />

<main class="mx-auto my-6 flex w-full max-w-3xl flex-col">
	<header class="my-8 flex flex-col">
		<h1 class="text-2xl font-bold">Balance</h1>
		<p class="nv-dim">{fmt.credits(data.credits)}</p>
	</header>

	<form class="nv-float flex w-full flex-col" method="POST" use:enhance>
		<span class="nv-title">add funds</span>
		<p class="nv-dim">Pay with crypto through Bitcart.</p>
		<p class="my-2 font-semibold">{fmt.credits(CREDITS_PER_EUR)} = {fmt.eur(100)}</p>

		{#if form?.message}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<div class="my-3 flex flex-wrap gap-2">
			{#each presets as preset (preset)}
				<button type="button" class="btn" onclick={() => (amount = preset)}>
					{fmt.credits(preset * CREDITS_PER_EUR)} · {fmt.eur(preset * 100)}
				</button>
			{/each}
		</div>

		<div class="my-3 grid gap-3 sm:grid-cols-2">
			<label class="label">
				<span class="label-text">credits</span>
				<input
					class="input"
					type="number"
					step="100"
					min={data.limits.min * CREDITS_PER_CENT}
					max={data.limits.max * CREDITS_PER_CENT}
					value={credits}
					oninput={(e) => (amount = e.currentTarget.valueAsNumber / CREDITS_PER_EUR)}
				/>
			</label>
			<label class="label">
				<span class="label-text">amount (EUR)</span>
				<input
					class="input"
					name="amount"
					type="number"
					step="0.01"
					min={data.limits.min / 100}
					max={data.limits.max / 100}
					bind:value={amount}
					required
				/>
			</label>
		</div>

		<p class="nv-dim">
			The average paid script costs about {fmt.credits(data.averagePerMonth)}
			(≈ {fmt.eur(data.averagePerMonth / CREDITS_PER_CENT)}) to run 24/7 for 30 days.
		</p>
		<small class="nv-dim">All sales are final. Refunds are not possible.</small>

		{#if valid}
			<dl class="nv-dim my-4 grid max-w-sm grid-cols-[1fr_auto] gap-x-6">
				<dt>Cost</dt>
				<dd class="text-right">{fmt.eur(cents)}</dd>
				<dt>Credits</dt>
				<dd class="text-right font-semibold">{fmt.credits(purchase.total)}</dd>
				<dt>Bonus ({fmt.percent(bonusRate(cents))})</dt>
				<dd class="text-right">
					+{fmt.credits(purchase.bonus)} (≈ {fmt.eur(purchase.bonus / CREDITS_PER_CENT)})
				</dd>
			</dl>
		{/if}

		<button type="submit" class="btn my-2 mr-auto">Pay</button>
	</form>

	{#if data.payments.length}
		<section class="nv-float mt-6 flex w-full flex-col">
			<span class="nv-title">recent payments</span>
			<ul class="my-3 flex flex-col gap-1">
				{#each data.payments as payment (payment.id)}
					<li class="flex justify-between">
						<span>{fmt.dateTime(payment.created_at)}</span>
						<span>
							{fmt.credits(payment.credits)}{payment.bonus ? ` incl. ${fmt.number(payment.bonus)} bonus` : ""} ({fmt.eur(
								payment.amount
							)}) ·
							{#if payment.status === "pending"}
								<a class="underline" href="/credits/{payment.id}">pay</a>
							{:else}
								{payment.status}
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>
