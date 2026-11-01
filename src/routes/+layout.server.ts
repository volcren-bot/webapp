const MAX_SIDEBAR_SCRIPTS = 100

import { localeFrom } from "#lib/format.svelte.js"
import { roleAtLeast } from "#lib/scripts"
import { getPublicScripts } from "#lib/server/scripts.cache"

export const load = async ({
	locals: { safeGetSession, getProfile, supabaseServer },
	setHeaders,
	request
}) => {
	setHeaders({
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-Frame-Options": "SAMEORIGIN",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "origin-when-cross-origin",
		"Permissions-Policy": "geolocation=(), microphone=(), camera=(), fullscreen=(self), payment=(), midi=()"
	})

	const { session, user } = await safeGetSession()

	// Row-level security decides which scripts this user sees; testers and up read the database, everyone else gets public scripts from the cache plus their own and shared ones.
	const profile = await getProfile()
	const cached = roleAtLeast(profile?.role, "tester") ? null : await getPublicScripts()
	const scriptsTable = () => supabaseServer.schema("scripts").from("scripts")
	const [official, shared, own] = await Promise.all([
		cached
			? null
			: scriptsTable().select("url").eq("is_community", false).order("url").limit(MAX_SIDEBAR_SCRIPTS),
		user ? scriptsTable().select("url").eq("is_granted", true).order("url").limit(MAX_SIDEBAR_SCRIPTS) : null,
		user
			? (() => {
					const query = scriptsTable()
						.select("url, protected!inner(author)")
						.eq("protected.author", user.id)
						.order("url")
						.limit(MAX_SIDEBAR_SCRIPTS)
					return cached ? query : query.eq("is_community", true)
				})()
			: null
	])
	const urls = new Set([
		...(cached ?? []).map((s) => s.url),
		...[official, shared, own].flatMap((r) => (r?.data ?? []).map((s) => s.url))
	])
	const scripts = [...urls]
		.sort((a, b) => a.localeCompare(b))
		.slice(0, MAX_SIDEBAR_SCRIPTS)
		.map((url) => ({ url }))

	return {
		locale: localeFrom(request.headers.get("accept-language")),
		user: user?.id ?? null,
		expiresAt: session?.expires_at ?? null,
		profile,
		sidebarScripts: scripts
	}
}
