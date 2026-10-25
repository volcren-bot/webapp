import { CATEGORIES, TYPES, type ScriptCategory, type ScriptType } from "#lib/scripts"
import { errorRef } from "#lib/server/supabase.server"
import { one } from "#lib/utils"

const MAX_LISTED = 500

// Matches the search text literally rather than as a LIKE pattern.
function likeEscape(text: string) {
	return text.replace(/[\\%_]/g, "\\$&")
}

export const load = async ({ url, locals: { supabaseServer, user } }) => {
	const q = url.searchParams.get("q")?.trim().toLowerCase() ?? ""
	const category = CATEGORIES.find((c) => c === url.searchParams.get("category"))
	const type = TYPES.find((t) => t === url.searchParams.get("type"))
	const mine = url.searchParams.get("mine") === "1" && user != null

	// Inner joins drop scripts missing either row, and let the filters run in the database.
	let query = supabaseServer
		.schema("scripts")
		.from("scripts")
		.select(
			"id, url, title, description, published, metadata!inner(type, categories, stage, price), protected!inner(author, revision, updated_at)"
		)
	if (q) {
		const pattern = `"%${likeEscape(q).replace(/["\\]/g, "\\$&")}%"`
		query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
	}
	if (category) query = query.contains("metadata.categories", [category])
	if (type) query = query.eq("metadata.type", type)
	if (mine) query = query.eq("protected.author", user.id)

	const { data, error: err } = await query.limit(MAX_LISTED)

	if (err) return { scripts: [], error: errorRef("Could not load the scripts", err), filters: {} }

	const authorIds = [...new Set(data.flatMap((s) => one(s.protected)?.author ?? []))]
	const { data: authors } = authorIds.length
		? await supabaseServer.schema("profiles").from("profiles").select("id, username").in("id", authorIds)
		: { data: [] }
	const names = new Map((authors ?? []).map((a) => [a.id, a.username]))

	const scripts = data
		.flatMap((s) => {
			const metadata = one(s.metadata)
			const info = one(s.protected)
			return metadata && info ? [{ ...s, metadata, protected: info }] : []
		})
		.sort((a, b) => b.protected.updated_at.localeCompare(a.protected.updated_at))
		.map((s) => ({
			url: s.url,
			title: s.title,
			description: s.description,
			published: s.published,
			type: s.metadata.type as ScriptType,
			categories: s.metadata.categories as ScriptCategory[],
			stage: s.metadata.stage,
			price: s.metadata.price,
			live: s.protected.revision > 0,
			updatedAt: s.protected.updated_at,
			author: names.get(s.protected.author) ?? "unknown",
			own: s.protected.author === user?.id
		}))

	return { scripts, error: null, filters: { q, category, type, mine } }
}
