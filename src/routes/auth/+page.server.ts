import { doLogin, safePath, LOGIN_REDIRECT_COOKIE } from "#lib/server/supabase.server"
import { formatError } from "#lib/utils"
import { error, redirect } from "@sveltejs/kit"

// This route only exists for its form actions.
export const load = () => redirect(303, "/")

export const actions = {
	login: async ({ locals: { supabaseServer }, cookies, url: { origin, searchParams } }) => {
		const path = safePath(searchParams.get("path") ?? "", origin)
		if (path) {
			cookies.set(LOGIN_REDIRECT_COOKIE, path, {
				path: "/",
				httpOnly: true,
				sameSite: "lax",
				maxAge: 60 * 10
			})
		}

		return await doLogin(supabaseServer, origin, searchParams)
	},

	logout: async ({ locals: { supabaseServer, resetSession } }) => {
		const { error: err } = await supabaseServer.auth.signOut()
		if (err) error(400, formatError(err))
		resetSession()
		return { success: true }
	}
}
