import { getInvoice, type BitcartInvoice } from "#lib/server/bitcart.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"

/**
 * Asks Bitcart for the invoice's real status and applies it to our payment row: credits the
 * user when it's paid (settle_payment is idempotent) and marks expired/invalid ones.
 * Shared by the webhook and the checkout page, so a missed webhook doesn't lose a payment.
 */
export async function syncPayment(paymentId: string, invoiceId: string): Promise<BitcartInvoice> {
	const invoice = await getInvoice(invoiceId)
	const payments = supabaseAdmin().schema("payments")

	if (invoice.status === "paid" || invoice.status === "complete") {
		const { error } = await payments.rpc("settle_payment", { p_payment: paymentId })
		if (error) throw error
	} else if (invoice.status === "expired" || invoice.status === "invalid") {
		const { error } = await payments
			.from("payments")
			.update({ status: invoice.status })
			.eq("id", paymentId)
			.eq("status", "pending")
		if (error) throw error
	}

	return invoice
}
