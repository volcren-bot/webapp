import { error, json } from "@sveltejs/kit"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"

const MIN_CHARS = 2
const MAX_CHARS = 32
// One more than we show, so we can tell "5 matches" from "more than 5"
const SUGGESTIONS = 5

// Username suggestions for the admin page. Only returns names once the search narrows to
// SUGGESTIONS or fewer, otherwise `more` tells the page to keep typing.
export const GET = async ({ url, locals: { user, getProfile } }) => {
	if (!user) error(401, "You need to login.")
	const profile = await getProfile()
	if (profile?.role !== "administrator") error(403, "Administrators only.")

	const q = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_CHARS)
	if (q.length < MIN_CHARS) return json({ users: [], more: false })

	// The pattern is a bound parameter, but % _ and \ still act as wildcards inside it
	const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`
	const { data, error: err } = await supabaseAdmin()
		.schema("profiles")
		.from("profiles")
		.select("id, username, avatar")
		.ilike("username", pattern)
		.order("username")
		.limit(SUGGESTIONS + 1)
	if (err) error(500, errorRef("Could not search users", err))

	const more = data.length > SUGGESTIONS
	return json({ users: more ? [] : data, more })
}
