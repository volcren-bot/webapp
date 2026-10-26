import { error, redirect } from "@sveltejs/kit"
import { refError, safePath, LOGIN_REDIRECT_COOKIE } from "#lib/server/supabase.server"

export const GET = async ({ url: { origin, searchParams }, cookies, locals: { supabaseServer } }) => {
	const takeLoginRedirect = () => {
		const path = cookies.get(LOGIN_REDIRECT_COOKIE)
		cookies.delete(LOGIN_REDIRECT_COOKIE, { path: "/" })
		return (path && safePath(path, origin)) ?? "/"
	}

	// The provider's error goes to the logs, never onto the page: anyone can put any text in
	// these parameters and send the link around.
	const err = searchParams.get("error")
	// Auth refuses banned accounts (see the admin page). Only the code is read, and the text is ours.
	if (err && searchParams.get("error_code") === "user_banned") error(403, "This account is banned.")
	if (err) {
		refError(401, "Login failed", { error: err, description: searchParams.get("error_description") })
	}

	const code = searchParams.get("code")
	if (code) {
		// The profile row is created by the database trigger (see the database repo).
		const { error: err } = await supabaseServer.auth.exchangeCodeForSession(code)
		if (err) refError(401, "Login failed", err)
	}

	redirect(303, takeLoginRedirect())
}
