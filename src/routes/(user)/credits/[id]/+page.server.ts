import { error, redirect } from "@sveltejs/kit"
import QRCode from "qrcode"
import { syncPayment } from "#lib/server/payments.server"
import { errorRef } from "#lib/server/supabase.server"

// The page polls this load every few seconds and a pending invoice keeps its addresses, so each QR code
// is only drawn once. Capped so old invoices don't pile up.
const MAX_CACHED_QRS = 500
const qrCodes = new Map<string, Promise<string>>()

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

	// syncPayment may have just settled or expired it. A paid invoice is still waiting for
	// confirmations, so it isn't credited yet.
	const status =
		invoice.status === "complete" ? "paid" : invoice.status === "paid" ? "confirming" : payment.status

	const methods = await Promise.all(
		invoice.payments
			.filter((method) => !method.lightning)
			.map(async (method) => ({
				id: method.id,
				name: method.name,
				amount: method.amount,
				currency: method.currency.toUpperCase(),
				rate: method.rate_str,
				address: method.payment_address,
				uri: method.payment_url,
				qr: await qrCode(method.payment_url)
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
