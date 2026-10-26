import { fail, redirect } from "@sveltejs/kit"
import {
	createInvoice,
	MAX_PENDING_PAYMENTS,
	MAX_TOPUP_CENTS,
	MIN_TOPUP_CENTS
} from "#lib/server/bitcart.server"
import { openPayments } from "#lib/server/payments.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { creditsFor } from "#lib/credits"
import { one } from "#lib/utils"

const MINUTES_PER_MONTH = 30 * 24 * 60

export const load = async ({ locals: { supabaseServer, user } }) => {
	if (!user) redirect(303, "/auth")

	const payments = supabaseServer.schema("payments")

	const [account, history, prices] = await Promise.all([
		payments.from("accounts").select("credits, earnings").eq("user_id", user.id).maybeSingle(),
		payments
			.from("payments")
			.select("id, status, credits, bonus, amount, currency, created_at, paid_at")
			.order("created_at", { ascending: false })
			.limit(20),
		// Only paid, published scripts: free ones would drag the average down
		supabaseAdmin()
			.schema("scripts")
			.from("scripts")
			.select("metadata!inner(price)")
			.eq("published", true)
			.gt("metadata.price", 0)
	])

	if (prices.error) console.error("Could not load script prices", prices.error)

	const paid = (prices.data ?? []).flatMap((s) => one(s.metadata)?.price ?? [])
	const averagePerMonth = paid.length
		? Math.round((paid.reduce((sum, price) => sum + price, 0) / paid.length) * MINUTES_PER_MONTH)
		: 0

	return {
		credits: account.data?.credits ?? 0,
		earnings: account.data?.earnings ?? 0,
		payments: history.data ?? [],
		averagePerMonth,
		limits: { min: MIN_TOPUP_CENTS, max: MAX_TOPUP_CENTS }
	}
}

export const actions = {
	default: async ({ request, url: { origin }, locals: { user } }) => {
		if (!user) return fail(401, { message: "You need to login to add funds." })

		const eur = Number((await request.formData()).get("amount"))
		const cents = Math.round(eur * 100)

		if (!Number.isFinite(cents) || cents < MIN_TOPUP_CENTS || cents > MAX_TOPUP_CENTS) {
			return fail(400, {
				message: `Amount must be between €${MIN_TOPUP_CENTS / 100} and €${MAX_TOPUP_CENTS / 100}.`
			})
		}

		const supabase = supabaseAdmin().schema("payments")

		let open
		try {
			open = await openPayments(user.id)
		} catch (e) {
			return fail(502, { message: errorRef("Could not check your open invoices", e) })
		}

		// Same amount as an invoice that's still payable: send them back to it instead of making another
		const existing = open.find((payment) => payment.amount === cents)
		if (existing) redirect(303, `/credits/${existing.id}`)

		if (open.length >= MAX_PENDING_PAYMENTS) {
			return fail(429, {
				message: `You already have ${open.length} unpaid invoices. Pay or wait for one to expire before creating another.`
			})
		}

		const { total: credits, bonus } = creditsFor(cents)

		// The row id doubles as Bitcart's order_id; provider_id is filled in once the invoice exists
		const paymentId = crypto.randomUUID()

		let invoice
		try {
			invoice = await createInvoice({
				cents,
				orderId: paymentId,
				notificationUrl: `${origin}/api/bitcart`,
				redirectUrl: `${origin}/credits/${paymentId}`
			})
		} catch (e) {
			return fail(502, { message: errorRef("Could not create the invoice", e) })
		}

		const { error: err } = await supabase.from("payments").insert({
			id: paymentId,
			user_id: user.id,
			provider: "bitcart",
			provider_id: invoice.id,
			credits,
			bonus,
			amount: cents
		})
		// 23514 is the database-side limit, which also catches simultaneous requests
		if (err?.code === "23514") {
			return fail(429, { message: "You already have too many unpaid invoices. Wait for one to expire." })
		}
		if (err) return fail(500, { message: errorRef("Could not record the payment", err) })

		redirect(303, `/credits/${paymentId}`)
	}
}
