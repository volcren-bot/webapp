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
	default: async ({ request, url: { origin }, locals: { user, supabaseServer } }) => {
		const form = await superValidate(request, zod4(profileSchema))

		if (!user) return setError(form, "", "You need to login to update your account.")
		if (!form.valid) return setError(form, "", "Form is not valid!")

		if (form.data.email === "" || user.email == form.data.email) form.data.email = undefined
		if (form.data.password === "") form.data.password = undefined

		if (form.data.email || form.data.password) {
			const { error: err } = await supabaseServer.auth.updateUser(form.data, {
				emailRedirectTo: origin + "/account"
			})
			if (err) return setError(form, "", formatError(err))
		}

		return { form, email: form.data.email != null, password: form.data.password != null }
	}
}
