<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import { invalidateAll } from "$app/navigation"
	import { onMount } from "svelte"
	import { formatCredits } from "#lib/utils"

	const { data } = $props()

	const payment = $derived(data.payment)
	const invoice = $derived(data.invoice)

	let selected = $state(0)
	let now = $state(Date.now())
	let copied = $state(false)

	// Counts down from the seconds Bitcart reported at load time
	const deadline = $derived(Date.now() + (invoice?.secondsLeft ?? 0) * 1000)
	const secondsLeft = $derived(Math.max(0, Math.round((deadline - now) / 1000)))
	const method = $derived(invoice?.methods[selected])

	const pending = $derived(payment.status === "pending" && secondsLeft > 0)

	onMount(() => {
		const tick = setInterval(() => (now = Date.now()), 1000)
		// Re-runs the load, which asks Bitcart for the status again
		const poll = setInterval(() => pending && invalidateAll(), 5000)
		return () => {
			clearInterval(tick)
			clearInterval(poll)
		}
	})

	async function copy(text: string) {
		await navigator.clipboard.writeText(text)
		copied = true
		setTimeout(() => (copied = false), 1500)
	}

	const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
</script>

<Head title="Payment" description="Pay an invoice." noindex />

<main class="mx-auto my-6 flex w-full max-w-3xl flex-col">
	<header class="my-8 flex flex-col">
		<h1 class="text-2xl font-bold">Add {formatCredits(payment.credits)}</h1>
		<p class="nv-dim">{payment.currency}</p>
	</header>

	{#if payment.status === "paid"}
		<section class="nv-float flex w-full flex-col">
			<span class="nv-title">paid</span>
			<p class="text-success-400">Your {formatCredits(payment.credits)} have been added to your balance.</p>
			<a class="btn my-2 mr-auto" href="/credits">back to balance</a>
		</section>
	{:else if payment.status === "expired" || payment.status === "invalid" || !pending}
		<section class="nv-float flex w-full flex-col">
			<span class="nv-title">{payment.status === "invalid" ? "invalid" : "expired"}</span>
			<p class="nv-dim">
				This invoice can no longer be paid. If you already sent a payment, contact support.
			</p>
			<a class="btn my-2 mr-auto" href="/credits">new payment</a>
		</section>
	{:else if method}
		<section class="nv-float flex w-full flex-col">
			<span class="nv-title">pay with</span>

			<div class="my-3 flex gap-2">
				{#each invoice!.methods as m, i (m.id)}
					<button class="btn" class:opacity-50={i !== selected} onclick={() => (selected = i)}>
						{m.name}
					</button>
				{/each}
			</div>

			{#if invoice!.exception !== "none"}
				<small class="text-warning-400">
					Payment issue: {invoice!.exception.replaceAll("_", " ")}. Send the remaining amount to the same
					address.
				</small>
			{/if}

			<div class="my-3 flex flex-col items-center gap-3">
				<a href={method.uri} title="Open in wallet">
					<img
						class="rounded bg-white"
						src={method.qr}
						alt="{method.name} payment QR code"
						width="256"
						height="256"
					/>
				</a>
				<p class="text-lg font-bold">{method.amount} {method.currency}</p>
				<p class="nv-dim">{method.rate}</p>
			</div>

			<label class="label my-3">
				<span class="label-text">address</span>
				<div class="flex gap-2">
					<input class="input" readonly value={method.address} onclick={(e) => e.currentTarget.select()} />
					<button class="btn" onclick={() => copy(method.address)}>{copied ? "copied" : "copy"}</button>
				</div>
			</label>

			<p class="nv-dim">
				Send exactly this amount. Expires in {clock(secondsLeft)}. This page updates by itself once the
				payment is detected.
			</p>
		</section>
	{/if}
</main>
