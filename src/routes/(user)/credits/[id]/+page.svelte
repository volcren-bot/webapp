<script lang="ts">
	import { clipboard } from "#lib/clipboard.svelte.js"
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { deserialize, enhance } from "$app/forms"
	import { invalidate } from "$app/navigation"
	import { onMount } from "svelte"

	type Eip1193 = { request(args: { method: string; params?: unknown[] }): Promise<unknown> }

	const { data, form } = $props()

	const payment = $derived(data.payment)
	const invoice = $derived(data.invoice)

	let selected = $state(0)
	let now = $state(Date.now())
	const clip = clipboard(1500)
	let ethereum = $state<Eip1193>()
	let paying = $state(false)
	let walletMessage = $state("")
	let walletHash = $state("")

	// Counts down from the seconds Bitcart reported at load time
	const deadline = $derived(Date.now() + (invoice?.secondsLeft ?? 0) * 1000)
	const secondsLeft = $derived(Math.max(0, Math.round((deadline - now) / 1000)))
	const method = $derived(invoice?.methods[selected])

	const pending = $derived(payment.status === "pending" && secondsLeft > 0)
	const confirming = $derived(payment.status === "confirming")

	onMount(() => {
		ethereum = (window as { ethereum?: Eip1193 }).ethereum
		const tick = setInterval(() => (now = Date.now()), 1000)
		// Re-runs only this page's load, which asks Bitcart for the status again
		const poll = setInterval(() => (pending || confirming) && invalidate("payment:status"), 5000)
		return () => {
			clearInterval(tick)
			clearInterval(poll)
		}
	})

	type Method = NonNullable<typeof invoice>["methods"][number]

	async function registerSender(methodId: string, address: string) {
		const body = new FormData()
		body.set("method", methodId)
		body.set("address", address)
		const res = await fetch("?/sender", { method: "POST", body, headers: { "x-sveltekit-action": "true" } })
		const result = deserialize(await res.text())
		if (result.type === "failure")
			throw new Error(String(result.data?.senderMessage ?? "Could not set the sending address."))
		if (result.type !== "success") throw new Error("Could not set the sending address.")
	}

	async function payWithWallet(m: Method) {
		if (!ethereum || !m.transaction) return
		paying = true
		walletMessage = ""
		walletHash = ""
		try {
			const [from] = (await ethereum.request({ method: "eth_requestAccounts" })) as string[]
			if (!from) throw new Error("Your wallet didn't share an account.")
			if (m.sender && m.sender.toLowerCase() !== from.toLowerCase())
				throw new Error(
					`This invoice only detects payments from ${m.sender}. Switch to that account in your wallet.`
				)
			if (!m.sender) {
				await registerSender(m.id, from)
				await invalidate("payment:status")
			}
			const { chainId, ...tx } = m.transaction
			if ((await ethereum.request({ method: "eth_chainId" })) !== chainId)
				await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] })
			walletHash = (await ethereum.request({
				method: "eth_sendTransaction",
				params: [{ from, ...tx }]
			})) as string
		} catch (e) {
			const err = e as { code?: number; message?: string }
			walletMessage =
				err.code === 4001 ? "You cancelled it in your wallet." : (err.message ?? "The wallet failed.")
		} finally {
			paying = false
		}
	}

	const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
</script>

