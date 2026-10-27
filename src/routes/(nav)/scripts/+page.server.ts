import { fail, redirect } from "@sveltejs/kit"
import { CATEGORIES, TYPES, roleAtLeast, type ScriptCategory, type ScriptType } from "#lib/scripts"
import { createLimiter } from "#lib/server/ratelimit.server"
import { errorRef } from "#lib/server/supabase.server"
import { one } from "#lib/utils"

const MAX_LISTED = 500

// Matches the search text literally rather than as a LIKE pattern.
function likeEscape(text: string) {
	return text.replace(/[\\%_]/g, "\\$&")
}

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
				"id, url, title, description, published, is_community, is_granted, author_banned, metadata!inner(type, categories, stage, price), protected!inner(author, revision, updated_at)"
			)
		if (q) {
			const pattern = `"%${likeEscape(q).replace(/["\\]/g, "\\$&")}%"`
			query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
		}
		if (category) query = query.contains("metadata.categories", [category])
		if (type) query = query.eq("metadata.type", type)
		if (mine) query = query.eq("protected.author", user.id)
		return query.limit(MAX_LISTED)
	}

	// Row level security decides what the user may see. The default list is the official scripts, the
	// scripts shared with the user and their own community scripts; the community filter is every
	// community script they can see.
	const results = await Promise.all(
		community
			? [base().eq("is_community", true)]
			: [
					base().eq("is_community", false),
					base().eq("is_granted", true),
					...(user ? [base().eq("is_community", true).eq("protected.author", user.id)] : [])
				]
	)
	const err = results.find((r) => r.error)?.error
	if (err)
		return {
			scripts: [],
			error: errorRef("Could not load the scripts", err),
			filters: {},
			canBrowseCommunity
		}

	const found = new Map<string, NonNullable<(typeof results)[number]["data"]>[number]>()
	for (const r of results) for (const s of r.data ?? []) found.set(s.id, s)
	const data = [...found.values()]

	// Profiles are private: author names come from get_authors, keyed by script
	const { data: authors } = data.length
		? await supabaseServer.schema("scripts").rpc("get_authors", { script_ids: data.map((s) => s.id) })
		: { data: [] }
	const names = new Map((authors ?? []).map((a) => [a.script_id, a.username]))

	const scripts = data
		.flatMap((s) => {
			const metadata = one(s.metadata)
			const info = one(s.protected)
			return metadata && info ? [{ ...s, metadata, protected: info }] : []
		})
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
			updatedAt: s.protected.updated_at,
			author: names.get(s.id) ?? "unknown",
			own: s.protected.author === user?.id,
			community: s.is_community === true,
			granted: s.is_granted === true,
			authorBanned: s.author_banned === true
		}))

	return { scripts, error: null, filters: { q, category, type, mine, community }, canBrowseCommunity }
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
