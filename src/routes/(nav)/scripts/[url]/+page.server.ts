import { error, fail, redirect } from "@sveltejs/kit"
import { message, superValidate } from "sveltekit-superforms"
import { zod4 } from "sveltekit-superforms/adapters"
import { scriptSchema } from "#lib/schemas"
import { roleAtLeast } from "#lib/scripts"
import { newDeployToken } from "#lib/server/deploy.server"
import { getPublicScript, refreshScript } from "#lib/server/scripts.cache"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { hasAcceptedTerms } from "#lib/server/terms.server"
import type { Database } from "#lib/types/supabase"

/** Share codes expire after 1 to this many days (scripts.config.max_share_code_days, which enforces it). */
const MAX_CODE_DAYS = 30

/** Revisions listed per page of the revision history. */
const REVISIONS_PER_PAGE = 5
const MAX_REVISION_PAGE = 100_000

type ScriptTables = Database["scripts"]["Tables"]

/** The script row with its metadata and protected rows, which are one-to-one (their id is the script's). */
type ScriptPage = Pick<
	ScriptTables["scripts"]["Row"],
	| "id"
	| "url"
	| "title"
	| "description"
	| "content"
	| "published"
	| "is_community"
	| "is_granted"
	| "author_banned"
> & {
	metadata: Pick<ScriptTables["metadata"]["Row"], "type" | "categories" | "stage" | "price"> | null
	protected: Pick<
		ScriptTables["protected"]["Row"],
		"author" | "revision" | "created_at" | "updated_at"
	> | null
}

/** Streamed data must not reject: an unhandled rejection would crash the server, so a failure shows as empty. */
const lazy = <T>(promise: T | PromiseLike<T>, fallback: T) =>
	Promise.resolve(promise).catch((e) => {
		console.error(e)
		return fallback
	})

