import { fail, redirect } from "@sveltejs/kit"
import { message, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"
import { scriptSchema } from "#lib/schemas"
import { isCommunityRole } from "#lib/scripts"
import { errorRef } from "#lib/server/supabase.server"
import { hasAcceptedTerms, termsRedirect } from "#lib/server/terms.server"

export const load = async ({ locals: { user, getProfile, supabaseServer } }) => {
	if (!user) redirect(303, "/auth")
	const profile = await getProfile()
	if (!profile) redirect(303, "/auth")
	// Anyone can write a script, once they accepted the current terms (the database checks it too)
	if (!(await hasAcceptedTerms(supabaseServer, user.id))) redirect(303, termsRedirect("/scripts/new"))

	const community = isCommunityRole(profile.role)
	// What a community author has used of their limits; scripter+ has none
	const { data: usage } = community
		? await supabaseServer.schema("scripts").rpc("get_community_usage").maybeSingle()
		: { data: null }

	return {
		community,
		usage: usage
			? {
					scripts: usage.script_count,
					maxScripts: usage.max_scripts,
					bytes: usage.used_bytes,
					maxBytes: usage.max_bytes
				}
			: null,
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
	default: async ({ request, locals: { user, getProfile, supabaseServer } }) => {
		const form = await superValidate(request, zod4(scriptSchema))
		if (!user) return message(form, "You need to login to add a script.", { status: 401 })
		if (!form.valid) return fail(400, { form })

		const { title, description, content, stage, categories } = form.data
		// Community scripts are never premium; the database refuses it too
		const community = isCommunityRole((await getProfile())?.role)
		const type = community ? "free" : form.data.type
		const price = community ? 0 : form.data.price
		const scripts = supabaseServer.schema("scripts")

		// No .select() on the insert: the SELECT policy can't see the row yet, because the protected row
		// that names the author is created by an AFTER INSERT trigger.
		const inserted = await scripts.from("scripts").insert({ title, description, content })
		// 42501: terms not accepted (or not allowed); 23514: the community script limit
		if (inserted.error?.code === "42501")
			return message(form, "Accept the current terms before creating a script.", { status: 403 })
		if (inserted.error?.code === "23514")
			return message(form, "You have reached the limit of community scripts.", { status: 400 })
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

		const [meta, row] = await Promise.all([
			scripts.from("metadata").update({ type, price, stage, categories }).eq("id", latest.id),
			scripts.from("scripts").select("url").eq("id", latest.id).single()
		])
		if (!row.data)
			return message(form, errorRef("The script was created but could not be opened", row.error), {
				status: 500
			})

		// The script exists with default metadata; the detail page lets the author fix it.
		if (meta.error) console.error(errorRef("Could not save the script metadata", meta.error))

		redirect(303, `/scripts/${row.data.url}`)
	}
}
