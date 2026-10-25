import { fail, redirect } from "@sveltejs/kit"
import { message, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"
import { scriptSchema } from "#lib/scripts"
import { errorRef } from "#lib/server/supabase.server"

const SCRIPTER_ROLES = ["scripter", "moderator", "administrator"]

export const load = async ({ locals: { user, getProfile } }) => {
	if (!user) redirect(303, "/auth")
	const profile = await getProfile()
	if (!profile || !SCRIPTER_ROLES.includes(profile.role)) redirect(303, "/scripts")

	return {
		form: await superValidate(
			{ type: "free", price: 0, stage: "prototype", categories: [] },
			zod4(scriptSchema),
			{
				errors: false
			}
		)
	}
}

export const actions = {
	default: async ({ request, locals: { user, supabaseServer } }) => {
		const form = await superValidate(request, zod4(scriptSchema))
		if (!user) return message(form, "You need to login to add a script.", { status: 401 })
		if (!form.valid) return fail(400, { form })

		const { title, description, content, type, price, stage, categories } = form.data
		const scripts = supabaseServer.schema("scripts")

		// No .select() on the insert: the SELECT policy can't see the row yet, because the protected row
		// that names the author is created by an AFTER INSERT trigger.
		const inserted = await scripts.from("scripts").insert({ title, description, content })
		if (inserted.error)
			return message(form, errorRef("Could not create the script", inserted.error), { status: 500 })

		const { data: latest } = await scripts
			.from("protected")
			.select("id")
			.eq("author", user.id)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle()
		if (!latest)
			return message(form, errorRef("The script was created but could not be found"), { status: 500 })

		const meta = await scripts.from("metadata").update({ type, price, stage, categories }).eq("id", latest.id)
		const row = await scripts.from("scripts").select("url").eq("id", latest.id).single()
		if (!row.data)
			return message(form, errorRef("The script was created but could not be opened", row.error), {
				status: 500
			})

		// The script exists with default metadata; the detail page lets the author fix it.
		if (meta.error) console.error(errorRef("Could not save the script metadata", meta.error))

		redirect(303, `/scripts/${row.data.url}`)
	}
}
