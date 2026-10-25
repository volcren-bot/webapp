import { error, redirect } from "@sveltejs/kit"
import { formatError } from "#lib/utils"
import { safePath, LOGIN_REDIRECT_COOKIE } from "#lib/server/supabase.server"

export const GET = async ({ url: { origin, searchParams }, cookies, locals: { supabaseServer } }) => {
	const takeLoginRedirect = () => {
		const path = cookies.get(LOGIN_REDIRECT_COOKIE)
		cookies.delete(LOGIN_REDIRECT_COOKIE, { path: "/" })
		return (path && safePath(path, origin)) ?? "/"
	}

	const err = searchParams.get("error")
	if (err) {
		let message = "<h3>Authentication Error</h3>"
		message += "<p>Error: " + decodeURI(err) + "</p>"

		const description = searchParams.get("error_description")
		if (description) message += "<p>Message: " + decodeURI(description) + "</p>"

		error(401, message)
	}

	const code = searchParams.get("code")
	if (code) {
		// The profile row is created by the database trigger (see the database repo).
		const { error: err } = await supabaseServer.auth.exchangeCodeForSession(code)
		if (err) error(401, formatError(err))
	}

	redirect(303, takeLoginRedirect())
}
