import { profileSchema } from "#lib/schemas"
import { formatError, one } from "#lib/utils"
import { redirect } from "@sveltejs/kit"
import { setError, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"

export const load = async ({ locals: { user, supabaseServer } }) => {
	if (!user) redirect(303, "/")

	const payments = supabaseServer.schema("payments")
	const [account, ledger] = await Promise.all([
		payments.from("accounts").select("credits").eq("user_id", user.id).maybeSingle(),
		payments
			.from("credits_ledger")
			.select("id, kind, amount, balance_after, note, created_at, payments(provider, bonus)")
			.eq("user_id", user.id)
			// id follows insertion order like created_at, and is what credits_ledger_user_id_idx covers
			.order("id", { ascending: false })
			.limit(50)
	])

	return {
		credits: account.data?.credits ?? 0,
		ledger: (ledger.data ?? []).map(({ payments: payment, ...entry }) => ({
			...entry,
			provider: one(payment)?.provider ?? null,
			bonus: one(payment)?.bonus ?? 0
		})),
		form: await superValidate({ email: user.email }, zod4(profileSchema))
	}
}

export const actions = {
	default: async ({ request, locals: { user, supabaseServer } }) => {
		const form = await superValidate(request, zod4(profileSchema))

		if (!user) return setError(form, "", "You need to login to update your account.")
		if (!form.valid) return setError(form, "", "Form is not valid!")

		// Emails are permanent: whatever the client sends for it is ignored.
		form.data.email = user.email
		const password = form.data.password || undefined

		if (password) {
			const { error: err } = await supabaseServer.auth.updateUser({ password })
			if (err) return setError(form, "", formatError(err))
		}

		return { form, password: password != null }
	}
}
