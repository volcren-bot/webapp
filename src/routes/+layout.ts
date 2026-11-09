import { browser } from "$app/env"
import { getSupabaseBrowser } from "#lib/supabase.browser"
import { SESSION_PROFILE_COLUMNS } from "#lib/types/profile"

// The server data is already in sync on first load, so the client is only needed once the auth state changes and the layout invalidates
let hydrated = false

export const load = async ({ data, depends }) => {
	depends("supabase:auth")

	const result = (user: string | null, expiresAt: number | null, profile: typeof data.profile) => ({
		locale: data.locale,
		user,
		expiresAt,
		profile,
		sidebarScripts: data.sidebarScripts
	})

	if (!browser || !hydrated) {
		hydrated = browser
		return result(data.user, data.expiresAt, data.profile)
	}

	const supabaseClient = await getSupabaseBrowser()
	const {
		data: { session }
	} = await supabaseClient.auth.getSession()
	const expiresAt = session?.expires_at ?? null

	if ((session?.user.id ?? null) === data.user) return result(data.user, expiresAt, data.profile)

	const authUser = (await supabaseClient.auth.getUser()).data.user
	if (!authUser) return result(null, expiresAt, null)

	const { data: profile } = await supabaseClient
		.schema("profiles")
		.from("profiles")
		.select(SESSION_PROFILE_COLUMNS)
		.eq("id", authUser.id)
		.single()
	return result(authUser.id, expiresAt, profile)
}
