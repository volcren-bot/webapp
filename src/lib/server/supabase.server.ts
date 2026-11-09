import { SUPABASE_URL } from "$app/env/public"
import type { SupabaseClient, Provider } from "@supabase/supabase-js"
import { error, redirect } from "@sveltejs/kit"

export const LOGIN_REDIRECT_COOKIE = "login_redirect"

// Routes that require a logged in user
const PROTECTED_PATHS = ["/account", "/credits", "/reports"]

export const isProtected = (pathname: string) => PROTECTED_PATHS.some((path) => pathname.startsWith(path))

/** Logs the error with a short reference id and returns a message that can be shown to the user. */
export function errorRef(message: string, detail?: unknown) {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}] ${message}`, detail ?? "")
	return `${message} (ref: ${id})`
}

export function refError(status: number, message: string, detail?: unknown): never {
	error(status, errorRef(message, detail))
}

/** Why a request is refused: the status and a message to show. */
export type Refusal = { status: 400 | 401 | 403 | 404 | 500; message: string }

/** The signed-in administrator, or why the request is refused. */
export async function requireAdmin({
	user,
	getProfile
}: App.Locals): Promise<Refusal | { user: NonNullable<App.Locals["user"]> }> {
	if (!user) return { status: 401, message: "You need to login." }
	if ((await getProfile())?.role !== "administrator") return { status: 403, message: "Administrators only." }
	return { user }
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

	if (err) refError(400, err.message, err)

	// The authorize URL lives on the Supabase origin, so only that origin is allowed
	redirect(303, data.url, { external: [new URL(SUPABASE_URL).origin] })
}

/** Only same-origin absolute paths, so the post-login redirect can't leave the site. */
export function safePath(path: string | null | undefined, origin: string) {
	if (!path?.startsWith("/")) return null
	try {
		const url = new URL(path, origin)
		return url.origin === origin ? url.pathname + url.search + url.hash : null
	} catch {
		return null
	}
}
