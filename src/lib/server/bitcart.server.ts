import { BITCART_API_URL, BITCART_API_TOKEN, BITCART_STORE_ID } from "$app/env/private"

// Keep in sync with payments.limit_pending_payments (supabase/payments-pending-limit.sql)
export const MAX_PENDING_PAYMENTS = 3

type BitcartStatus = "pending" | "paid" | "complete" | "expired" | "invalid"

/** One coin the invoice can be paid in. */
export interface BitcartPaymentMethod {
	id: string
	name: string
	/** The chain's coin: "eth" for an ERC-20 token. */
	currency: string
	/** What is paid: the token for a token method ("dai"), else the coin. */
	symbol: string
	amount: string
	/** What is still owed after partial payments, in the same unit as amount. */
	due: string
	/** Decimal places of the coin or token: 18 for ETH and DAI. */
	divisibility: number
	/** The token contract, or null for the chain's own coin. */
	contract: string | null
	/** EVM chain from the ethereum: URI, e.g. 1 for mainnet; absent for other coins. */
	chain_id?: number | null
	/** The sender address registered for this method; Bitcart matches EVM payments only by it. */
	user_address: string | null
	wallet: { sender_address_required: boolean } | null
	/** EUR for one coin or token, as a decimal string. */
	rate: string
	payment_address: string
	/** Wallet URI (bitcoin:..., monero:..., ethereum:...), not a web page. */
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
	if (!res.ok)
		throw new BitcartError(res.status, `Bitcart ${path} failed with ${res.status}: ${await res.text()}`)
	return res.json() as Promise<T>
}

export class BitcartError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message)
	}
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

/** Registers the address the customer pays from; Bitcart rejects a second one with 422. */
export const setSenderAddress = (invoiceId: string, methodId: string, address: string) =>
	bitcart<boolean>(`invoices/${encodeURIComponent(invoiceId)}/details`, {
		method: "PATCH",
		body: JSON.stringify({ id: methodId, address })
	})
