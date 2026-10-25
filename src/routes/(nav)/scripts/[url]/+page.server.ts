import { error, fail, redirect } from "@sveltejs/kit"
import { message, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"
import { scriptSchema } from "#lib/scripts"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { one } from "#lib/utils"

export const load = async ({ params, locals: { supabaseServer, user, getProfile } }) => {
	const scripts = supabaseServer.schema("scripts")

	const { data: script } = await scripts
		.from("scripts")
		.select(
			"id, url, title, description, content, published, metadata(type, categories, stage, price), protected(author, revision, created_at, updated_at)"
		)
		.eq("url", params.url)
		.maybeSingle()
	if (!script) {
		// A slug from before a rename: send the visitor to the current one.
		const { data: old } = await scripts
			.from("slugs")
			.select("scripts(url)")
			.eq("slug", params.url)
			.maybeSingle()
		const current = one(old?.scripts)?.url
		if (current && current !== params.url) redirect(301, `/scripts/${current}`)
	}
	const metadata = one(script?.metadata)
	const info = one(script?.protected)
	if (!script || !metadata || !info) error(404, "Script not found")

	const profile = await getProfile()
	const own = user != null && info.author === user.id
	const canEdit = own || (profile != null && ["moderator", "administrator"].includes(profile.role))

	const [{ data: author }, { data: versions }] = await Promise.all([
		supabaseServer.schema("profiles").from("profiles").select("username").eq("id", info.author).maybeSingle(),
		canEdit
			? scripts
					.from("versions")
					.select("revision, status, files, created_at, published_at")
					.eq("id", script.id)
					.order("revision", { ascending: false })
			: Promise.resolve({ data: [] })
	])

	return {
		script: {
			id: script.id,
			title: script.title,
			description: script.description,
			content: script.content,
			published: script.published,
			...metadata,
			revision: info.revision,
			createdAt: info.created_at,
			updatedAt: info.updated_at,
			author: author?.username ?? "unknown"
		},
		canEdit,
		canDelete: profile?.role === "administrator",
		versions: versions ?? [],
		form: canEdit
			? await superValidate(
					{
						title: script.title,
						description: script.description,
						content: script.content,
						type: metadata.type,
						price: metadata.price,
						stage: metadata.stage,
						categories: metadata.categories
					},
					zod4(scriptSchema),
					{ errors: false }
				)
			: null
	}
}

export const actions = {
	update: async ({ request, params, locals: { user, supabaseServer } }) => {
		const form = await superValidate(request, zod4(scriptSchema))
		if (!user) return message(form, "You need to login to edit a script.", { status: 401 })
		if (!form.valid) return fail(400, { form })

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return message(form, "Script not found.", { status: 404 })

		const { title, description, content, type, price, stage, categories } = form.data

		// RLS lets only the author and moderators through; zero rows means the update was refused.
		const base = await scripts
			.from("scripts")
			.update({ title, description, content })
			.eq("id", script.id)
			.select("id")
		if (base.error) return message(form, errorRef("Could not save the script", base.error), { status: 500 })
		if (!base.data.length) return message(form, "You can't edit this script.", { status: 403 })

		const meta = await scripts.from("metadata").update({ type, price, stage, categories }).eq("id", script.id)
		if (meta.error) return message(form, errorRef("Could not save the script", meta.error), { status: 400 })

		// The slug follows the title, so a rename moves the page.
		const { data: renamed } = await scripts.from("scripts").select("url").eq("id", script.id).single()
		if (renamed && renamed.url !== params.url) redirect(303, `/scripts/${renamed.url}`)

		return message(form, "Saved.")
	},

	publish: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const published = (await request.formData()).get("published") === "true"

		const { data, error: err } = await supabaseServer
			.schema("scripts")
			.from("scripts")
			.update({ published })
			.eq("url", params.url)
			.select("id")
		if (err) return fail(500, { message: errorRef("Could not change the visibility", err) })
		if (!data.length) return fail(403, { message: "You can't edit this script." })

		return { message: published ? "Script is public." : "Script is hidden." }
	},

	delete: async ({ request, params, locals: { user, getProfile, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		if ((await getProfile())?.role !== "administrator")
			return fail(403, { message: "Only administrators can delete scripts." })
		if ((await request.formData()).get("confirm") !== params.url)
			return fail(400, { message: "Type the script's url to confirm the delete." })

		const { data: script } = await supabaseServer
			.schema("scripts")
			.from("scripts")
			.select("id")
			.eq("url", params.url)
			.maybeSingle()
		if (!script) return fail(404, { message: "Script not found." })

		try {
			await deleteScript(script.id)
		} catch (e) {
			return fail(500, { message: errorRef("Could not delete the script", e) })
		}
		redirect(303, "/scripts")
	}
}

/** Every file under `prefix` in the bucket, however deeply nested. */
async function listObjects(
	storage: ReturnType<ReturnType<typeof supabaseAdmin>["storage"]["from"]>,
	prefix: string
) {
	const paths: string[] = []
	const pending = [prefix]
	while (pending.length) {
		const dir = pending.pop()!
		for (let offset = 0; ; offset += 1000) {
			const { data, error: err } = await storage.list(dir, { limit: 1000, offset })
			if (err) throw err
			for (const entry of data) (entry.id ? paths : pending).push(`${dir}/${entry.name}`)
			if (data.length < 1000) break
		}
	}
	return paths
}

/** Removes the script everywhere: bucket files, stats, bundle entries and its rows. Administrators only. */
async function deleteScript(id: string) {
	const admin = supabaseAdmin()

	// Storage goes first: it is idempotent, so a failure later can be retried while the script still exists.
	const bucket = admin.storage.from("scripts")
	const objects = await listObjects(bucket, id)
	for (let i = 0; i < objects.length; i += 100) {
		const { error: err } = await bucket.remove(objects.slice(i, i + 100))
		if (err) throw err
	}

	const stats = admin.schema("stats")
	const results = await Promise.all([
		stats.from("stats").delete().eq("id", id),
		stats.from("values").delete().eq("id", id),
		stats.from("values_custom").delete().eq("id", id),
		stats.from("limits").delete().eq("id", id),
		stats.from("limits_custom").delete().eq("id", id),
		stats.from("website").delete().eq("id", id),
		stats.from("website_monthly").delete().eq("id", id)
	])
	for (const { error: err } of results) if (err) throw err

	const scripts = admin.schema("scripts")
	const { data: bundles, error: bundleErr } = await scripts
		.from("bundles")
		.select("id, scripts")
		.contains("scripts", [id])
	if (bundleErr) throw bundleErr
	for (const bundle of bundles) {
		const { error: err } = await scripts
			.from("bundles")
			.update({ scripts: bundle.scripts.filter((s) => s !== id) })
			.eq("id", bundle.id)
		if (err) throw err
	}

	// The script row goes last so the others can't be orphaned if an earlier step fails.
	for (const table of ["versions", "metadata", "protected"] as const) {
		const { error: err } = await scripts.from(table).delete().eq("id", id)
		if (err) throw err
	}
	const { error: err } = await scripts.from("scripts").delete().eq("id", id)
	if (err) throw err
}
