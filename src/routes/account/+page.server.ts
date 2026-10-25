import { profileSchema } from "#lib/schemas"
import { formatError } from "#lib/utils"
import { redirect } from "@sveltejs/kit"
import { setError, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"

export const load = async ({ locals: { user } }) => {
	if (!user) redirect(303, "/")
	return {
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
