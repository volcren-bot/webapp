import { deletionBlockers } from "#lib/server/account.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { fail, redirect } from "@sveltejs/kit"

export const load = async ({ locals: { user, supabaseServer } }) => {
	if (!user) redirect(303, "/")

	const payments = supabaseServer.schema("payments")
	const [account, ledger, blockers] = await Promise.all([
		payments.from("accounts").select("credits").eq("user_id", user.id).maybeSingle(),
		payments
			.from("credits_ledger")
			.select("id, kind, amount, balance_after, note, created_at, payments(provider, bonus)")
			.eq("user_id", user.id)
			// id follows insertion order like created_at, and is what credits_ledger_user_id_idx covers
			.order("id", { ascending: false })
			.limit(50),
		deletionBlockers(user.id).catch((e) => [
			errorRef("Could not check whether your account can be deleted", e)
		])
	])

	return {
		credits: account.data?.credits ?? 0,
		ledger: (ledger.data ?? []).map(({ payments: payment, ...entry }) => ({
			...entry,
			provider: payment?.provider ?? null,
			bonus: payment?.bonus ?? 0
		})),
		blockers
	}
}

export const actions = {
	// Deletes the auth user. The database cascades that to the profile, balance, stats and deploy
	// tokens; payment and usage records stay (see the privacy policy).
	delete: async ({ request, locals: { user, getProfile, supabaseServer } }) => {
		if (!user) return fail(401, { deleteMessage: "You need to login." })
		const profile = await getProfile()
		if (!profile) return fail(404, { deleteMessage: "Your account was not found." })

		const data = await request.formData()
		if (String(data.get("confirm") ?? "").trim() !== profile.username) {
			return fail(400, { deleteMessage: "Type your username exactly to confirm." })
		}

		let blockers
		try {
			blockers = await deletionBlockers(user.id)
		} catch (e) {
			return fail(502, { deleteMessage: errorRef("Could not check whether your account can be deleted", e) })
		}
		if (blockers.length) return fail(409, { deleteMessage: blockers.join(" ") })

		const { error: err } = await supabaseAdmin().auth.admin.deleteUser(user.id)
		if (err) return fail(500, { deleteMessage: errorRef("Could not delete your account", err) })

		console.log(`User ${user.id} deleted their account`)
		// The user is gone, so Auth rejects the logout; signOut ignores that and clears the cookies
		await supabaseServer.auth.signOut({ scope: "local" })
		redirect(303, "/")
	}
}
