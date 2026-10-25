<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import { enhance } from "$app/forms"

	const { data, form } = $props()

	// 10,000 credits = 1 EUR
	const eur = (credits: number) => (credits / 10_000).toFixed(2)
</script>

<Head title="Credits" description="Add credits to your account." noindex />

<main class="mx-auto my-6 flex w-full max-w-3xl flex-col">
	<header class="my-8 flex flex-col">
		<h1 class="text-2xl font-bold">Credits</h1>
		<p class="nv-dim">{data.credits.toLocaleString()} credits ({eur(data.credits)} EUR)</p>
	</header>

	<form class="nv-float flex w-full flex-col" method="POST" use:enhance>
		<span class="nv-title">add credits</span>
		<p class="nv-dim">Pay with crypto through Bitcart. 1 EUR = 10,000 credits.</p>

		{#if form?.message}
			<small class="text-error-400">{form.message}</small>
		{/if}

		<label class="label my-3">
			<span class="label-text">amount (EUR)</span>
			<input
				class="input"
				name="amount"
				type="number"
				step="0.01"
				min={data.limits.min / 100}
				max={data.limits.max / 100}
				value="10"
				required
			/>
		</label>

		<button type="submit" class="btn my-2 mr-auto">pay</button>
	</form>

	{#if data.payments.length}
		<section class="nv-float mt-6 flex w-full flex-col">
			<span class="nv-title">recent payments</span>
			<ul class="my-3 flex flex-col gap-1">
				{#each data.payments as payment (payment.id)}
					<li class="flex justify-between">
						<span>{new Date(payment.created_at).toLocaleString()}</span>
						<span>
							{(payment.amount / 100).toFixed(2)}
							{payment.currency} ·
							{#if payment.status === "pending"}
								<a class="underline" href="/account/credits/{payment.id}">pay</a>
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
