import { fail, redirect } from "@sveltejs/kit"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"

export const load = async ({ locals: { user, getProfile } }) => {
	if (!user) redirect(303, "/auth")
	const profile = await getProfile()
	if (profile?.role !== "administrator") redirect(303, "/")

	const admin = supabaseAdmin()
	const { data: ledger } = await admin
		.schema("payments")
		.from("credits_ledger")
		.select("id, user_id, amount, balance_after, note, granted_by, created_at")
		.eq("kind", "adjustment")
		.order("id", { ascending: false })
		.limit(50)

	const ids = [...new Set((ledger ?? []).flatMap((row) => [row.user_id, row.granted_by ?? []].flat()))]
	const { data: profiles } = ids.length
		? await admin.schema("profiles").from("profiles").select("id, username").in("id", ids)
		: { data: [] }
	const names = new Map((profiles ?? []).map((p) => [p.id, p.username]))

	return {
		adjustments: (ledger ?? []).map((row) => ({
			...row,
			user: names.get(row.user_id) ?? row.user_id,
			admin: row.granted_by ? (names.get(row.granted_by) ?? row.granted_by) : null
		}))
	}
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const actions = {
	adjust: async ({ request, locals: { user, getProfile } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const profile = await getProfile()
		if (profile?.role !== "administrator") return fail(403, { message: "Administrators only." })

		const data = await request.formData()
		const userId = String(data.get("user") ?? "").trim()
		const amount = Number(data.get("amount"))
		const note = String(data.get("note") ?? "").trim()

		if (!UUID.test(userId)) return fail(400, { message: "Enter a valid user UUID." })
		if (!Number.isSafeInteger(amount) || amount === 0) {
			return fail(400, { message: "Credits must be a whole number other than 0." })
		}
		if (!note) return fail(400, { message: "A note is required." })

		const admin = supabaseAdmin()
		const { data: target, error: lookup } = await admin
			.schema("profiles")
			.from("profiles")
			.select("id, username")
			.eq("id", userId)
			.maybeSingle()
		if (lookup) return fail(500, { message: errorRef("Could not look up the user", lookup) })
		if (!target) return fail(404, { message: `No user with the UUID ${userId}.` })

		const { data: balance, error: err } = await admin.schema("payments").rpc("adjust_credits", {
			p_admin: user.id,
			p_user: target.id,
			p_amount: amount,
			p_note: note
		})
		// 23514 is the account check: removing more credits than the user has
		if (err?.code === "23514")
			return fail(400, { message: `${target.username} doesn't have that many credits.` })
		if (err) return fail(500, { message: errorRef("Could not adjust the credits", err) })

		return {
			message: `Done: ${target.username} now has ${balance.toLocaleString("en-US")} credits.`,
			ok: true
		}
	},

	// Signs this browser in as another user, replacing the admin's own session
	impersonate: async ({ request, locals: { user, getProfile, supabaseServer, resetSession } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const profile = await getProfile()
		if (profile?.role !== "administrator") return fail(403, { message: "Administrators only." })

		const data = await request.formData()
		const userId = String(data.get("user") ?? "").trim()
		if (!UUID.test(userId)) return fail(400, { message: "Enter a valid user UUID.", login: true })

		const admin = supabaseAdmin()
		const { data: target, error: lookup } = await admin.auth.admin.getUserById(userId)
		if (lookup || !target.user?.email) {
			return fail(404, { message: "No user with that UUID and an email.", login: true })
		}

		const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
			type: "magiclink",
			email: target.user.email
		})
		if (linkErr) return fail(500, { message: errorRef("Could not create the login", linkErr), login: true })

		const { error: otpErr } = await supabaseServer.auth.verifyOtp({
			token_hash: link.properties.hashed_token,
			type: "magiclink"
		})
		if (otpErr) return fail(500, { message: errorRef("Could not log in as the user", otpErr), login: true })

		console.log(`Admin ${user.id} logged in as ${userId}`)
		resetSession()
		redirect(303, "/")
	}
}
