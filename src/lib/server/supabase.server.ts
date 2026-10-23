import type { AuthError, PostgrestError, SupabaseClient, Provider } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"
import { formatError } from "#lib/utils"

export const LOGIN_REDIRECT_COOKIE = "login_redirect"

/** Logs the error with a short reference id and returns a message that can be shown to the user. */
export function errorRef(message: string, detail?: unknown) {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}] ${message}`, detail ?? "")
	return `${message} (ref: ${id})`
}

export function refError(status: number, message: string, detail?: unknown): never {
	error(status, errorRef(message, detail))
}

export async function doLogin(
	supabase: SupabaseClient,
	origin: string,
	searchParams: URLSearchParams
): Promise<never> {
	const provider = searchParams.get("provider") as Provider | null

	if (!provider) error(403, "Failed to login! Provider not specified!")

	const { data, error: err } = await supabase.auth.signInWithOAuth({
		provider,
		options: { redirectTo: origin + "/auth/callback/" }
	})

	if (err) error(400, formatError(err as AuthError | PostgrestError))

	redirect(303, data.url)
}

/** Only same-origin absolute paths, so the post-login redirect can't leave the site. */
export function safePath(path: string, origin: string) {
	if (!path.startsWith("/")) return null
	try {
		const url = new URL(path, origin)
		return url.origin === origin ? url.pathname + url.search + url.hash : null
	} catch {
		return null
	}
}
