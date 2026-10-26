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

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Balance</h1>
		<p class="nv-dim">{fmt.credits(data.credits)}</p>
	</header>

	<form class="nv-float flex flex-col gap-3 text-center" method="POST" use:enhance>
		<span class="nv-title">add funds</span>
		<p>
			<span class="nv-dim">Pay with crypto through Bitcart.</span>
			<span class="font-bold">{fmt.credits(CREDITS_PER_EUR)} = {fmt.eur(100)}</span>
		</p>

		{#if form?.message}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<div class="mx-auto flex w-full max-w-md flex-col gap-2">
			{#each presets as preset (preset)}
				<button type="button" class="btn w-full" onclick={() => (amount = preset)}>
					{fmt.credits(preset * CREDITS_PER_EUR)} · {fmt.eur(preset * 100)}
				</button>
			{/each}
		</div>

		<div class="mx-auto grid w-full max-w-md grid-cols-1 gap-3">
			<label class="label">
				<span class="label-text">credits</span>
				<input
					class="input text-center"
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
					class="input text-center"
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

		{#if valid}
			<dl class="mx-auto grid w-full max-w-md grid-cols-[1fr_auto] gap-x-6 rounded-md bg-(--tn-bg-dark) px-3 py-2">
				<dt class="nv-dim">cost</dt>
				<dd class="text-right">{fmt.eur(cents)}</dd>
				<dt class="nv-dim">bonus ({fmt.percent(bonusRate(cents))})</dt>
				<dd class="text-right">
					+{fmt.credits(purchase.bonus)}
					<span class="nv-dim">≈ {fmt.eur(purchase.bonus / CREDITS_PER_CENT)}</span>
				</dd>
				<dt class="nv-dim">you get</dt>
				<dd class="text-right font-bold text-(--tn-green)">{fmt.credits(purchase.total)}</dd>
			</dl>
		{/if}

		<p class="nv-dim">
			The average paid script costs about {fmt.credits(data.averagePerMonth)}
			(≈ {fmt.eur(data.averagePerMonth / CREDITS_PER_CENT)}) to run 24/7 for 30 days. All sales are final.
			Refunds are not possible.
		</p>

		<button type="submit" class="btn mx-auto mt-1 w-full max-w-md">pay</button>
	</form>

	{#if data.payments.length}
		<section class="nv-float">
			<span class="nv-title">recent payments</span>
			<ul class="flex flex-col gap-1">
				{#each data.payments as payment (payment.id)}
					<li class="flex flex-wrap justify-between gap-x-4" class:line-through={payment.status === "expired"} class:opacity-50={payment.status === "expired"}>
						<span class="nv-dim">{fmt.dateTime(payment.created_at)}</span>
						<span>
							{fmt.credits(payment.credits)}{#if payment.bonus}<span class="nv-dim">
									incl. {fmt.number(payment.bonus)} bonus</span
								>{/if}
							<span class="nv-dim">({fmt.eur(payment.amount)}) ·</span>
							{#if payment.status === "pending"}
								<a href="/credits/{payment.id}">pay</a>
							{:else}
								{payment.status}
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>
