import { BITCART_API_URL, BITCART_API_TOKEN, BITCART_STORE_ID } from "$app/env/private"

export { CREDITS_PER_CENT, MAX_TOPUP_CENTS, MIN_TOPUP_CENTS } from "#lib/credits"
// Keep in sync with payments.limit_pending_payments (supabase/payments-pending-limit.sql)
export const MAX_PENDING_PAYMENTS = 3

export type BitcartStatus = "pending" | "paid" | "complete" | "expired" | "invalid"

/** One coin the invoice can be paid in. */
export interface BitcartPaymentMethod {
	id: string
	name: string
	currency: string
	amount: string
	rate_str: string
	payment_address: string
	/** Wallet URI (bitcoin:..., monero:...), not a web page. */
	payment_url: string
	lightning: boolean
}

export interface BitcartInvoice {
	id: string
	status: BitcartStatus
	/** "none" unless something is off, e.g. a partial payment. */
	exception_status: string
	order_id: string | null
	/** Seconds until the invoice expires. */
	time_left: number
	payments: BitcartPaymentMethod[]
}

async function bitcart<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(new URL(`/${path}`, BITCART_API_URL), {
		...init,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${BITCART_API_TOKEN}`,
			...init?.headers
		}
	})
	if (!res.ok) throw new Error(`Bitcart ${path} failed with ${res.status}: ${await res.text()}`)
	return res.json() as Promise<T>
}

export function createInvoice(opts: {
	cents: number
	orderId: string
	notificationUrl: string
	redirectUrl: string
}) {
	return bitcart<BitcartInvoice>("invoices", {
		method: "POST",
		body: JSON.stringify({
			store_id: BITCART_STORE_ID,
			price: opts.cents / 100,
			currency: "EUR",
			order_id: opts.orderId,
			notification_url: opts.notificationUrl,
			redirect_url: opts.redirectUrl
		})
	})
}

/** The webhook body is never trusted: the status always comes from asking Bitcart again. */
export const getInvoice = (id: string) => bitcart<BitcartInvoice>(`invoices/${encodeURIComponent(id)}`)