<Head title="Payment" description="Pay an invoice." noindex />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/credits" class="nv-dim">← balance</a>
		<h1 class="text-2xl font-bold">Add {fmt.credits(payment.credits)}</h1>
		<p class="nv-dim">{payment.currency}</p>
	</header>

	{#if payment.status === "paid"}
		<section class="nv-float flex flex-col items-start gap-3">
			<span class="nv-title">paid</span>
			<p class="text-success-400">Your {fmt.credits(payment.credits)} have been added to your balance.</p>
			<a class="btn" href="/credits">back to balance</a>
		</section>
	{:else if confirming}
		<section class="nv-float flex flex-col items-start gap-3">
			<span class="nv-title">confirming</span>
			<p class="nv-dim">
				Your payment was received and is waiting for network confirmations. Your
				{fmt.credits(payment.credits)} are added once it's confirmed, which can take a while depending on the currency.
				You can leave this page.
			</p>
			<a class="btn" href="/credits">back to balance</a>
		</section>
	{:else if payment.status === "expired" || payment.status === "invalid" || !pending}
		<section class="nv-float nv-danger flex flex-col items-start gap-3">
			<span class="nv-title">{payment.status === "invalid" ? "invalid" : "expired"}</span>
			<p class="nv-dim">
				This invoice can no longer be paid. If you already sent a payment, contact support.
			</p>
			<a class="btn" href="/credits">new payment</a>
		</section>
	{:else if method}
		<section class="nv-float flex flex-col gap-3">
			<span class="nv-title">pay with</span>

			<div class="flex flex-wrap gap-2" role="group" aria-label="Payment method">
				{#each invoice!.methods as m, i (m.id)}
					<button
						class="btn"
						aria-pressed={i === selected}
						onclick={() => ((selected = i), (walletMessage = ""), (walletHash = ""))}
					>
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

			{#if method.needsSender && !method.sender}
				<form method="POST" action="?/sender" class="label" use:enhance>
					<input type="hidden" name="method" value={method.id} />
					<label for="pay-sender" class="label-text">your sending address</label>
					<div class="flex gap-2">
						<input
							id="pay-sender"
							name="address"
							class="input min-w-0 grow"
							required
							pattern={"0x[0-9a-fA-F]{40}"}
							placeholder="0x…"
							autocomplete="off"
							spellcheck="false"
						/>
						<button class="btn">set</button>
					</div>
					<small class="nv-dim">
						{method.symbol} payments are matched by the address they're sent from, so set the one you'll pay from
						first. It can't be changed. Payments sent from an exchange account aren't detected.
					</small>
					{#if form?.senderMessage}<small class="text-error-400">{form.senderMessage}</small>{/if}
				</form>
			{:else}
				<div class="flex flex-col items-center gap-2 py-2">
					<a href={method.uri} title="Open in wallet">
						<img
							class="rounded bg-white"
							src={method.qr}
							alt="{method.name} payment QR code"
							width="256"
							height="256"
						/>
					</a>
					<p class="text-lg font-bold">{method.amount} {method.symbol}</p>
					<p class="nv-dim">
						Exchange rate: 1 {method.symbol} = {fmt.number(method.rate, { maximumFractionDigits: 2 })}€
					</p>
				</div>

				<div class="label">
					<label for="pay-address" class="label-text">address</label>
					<div class="flex gap-2">
						<input
							id="pay-address"
							class="input min-w-0 grow"
							readonly
							value={method.address}
							onclick={(e) => e.currentTarget.select()}
						/>
						<button class="btn" onclick={() => clip.copy(method.address)}
							>{clip.copied === method.address ? "copied" : "copy"}</button
						>
					</div>
				</div>
				{#if method.sender}
					<p class="nv-dim">
						Send from <span class="break-all text-(--tn-fg)">{method.sender}</span>; payments from other
						addresses aren't detected.
					</p>
				{/if}
			{/if}

			{#if ethereum && method.transaction}
				<div class="flex flex-col items-start gap-2">
					<button class="btn" disabled={paying} onclick={() => payWithWallet(method)}>
						{paying ? "check your wallet" : "pay with browser wallet"}
					</button>
					{#if walletMessage}<small class="text-error-400">{walletMessage}</small>{/if}
					{#if walletHash}
						<small class="break-all text-success-400"
							>Sent: {walletHash}. This page updates once it's detected.</small
						>
					{/if}
				</div>
			{/if}

			<p class="nv-dim">
				Send exactly this amount. Expires in <span class="text-(--tn-fg)">{clock(secondsLeft)}</span>. This
				page updates by itself once the payment is detected.
			</p>
		</section>
	{/if}
</section>
