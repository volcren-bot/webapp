import { fail, redirect } from "@sveltejs/kit"
import { CATEGORIES, TYPES, roleAtLeast, type ScriptCategory, type ScriptType } from "#lib/scripts"
import { getPublicScripts, type CachedScript } from "#lib/server/scripts.cache"
import { createLimiter } from "#lib/server/ratelimit.server"
import { errorRef } from "#lib/server/supabase.server"
import type { Database } from "#lib/types/supabase"
import { likeEscape } from "#lib/utils"

const MAX_LISTED = 500

type ScriptTables = Database["scripts"]["Tables"]

/** A listed script with its metadata and protected rows, which are one-to-one (their id is the script's). */
type ListedScript = Pick<
	ScriptTables["scripts"]["Row"],
	"id" | "url" | "title" | "description" | "published" | "is_community" | "is_granted" | "author_banned"
> & {
	metadata: Pick<ScriptTables["metadata"]["Row"], "type" | "categories" | "stage" | "price">
	protected: Pick<ScriptTables["protected"]["Row"], "author" | "revision" | "updated_at" | "queueable">
}

/** What the list shows of a cached script: the official ones anyone can see. */
const listed = (s: CachedScript): ListedScript => ({
	...s,
	is_community: false,
	is_granted: false,
	author_banned: false
})

/** The code is 256 random bits (scripts.create_share_code), so this only slows down someone guessing. */
const redeemLimiter = createLimiter(5, 60 * 1000)

const SHARE_CODE = /^[0-9a-f]{64}$/

const REDEEM_ERRORS: Record<string, string> = {
	invalid: "That code isn't valid.",
	expired: "That code has expired. Ask for a new one.",
	used: "That code has already been used. Ask for a new one.",
	own: "That's your own code. Give it to someone else.",
	already_access: "You already have access to that script.",
	rate_limited: "Too many failed attempts. Try again in an hour."
}

export const load = async ({ url, locals: { supabaseServer, user, getProfile } }) => {
	const q = url.searchParams.get("q")?.trim().toLowerCase() ?? ""
	const category = CATEGORIES.find((c) => c === url.searchParams.get("category"))
	const type = TYPES.find((t) => t === url.searchParams.get("type"))
	const mine = url.searchParams.get("mine") === "1" && user != null
	const queueable = url.searchParams.get("queueable") === "1"
	const profile = await getProfile()
	// Testers see every community script, so they get their own filter instead of having the list flooded
	const canBrowseCommunity = roleAtLeast(profile?.role, "tester")
	const community = url.searchParams.get("community") === "1" && canBrowseCommunity

	// Inner joins drop scripts missing either row, and let the filters run in the database.
	const base = () => {
		let query = supabaseServer
			.schema("scripts")
			.from("scripts")
			.select(
				"id, url, title, description, published, is_community, is_granted, author_banned, metadata!inner(type, categories, stage, price), protected!inner(author, revision, updated_at, queueable)"
			)
		if (q) {
			const pattern = `"%${likeEscape(q).replace(/["\\]/g, "\\$&")}%"`
			query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
		}
		if (category) query = query.contains("metadata.categories", [category])
		if (type) query = query.eq("metadata.type", type)
		if (mine) query = query.eq("protected.author", user.id)
		if (queueable) query = query.eq("protected.queueable", true)
		return query
	}

	// Row level security decides what the user sees; testers and up read the database, everyone else gets public scripts from the cache plus their shared and own ones.
	const cached = community || canBrowseCommunity ? null : await getPublicScripts()
	const queries = community
		? [base().eq("is_community", true)]
		: cached
			? user
				? [base().eq("is_granted", true), base().eq("protected.author", user.id)]
				: []
			: [
					base().eq("is_community", false),
					base().eq("is_granted", true),
					...(user ? [base().eq("is_community", true).eq("protected.author", user.id)] : [])
				]
	const results = await Promise.all(
		queries.map((query) => query.limit(MAX_LISTED).overrideTypes<ListedScript[], { merge: false }>())
	)
	const err = results.find((r) => r.error)?.error
	if (err)
		return {
			scripts: [],
			error: errorRef("Could not load the scripts", err),
			filters: {},
			canBrowseCommunity
		}

	// The cached scripts go first so that a row from the database (which knows if it is shared) wins
	const names = new Map<string, string>()
	const found = new Map<string, ListedScript>()
	const matches = (s: CachedScript) =>
		s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
	for (const s of cached ?? []) {
		if (q && !matches(s)) continue
		if (category && !s.metadata.categories.includes(category)) continue
		if (type && s.metadata.type !== type) continue
		if (mine && s.protected.author !== user?.id) continue
		if (queueable && !s.protected.queueable) continue
		found.set(s.id, listed(s))
		names.set(s.id, s.author)
	}
	for (const r of results) for (const s of r.data ?? []) found.set(s.id, s)
	const data = [...found.values()]

	// Profiles are private: author names come from get_authors, keyed by script
	const unnamed = data.filter((s) => !names.has(s.id)).map((s) => s.id)
	if (unnamed.length) {
		const { data: authors } = await supabaseServer
			.schema("scripts")
			.rpc("get_authors", { script_ids: unnamed })
		for (const a of authors ?? []) names.set(a.script_id, a.username)
	}

	const scripts = data
		.sort((a, b) => b.protected.updated_at.localeCompare(a.protected.updated_at))
		.slice(0, MAX_LISTED)
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
			queueable: s.protected.queueable,
			updatedAt: s.protected.updated_at,
			author: names.get(s.id) ?? "unknown",
			own: s.protected.author === user?.id,
			community: s.is_community === true,
			granted: s.is_granted === true,
			authorBanned: s.author_banned === true
		}))

	return {
		scripts,
		error: null,
		filters: { q, category, type, mine, community, queueable },
		canBrowseCommunity
	}
}

export const actions = {
	// Redeems a share code. The database checks it and adds the grant in one step, so a code works once.
	redeem: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { redeemError: "Log in to redeem a code." })
		if (!redeemLimiter(user.id)) return fail(429, { redeemError: "Too many tries. Wait a minute." })

		const code = String((await request.formData()).get("code") ?? "")
			.trim()
			.toLowerCase()
		if (!SHARE_CODE.test(code)) {
			return fail(400, { redeemError: "A share code is 64 characters: the digits 0-9 and the letters a-f." })
		}

		const { data, error } = await supabaseServer.schema("scripts").rpc("redeem_share_code", { p_code: code })
		if (error?.code === "42501") return fail(403, { redeemError: "This account can't redeem codes." })
		if (error) return fail(500, { redeemError: errorRef("Could not redeem the code", error) })

		const result = data[0]
		if (result?.status !== "ok" || !result.url) {
			const message = REDEEM_ERRORS[result?.status ?? ""] ?? REDEEM_ERRORS.invalid
			return fail(result?.status === "rate_limited" ? 429 : 400, { redeemError: message })
		}
		redirect(303, `/scripts/${result.url}`)
	}
}
