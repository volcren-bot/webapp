import { doLogin, isProtected, safePath, LOGIN_REDIRECT_COOKIE } from "#lib/server/supabase.server"
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

	logout: async ({ locals: { supabaseServer, resetSession }, url: { origin, searchParams } }) => {
		const { error: err } = await supabaseServer.auth.signOut()
		if (err) error(400, formatError(err))
		resetSession()

		// Stay on the current page unless it needs a logged in user
		const path = safePath(searchParams.get("path") ?? "", origin)
		redirect(303, path && !isProtected(new URL(path, origin).pathname) ? path : "/")
	}
}
