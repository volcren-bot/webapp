import { getInvoice, type BitcartInvoice } from "#lib/server/bitcart.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"

const FEE_CACHE_MS = 60_000
let feeCache: { value: number; until: number } | null = null

/** payments.config.extra_session_fee: what every extra concurrent session costs per 30 days of running, in credits. Cached for a minute. */
export async function extraSessionFee() {
	if (feeCache && feeCache.until > Date.now()) return feeCache.value
	const { data, error } = await supabaseAdmin()
		.schema("payments")
		.from("config")
		.select("extra_session_fee")
		.single()
	if (error) {
		console.error("Could not load the extra session fee", error)
		return feeCache?.value ?? 0
	}
	feeCache = { value: data.extra_session_fee, until: Date.now() + FEE_CACHE_MS }
	return data.extra_session_fee
}

/** Asks Bitcart for the invoice's real status and applies it to our payment row, crediting once complete (settle_payment is idempotent); shared by webhook and checkout. */
export async function syncPayment(paymentId: string, invoiceId: string): Promise<BitcartInvoice> {
	const invoice = await getInvoice(invoiceId)
	const payments = supabaseAdmin().schema("payments")

	if (invoice.status === "complete") {
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

/** The user's payments that can still be paid; each pending one is checked with Bitcart first so stale ones drop out. */
export async function openPayments(userId: string) {
	const payments = supabaseAdmin().schema("payments")

	const { data, error } = await payments
		.from("payments")
		.select("id, provider_id, amount")
		.eq("user_id", userId)
		.eq("status", "pending")
		.order("created_at", { ascending: false })
	if (error) throw error

	const open = await Promise.all(
		data.map(async (payment) => {
			const invoice = await syncPayment(payment.id, payment.provider_id)
			return invoice.status === "pending" ? payment : null
		})
	)
	return open.filter((payment) => payment !== null)
}
