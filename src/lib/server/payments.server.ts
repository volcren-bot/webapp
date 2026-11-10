import { getInvoice, type BitcartInvoice } from "#lib/server/bitcart.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"

const CONFIG_CACHE_MS = 60_000
type PaymentsConfig = { extraSessionFee: number; authorShare: number }
let configCache: { value: PaymentsConfig; until: number } | null = null

/** payments.config, cached for a minute; on a failed read the last value, or null if there is none. */
async function paymentsConfig() {
	if (configCache && configCache.until > Date.now()) return configCache.value
	const { data, error } = await supabaseAdmin()
		.schema("payments")
		.from("config")
		.select("extra_session_fee, platform_fee_bps")
		.single()
	if (error) {
		console.error("Could not load payments.config", error)
		return configCache?.value ?? null
	}
	const value = {
		extraSessionFee: data.extra_session_fee,
		authorShare: (10_000 - data.platform_fee_bps) / 10_000
	}
	configCache = { value, until: Date.now() + CONFIG_CACHE_MS }
	return value
}

/** payments.config.extra_session_fee: what every extra concurrent session costs per 30 days of running, in microcredits. */
export const extraSessionFee = async () => (await paymentsConfig())?.extraSessionFee ?? 0

/** The author's fraction of a script's usage charge, from payments.config.platform_fee_bps; null if it can't be read. */
export const authorShare = async () => (await paymentsConfig())?.authorShare ?? null

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
