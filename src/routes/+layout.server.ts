const MAX_SIDEBAR_SCRIPTS = 100

import { localeFrom } from "#lib/format.svelte.js"

export const load = async ({ locals: { safeGetSession, getProfile, supabaseServer }, setHeaders, request }) => {
	setHeaders({
		"Strict-Transport-Security": "max-age=31536000; includeSubDomains",
		"X-Frame-Options": "SAMEORIGIN",
		"X-Content-Type-Options": "nosniff",
		"Referrer-Policy": "origin-when-cross-origin",
		"Permissions-Policy": "geolocation=(), microphone=(), camera=(), fullscreen=(self), payment=(), midi=()"
	})

	const { session, user } = await safeGetSession()

	// Row-level security decides which scripts this user can see.
	const [profile, { data: scripts }] = await Promise.all([
		getProfile(),
		supabaseServer
			.schema("scripts")
			.from("scripts")
			.select("url")
			.order("url")
			.limit(MAX_SIDEBAR_SCRIPTS)
	])

	return {
		locale: localeFrom(request.headers.get("accept-language")),
		user: user?.id ?? null,
		expiresAt: session?.expires_at ?? null,
		profile,
		sidebarScripts: scripts ?? []
	}
}
