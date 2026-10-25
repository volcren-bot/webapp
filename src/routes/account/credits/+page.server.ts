import { fail, redirect } from "@sveltejs/kit"
import { createInvoice, CREDITS_PER_CENT, MAX_TOPUP_CENTS, MIN_TOPUP_CENTS } from "#lib/server/bitcart.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"

export const load = async ({ locals: { supabaseServer, user } }) => {
	if (!user) redirect(303, "/auth")

	const payments = supabaseServer.schema("payments")

	const [account, history] = await Promise.all([
		payments.from("accounts").select("credits, earnings").eq("user_id", user.id).maybeSingle(),
		payments
			.from("payments")
			.select("id, status, credits, amount, currency, created_at, paid_at")
			.order("created_at", { ascending: false })
			.limit(20)
	])

	return {
		credits: account.data?.credits ?? 0,
		earnings: account.data?.earnings ?? 0,
		payments: history.data ?? [],
		limits: { min: MIN_TOPUP_CENTS, max: MAX_TOPUP_CENTS }
	}
}

export const actions = {
	default: async ({ request, url: { origin }, locals: { user } }) => {
		if (!user) return fail(401, { message: "You need to login to add credits." })

		const eur = Number((await request.formData()).get("amount"))
		const cents = Math.round(eur * 100)

		if (!Number.isFinite(cents) || cents < MIN_TOPUP_CENTS || cents > MAX_TOPUP_CENTS) {
			return fail(400, {
				message: `Amount must be between ${MIN_TOPUP_CENTS / 100} and ${MAX_TOPUP_CENTS / 100} EUR.`
			})
		}

		const supabase = supabaseAdmin().schema("payments")
		const credits = cents * CREDITS_PER_CENT

		// The row id doubles as Bitcart's order_id; provider_id is filled in once the invoice exists
		const paymentId = crypto.randomUUID()

		let invoice
		try {
			invoice = await createInvoice({
				cents,
				orderId: paymentId,
				notificationUrl: `${origin}/api/bitcart`,
				redirectUrl: `${origin}/account/credits/${paymentId}`
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
			amount: cents
		})
		if (err) return fail(500, { message: errorRef("Could not record the payment", err) })

		redirect(303, `/account/credits/${paymentId}`)
	}
}
