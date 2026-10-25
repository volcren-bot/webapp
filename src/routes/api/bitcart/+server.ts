import { error, json } from "@sveltejs/kit"
import { syncPayment } from "#lib/server/payments.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"

// Bitcart notification_url target. The body only tells us which invoice changed;
// the status is re-fetched from Bitcart, so a forged request can't credit anyone.
export const POST = async ({ request }) => {
	const body = await request.json().catch(() => null)
	if (typeof body?.id !== "string") error(400, "Missing invoice id")

	const { data: payment } = await supabaseAdmin()
		.schema("payments")
		.from("payments")
		.select("id")
		.eq("provider", "bitcart")
		.eq("provider_id", body.id)
		.maybeSingle()

	// Not ours (or not recorded yet): 200 so Bitcart doesn't retry forever
	if (!payment) return json({ ok: true })

	await syncPayment(payment.id, body.id).catch((e) => error(502, errorRef("Failed to sync payment", e)))

	return json({ ok: true })
}
