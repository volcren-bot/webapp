import { error, redirect } from "@sveltejs/kit"
import { errorRef, refError, safePath, LOGIN_REDIRECT_COOKIE } from "#lib/server/supabase.server"
import { claimReferral, referralCode, REFERRAL_COOKIE } from "#lib/server/referrals.server"

export const GET = async ({ url: { origin, searchParams }, cookies, locals: { supabaseServer } }) => {
	const takeLoginRedirect = () => {
		const path = cookies.get(LOGIN_REDIRECT_COOKIE)
		cookies.delete(LOGIN_REDIRECT_COOKIE, { path: "/" })
		return safePath(path, origin) ?? "/"
	}

	// The provider's error goes to the logs, never onto the page, since anyone can put text in these parameters and share the link.
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

		const referral = referralCode(cookies.get(REFERRAL_COOKIE))
		cookies.delete(REFERRAL_COOKIE, { path: "/" })
		if (referral) {
			try {
				await claimReferral(supabaseServer, referral)
			} catch (e) {
				errorRef("Could not claim the referral", e)
			}
		}
	}

	redirect(303, takeLoginRedirect())
}
