<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"
	import { bonusRate, MICROCREDITS_PER_CENT, MICROCREDITS_PER_CREDIT, microcreditsFor } from "#lib/credits"

	const { data, form } = $props()

	const presets = [5, 7, 12]

	let amount = $state(10)
	// Same rounding as the server: the invoice is created for whole cents
	const cents = $derived(Number.isFinite(amount) ? Math.round(amount * 100) : 0)
	const purchase = $derived(microcreditsFor(cents))
	const valid = $derived(cents >= data.limits.min && cents <= data.limits.max)
</script>

<Head title="Balance" description="Add funds to your account." noindex />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Balance</h1>
		<p class="nv-dim">{fmt.credits(data.microcredits, true)}</p>
	</header>

	<form class="nv-float flex flex-col gap-3 text-center" method="POST" use:enhance>
		<span class="nv-title">add funds</span>
		<div class="my-6">
			<p class="nv-dim">pay with crypto through bitcart.</p>
			<p class="font-bold">{fmt.credits(MICROCREDITS_PER_CREDIT)} = {fmt.eur(100, true)}</p>
		</div>
		{#if form?.message}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<div class="mx-auto flex w-full max-w-md flex-col gap-2">
			{#each presets as preset (preset)}
				<button type="button" class="btn w-full" onclick={() => (amount = preset)}>
					{fmt.credits(preset * MICROCREDITS_PER_CREDIT)}
				</button>
			{/each}
		</div>

		<label class="label mx-auto w-full max-w-md">
			<span class="label-text">CREDIT</span>
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

		<div class="mx-auto flex w-full max-w-md flex-col gap-1">
			{#if !valid}
				<small class="text-error-400">
					{#if cents > data.limits.max}
						maximum is {fmt.credits(data.limits.max * MICROCREDITS_PER_CENT)}
					{:else}
						minimum is {fmt.credits(data.limits.min * MICROCREDITS_PER_CENT)}
					{/if}
				</small>
			{/if}
			<dl
				class="grid w-full grid-cols-[1fr_auto] gap-x-6 rounded-md bg-(--tn-bg-dark) px-3 py-2 text-left"
				class:line-through={!valid}
				class:opacity-60={!valid}
			>
				<dt class="nv-dim">cost</dt>
				<dd class="text-right">{fmt.eur(cents, true)}</dd>
				<dt class="nv-dim">bonus ({fmt.percent(bonusRate(cents))})</dt>
				<dd class="text-right">
					+{fmt.credits(purchase.bonus)}
					<span class="nv-dim">≈ {fmt.eur(purchase.bonus / MICROCREDITS_PER_CENT, true)}</span>
				</dd>
				<dt class="nv-dim">you get</dt>
				<dd class="text-right font-bold text-success-400">{fmt.credits(purchase.total)}</dd>
			</dl>
		</div>

		<div class="nv-dim">
			<p class="my-4">
				paid script average costs {fmt.credits(data.averagePerMonth)} to run for 30 days
			</p>
			{#if data.extraSessionFee > 0}
				<p class="my-4">
					extra sessions are charged {fmt.credits(data.extraSessionFee)} extra per 30 days, read about
					<a href="/information/faq/what-does-running-several-scripts-at-once-cost">multiple sessions</a>
					for more information.
				</p>
			{/if}
			<p>all sales are final.</p>
			<p>refunds are not possible.</p>
		</div>

		<button type="submit" class="btn mx-auto mt-1 w-full max-w-md">pay</button>
	</form>

	{#if data.payments.length}
		<section class="nv-float">
			<span class="nv-title">recent payments</span>
			<ul class="flex flex-col gap-1">
				{#each data.payments as payment (payment.id)}
					<li
						class="flex flex-wrap justify-between gap-x-4"
						class:line-through={payment.status === "expired"}
						class:opacity-50={payment.status === "expired"}
					>
						<span class="nv-dim">{fmt.dateTime(payment.created_at)}</span>
						<span>
							{fmt.credits(payment.microcredits)}{#if payment.bonus}<span class="nv-dim">
									incl. {fmt.creditAmount(payment.bonus)} bonus</span
								>{/if}
							<span class="nv-dim">·</span>
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
