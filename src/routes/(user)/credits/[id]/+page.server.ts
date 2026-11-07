import { error, fail, redirect } from "@sveltejs/kit"
import QRCode from "qrcode"
import {
	BitcartError,
	getInvoice,
	setSenderAddress,
	type BitcartPaymentMethod
} from "#lib/server/bitcart.server"
import { syncPayment } from "#lib/server/payments.server"
import { errorRef } from "#lib/server/supabase.server"

// The page polls this load and a pending invoice keeps its addresses, so each QR code is drawn once and capped so old invoices don't pile up.
const MAX_CACHED_QRS = 500
const qrCodes = new Map<string, Promise<string>>()
const DEFAULT_SYMBOL = "DAI"
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
// ERC-20 transfer(address,uint256)
const TRANSFER_SELECTOR = "a9059cbb"

function qrCode(uri: string) {
	let qr = qrCodes.get(uri)
	if (!qr) {
		if (qrCodes.size >= MAX_CACHED_QRS) qrCodes.delete(qrCodes.keys().next().value!)
		qr = QRCode.toDataURL(uri, { margin: 1, width: 256 })
		qr.catch(() => qrCodes.delete(uri))
		qrCodes.set(uri, qr)
	}
	return qr
}

/** "1.5" with 18 decimals is 1500000000000000000n; null for anything that isn't a plain decimal. */
function toUnits(amount: string, decimals: number): bigint | null {
	const parts = /^(\d+)(?:\.(\d+))?$/.exec(amount)
	if (!parts || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) return null
	const fraction = (parts[2] ?? "").replace(/0+$/, "")
	if (fraction.length > decimals) return null
	return BigInt(parts[1] + fraction.padEnd(decimals, "0"))
}

const word = (hex: string) => hex.padStart(64, "0")

/** The transaction a browser wallet sends to pay what is due, or null when the method isn't an EVM one we can build it for. */
function walletTransaction(method: BitcartPaymentMethod) {
	if (
		!method.chain_id ||
		!method.wallet?.sender_address_required ||
		!EVM_ADDRESS.test(method.payment_address)
	)
		return null
	const units = toUnits(method.due, method.divisibility)
	if (!units) return null
	const chainId = `0x${method.chain_id.toString(16)}`
	if (!method.contract) return { chainId, to: method.payment_address, value: `0x${units.toString(16)}` }
	if (!EVM_ADDRESS.test(method.contract)) return null
	const data = `0x${TRANSFER_SELECTOR}${word(method.payment_address.slice(2).toLowerCase())}${word(units.toString(16))}`
	return { chainId, to: method.contract, value: "0x0", data }
}

export const load = async ({ params, depends, locals: { supabaseServer, user } }) => {
	if (!user) redirect(303, "/auth")
	// The page polls with this instead of invalidateAll, so the layout's loads don't re-run with it
	depends("payment:status")

	// RLS only returns the user's own payments
	const { data: payment } = await supabaseServer
		.schema("payments")
		.from("payments")
		.select("id, provider_id, status, credits, amount, currency")
		.eq("id", params.id)
		.maybeSingle()

	if (!payment) error(404, "Payment not found")

	// Only talk to Bitcart while it can still change
	if (payment.status !== "pending") return { payment, invoice: null }

	const invoice = await syncPayment(payment.id, payment.provider_id).catch((e) =>
		error(502, errorRef("Could not load the invoice", e))
	)

	// syncPayment may have just settled or expired it; a paid invoice still waits for confirmations, so it isn't credited yet.
	const status =
		invoice.status === "complete" ? "paid" : invoice.status === "paid" ? "confirming" : payment.status

	const methods = await Promise.all(
		invoice.payments
			.filter((method) => !method.lightning)
			.map((method) => ({ method, symbol: method.symbol.toUpperCase() }))
			// The page selects the first method, so the stablecoin leads
			.sort((a, b) => Number(b.symbol === DEFAULT_SYMBOL) - Number(a.symbol === DEFAULT_SYMBOL))
			.map(async ({ method, symbol }) => ({
				id: method.id,
				name: method.name,
				amount: method.amount,
				symbol,
				rate: Number(method.rate),
				address: method.payment_address,
				uri: method.payment_url,
				qr: await qrCode(method.payment_url),
				needsSender: method.wallet?.sender_address_required ?? false,
				sender: method.user_address,
				transaction: walletTransaction(method)
			}))
	)

	return {
		payment: { ...payment, status },
		invoice: {
			status: invoice.status,
			exception: invoice.exception_status,
			secondsLeft: invoice.time_left,
			methods
		}
	}
}

export const actions = {
	sender: async ({ params, request, locals: { supabaseServer, user } }) => {
		if (!user) return fail(401, { senderMessage: "You need to login." })

		const data = await request.formData()
		const methodId = String(data.get("method") ?? "")
		const address = String(data.get("address") ?? "").trim()
		if (!EVM_ADDRESS.test(address))
			return fail(400, { senderMessage: "Enter a 0x address with 40 hex characters." })

		// RLS only returns the user's own payments
		const { data: payment } = await supabaseServer
			.schema("payments")
			.from("payments")
			.select("provider_id, status")
			.eq("id", params.id)
			.maybeSingle()
		if (!payment) return fail(404, { senderMessage: "Payment not found." })
		if (payment.status !== "pending")
			return fail(409, { senderMessage: "This invoice can no longer be paid." })

		try {
			const invoice = await getInvoice(payment.provider_id)
			const method = invoice.payments.find((m) => m.id === methodId)
			if (!method?.wallet?.sender_address_required)
				return fail(400, { senderMessage: "Pick a payment method." })
			if (method.user_address) return fail(409, { senderMessage: "A sending address is already set." })
			await setSenderAddress(payment.provider_id, methodId, address)
		} catch (e) {
			if (e instanceof BitcartError && e.status === 422)
				return fail(422, { senderMessage: "That address was not accepted." })
			return fail(502, { senderMessage: errorRef("Could not set the sending address", e) })
		}
		return { senderSet: true }
	}
}
