import { error, redirect } from "@sveltejs/kit"
import QRCode from "qrcode"
import { syncPayment } from "#lib/server/payments.server"
import { errorRef } from "#lib/server/supabase.server"

export const load = async ({ params, locals: { supabaseServer, user } }) => {
	if (!user) redirect(303, "/auth")

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

	// syncPayment may have just settled or expired it
	const status = invoice.status === "paid" || invoice.status === "complete" ? "paid" : payment.status

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
				qr: await QRCode.toDataURL(method.payment_url, { margin: 1, width: 256 })
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