export const load = async ({ params, url, locals: { supabaseServer, user, getProfile } }) => {
	const scripts = supabaseServer.schema("scripts")
	const profile = await getProfile()

	// A public script comes from the cache for visitors who are neither its author nor staff. Those two
	// read the database: they can see more than the cache holds, and an upload should show at once.
	const hit = await getPublicScript(params.url)
	const cached =
		hit && hit.protected.author !== user?.id && !roleAtLeast(profile?.role, "moderator") ? hit : null

	const { data: script } = cached
		? { data: { ...cached, is_community: false, is_granted: false, author_banned: false } }
		: await scripts
				.from("scripts")
				.select(
					`id, url, title, description, content, published, is_community, is_granted, author_banned,
			metadata(type, categories, stage, price),
			protected(author, revision, created_at, updated_at)`
				)
				.eq("url", params.url)
				.maybeSingle()
				.overrideTypes<ScriptPage, { merge: false }>()

	if (!script) {
		// A slug from before a rename: send the visitor to the current one.
		const { data: old } = await scripts
			.from("slugs")
			.select("scripts(url)")
			.eq("slug", params.url)
			.maybeSingle()
		const current = old?.scripts?.url
		if (current && current !== params.url) redirect(301, `/scripts/${current}`)
	}

	const metadata = script?.metadata
	const info = script?.protected
	if (!script || !metadata || !info) error(404, "Script not found")

	const own = user != null && info.author === user.id
	const staff = roleAtLeast(profile?.role, "moderator")
	const canEdit = own || staff
	const community = script.is_community === true

	// Only owners and moderators see these sections, and they are not needed to draw the page, so they
	// are returned as promises and stream in after it instead of holding it up.
	let owner = null
	if (canEdit) {
		const revisionPage = Math.min(
			Math.max(Number.parseInt(url.searchParams.get("revisions") ?? "", 10) || 1, 1),
			MAX_REVISION_PAGE
		)
		const from = (revisionPage - 1) * REVISIONS_PER_PAGE

		// Share codes need the same terms as publishing; the pages show a notice instead of the tools
		const termsAccepted = lazy(user ? hasAcceptedTerms(supabaseServer, user.id) : true, true)

		owner = {
			revisions: lazy(
				Promise.all([
					scripts
						.from("versions")
						.select("revision, status, files, created_at, published_at", { count: "exact" })
						.eq("id", script.id)
						.order("revision", { ascending: false })
						.range(from, from + REVISIONS_PER_PAGE - 1),
					// The author's use of the community limits, shown next to the uploader
					own && community ? scripts.rpc("get_community_usage").maybeSingle() : null,
					termsAccepted
				]).then(([versions, usage, accepted]) => ({
					versions: versions.data ?? [],
					total: versions.count ?? 0,
					page: revisionPage,
					perPage: REVISIONS_PER_PAGE,
					usage: usage?.data
						? {
								scripts: usage.data.script_count,
								maxScripts: usage.data.max_scripts,
								bytes: usage.data.used_bytes,
								maxBytes: usage.data.max_bytes
							}
						: null,
					termsAccepted: accepted
				})),
				{
					versions: [],
					total: 0,
					page: revisionPage,
					perPage: REVISIONS_PER_PAGE,
					usage: null,
					termsAccepted: true
				}
			),
			tokens: lazy(
				scripts
					.from("deploy_tokens")
					.select("id, name, created_at, last_used_at")
					.eq("script_id", script.id)
					.order("created_at")
					.then(({ data }) => data ?? []),
				[]
			),
			sharing: lazy(
				Promise.all([
					scripts
						.from("share_codes")
						.select("id, created_at, expires_at")
						.eq("script_id", script.id)
						.is("redeemed_at", null)
						.gt("expires_at", new Date().toISOString())
						.order("expires_at"),
					scripts.rpc("list_grantees", { p_script: script.id }),
					termsAccepted
				]).then(([codes, grantees, accepted]) => ({
					codes: codes.data ?? [],
					grantees: (grantees.data ?? []).map((g) => ({
						userId: g.user_id,
						username: g.username,
						grantedAt: g.granted_at
					})),
					termsAccepted: accepted
				})),
				{ codes: [], grantees: [], termsAccepted: true }
			)
		}
	}

	// The streamed sections above are already on their way; these two only need to finish before the page.
	const [author, grant, form] = await Promise.all([
		cached ? null : scripts.rpc("get_authors", { script_ids: [script.id] }).maybeSingle(),
		// The cache doesn't know if the script was shared with this visitor
		cached && user
			? scripts
					.from("grants")
					.select("user_id")
					.eq("script_id", script.id)
					.eq("user_id", user.id)
					.maybeSingle()
			: null,
		canEdit
			? superValidate(
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
			author: cached?.author ?? author?.data?.username ?? "unknown",
			community,
			granted: cached ? grant?.data != null : script.is_granted === true,
			authorBanned: script.author_banned === true
		},
		canEdit,
		canDelete: staff,
		owner,
		form
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

		await refreshScript(script.id)

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
		await refreshScript(data[0].id)

		return { message: published ? "Script is public." : "Script is hidden." }
	},

	// The token is returned once, here; only its hash is stored.
	createToken: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { tokenError: "You need to login." })
		const name = String((await request.formData()).get("name") ?? "").trim()
		if (!name || name.length > 64) return fail(400, { tokenError: "Name the token (at most 64 characters)." })

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return fail(404, { tokenError: "Script not found." })

		const { token, hash } = newDeployToken()
		const { error: err } = await scripts
			.from("deploy_tokens")
			.insert({ script_id: script.id, name, token_hash: hash })
		// 42501 is the RLS check: only the author and moderators manage tokens
		if (err?.code === "42501") return fail(403, { tokenError: "You can't manage this script's tokens." })
		if (err) return fail(500, { tokenError: errorRef("Could not create the token", err) })

		return { token, tokenName: name }
	},

	revokeToken: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { tokenError: "You need to login." })
		const id = String((await request.formData()).get("id") ?? "")

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return fail(404, { tokenError: "Script not found." })

		// RLS lets only the author and moderators through; zero rows means the delete was refused.
		const { data, error: err } = await scripts
			.from("deploy_tokens")
			.delete()
			.eq("id", id)
			.eq("script_id", script.id)
			.select("id")
		if (err) return fail(500, { tokenError: errorRef("Could not revoke the token", err) })
		if (!data.length) return fail(404, { tokenError: "Token not found." })

		return { tokenMessage: "Token revoked." }
	},

	// A code is returned once, here; only its hash is stored. The database checks who may create one.
	createCode: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { codeError: "You need to login." })
		const days = Number((await request.formData()).get("days"))
		if (!Number.isInteger(days) || days < 1 || days > MAX_CODE_DAYS)
			return fail(400, { codeError: `Pick an expiry between 1 and ${MAX_CODE_DAYS} days.` })

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return fail(404, { codeError: "Script not found." })

		// A minute short of the limit, so a clock a little ahead of the database's can't overshoot it
		const expires = new Date(Date.now() + days * 86_400_000 - 60_000)
		const { data, error: err } = await scripts.rpc("create_share_code", {
			p_script: script.id,
			p_expires_at: expires.toISOString()
		})
		if (err?.code === "42501")
			return fail(403, {
				codeError: "You can't create codes for this script. Accept the current terms first."
			})
		if (err?.code === "23514") return fail(400, { codeError: err.message })
		if (err) return fail(500, { codeError: errorRef("Could not create the code", err) })

		return { code: data[0].code, codeExpires: data[0].expires_at }
	},

	// Only unredeemed codes can be revoked; RLS limits it to whoever manages the script.
	revokeCode: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { codeError: "You need to login." })
		const id = String((await request.formData()).get("id") ?? "")

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return fail(404, { codeError: "Script not found." })

		const { data, error: err } = await scripts
			.from("share_codes")
			.delete()
			.eq("id", id)
			.eq("script_id", script.id)
			.is("redeemed_at", null)
			.select("id")
		if (err) return fail(500, { codeError: errorRef("Could not revoke the code", err) })
		if (!data.length) return fail(404, { codeError: "Code not found." })

		return { codeMessage: "Code revoked." }
	},

	// Whoever manages the script revokes anyone's access; a recipient removes their own (RLS decides).
	revokeGrant: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { grantError: "You need to login." })
		const userId = String((await request.formData()).get("user") ?? "")

		const scripts = supabaseServer.schema("scripts")
		const { data: script } = await scripts.from("scripts").select("id").eq("url", params.url).maybeSingle()
		if (!script) return fail(404, { grantError: "Script not found." })

		const { data, error: err } = await scripts
			.from("grants")
			.delete()
			.eq("script_id", script.id)
			.eq("user_id", userId)
			.select("user_id")
		if (err) return fail(500, { grantError: errorRef("Could not remove the access", err) })
		if (!data.length) return fail(404, { grantError: "Nothing to remove." })

		// A recipient who removed their own access can no longer open the page
		if (
			userId === user.id &&
			!(await scripts.from("scripts").select("id").eq("id", script.id).maybeSingle()).data
		)
			redirect(303, "/scripts")
		return { grantMessage: "Access removed." }
	},

	delete: async ({ request, params, locals: { user, getProfile, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		if (!roleAtLeast((await getProfile())?.role, "moderator"))
			return fail(403, { message: "Only moderators and administrators can delete scripts." })
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
		await refreshScript(script.id)
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

/** Removes the script everywhere: bucket files, stats, bundle entries and its rows. Moderators and administrators only. */
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
