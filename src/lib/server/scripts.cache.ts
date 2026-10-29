import { roleAtLeast } from "#lib/scripts"
import type { Database } from "#lib/types/supabase"
import { supabaseAdmin } from "./supabase.admin"

type ScriptTables = Database["scripts"]["Tables"]

/** A script anyone may see: official, published, at stage beta or stable, with a live revision and an author in good standing. */
export type CachedScript = Pick<
	ScriptTables["scripts"]["Row"],
	"id" | "url" | "title" | "description" | "content" | "published"
> & {
	metadata: Pick<ScriptTables["metadata"]["Row"], "type" | "categories" | "stage" | "price">
	protected: Pick<ScriptTables["protected"]["Row"], "author" | "revision" | "created_at" | "updated_at">
	/** The author's username, so listing the scripts needs no get_authors call. */
	author: string
}

/** The database changes without telling the webapp (the api service, the browser upload, staff), so a copy older than this is refreshed. */
const TTL = 60_000

type Row = Omit<CachedScript, "author">

let byId = new Map<string, CachedScript>()
let byUrl = new Map<string, CachedScript>()
/** 0 until the first load, 1 once marked stale; otherwise when the copy was made. */
let loadedAt = 0
let loading: Promise<void> | null = null

/** Mirrors scripts.can_view for a visitor with no role and no grant. Admin client, so RLS does not apply. */
async function fetchPublic(id?: string): Promise<CachedScript[]> {
	const admin = supabaseAdmin()
	let query = admin
		.schema("scripts")
		.from("scripts")
		.select(
			`id, url, title, description, content, published,
			metadata!inner(type, categories, stage, price),
			protected!inner(author, revision, created_at, updated_at)`
		)
		.eq("published", true)
		.in("metadata.stage", ["beta", "stable"])
		.gt("protected.revision", 0)
	if (id) query = query.eq("id", id)

	const { data: rows, error } = await query.overrideTypes<Row[], { merge: false }>()
	if (error) throw error
	if (!rows.length) return []

	const { data: profiles, error: profileErr } = await admin
		.schema("profiles")
		.from("profiles")
		.select("id, username, role, banned_at")
		.in("id", [...new Set(rows.map((s) => s.protected.author))])
	if (profileErr) throw profileErr

	// Community scripts (author below scripter) and a banned author's scripts are not public
	const authors = new Map(
		profiles.filter((p) => !p.banned_at && roleAtLeast(p.role, "scripter")).map((p) => [p.id, p.username])
	)
	return rows.flatMap((s) => {
		const author = authors.get(s.protected.author)
		return author === undefined ? [] : [{ ...s, author }]
	})
}

async function load() {
	const scripts = await fetchPublic()
	byId = new Map(scripts.map((s) => [s.id, s]))
	byUrl = new Map(scripts.map((s) => [s.url, s]))
	loadedAt = Date.now()
}

/** The first call waits for the load; after that an old copy is served while a refresh runs behind it. False when there is no copy at all. */
async function ready() {
	if (Date.now() - loadedAt >= TTL) {
		loading ??= load()
			.catch((e) => console.error(e))
			.finally(() => (loading = null))
	}
	if (loadedAt === 0) await loading
	return loadedAt > 0
}

/** Every public script, or null when they could not be loaded: callers then ask the database. */
export async function getPublicScripts() {
	return (await ready()) ? [...byId.values()] : null
}

/** The public script at this url, or null when there is none (or it is not public). */
export async function getPublicScript(url: string) {
	return (await ready()) ? (byUrl.get(url) ?? null) : null
}

/** Re-reads one script after the webapp changed it, so a rename, hide or delete shows at once. */
export async function refreshScript(id: string) {
	if (loadedAt === 0) return
	try {
		const [script] = await fetchPublic(id)
		const old = byId.get(id)
		if (old) byUrl.delete(old.url)
		if (script) {
			byId.set(id, script)
			byUrl.set(script.url, script)
		} else byId.delete(id)
	} catch (e) {
		console.error(e)
		markStale()
	}
}

/** For changes that reach many scripts at once, such as a ban: the next request refreshes everything. */
export function markStale() {
	if (loadedAt > 0) loadedAt = 1
}
