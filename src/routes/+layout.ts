import { browser } from "$app/env"
import { getSupabaseBrowser } from "#lib/supabase.browser"

// The server data is already in sync with the session on first load, so the client is only needed
// once the auth state changes and the layout invalidates
let hydrated = false

export const load = async ({ data, depends }) => {
	depends("supabase:auth")

	if (!browser || !hydrated) {
		hydrated = browser
		return {
			locale: data.locale,
			user: data.user,
			expiresAt: data.expiresAt,
			profile: data.profile,
			sidebarScripts: data.sidebarScripts
		}
	}

	const supabaseClient = await getSupabaseBrowser()

	const {
		data: { session }
	} = await supabaseClient.auth.getSession()

	if ((session?.user.id ?? null) === data.user) {
		return {
			locale: data.locale,
			user: data.user,
			expiresAt: session?.expires_at ?? null,
			profile: data.profile,
			sidebarScripts: data.sidebarScripts
		}
	}

	const expiresAt = session?.expires_at ?? null
	const authUser = (await supabaseClient.auth.getUser()).data.user

	if (authUser) {
		const { data: profile } = await supabaseClient
			.schema("profiles")
			.from("profiles")
			.select("id, username, avatar, role")
			.eq("id", authUser.id)
			.single()

		return {
			locale: data.locale,
			user: authUser.id,
			expiresAt,
			profile,
			sidebarScripts: data.sidebarScripts
		}
	}

	return {
		locale: data.locale,
		user: null,
		expiresAt,
		profile: null,
		sidebarScripts: data.sidebarScripts
	}
}
