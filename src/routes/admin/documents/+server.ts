import { error, json } from "@sveltejs/kit"
import { errorRef } from "#lib/server/supabase.server"
import { Constants } from "#lib/types/supabase"

// The markdown of the latest published version of a document, for the admin page to edit from.
export const GET = async ({ url, locals: { user, getProfile, supabaseServer } }) => {
	if (!user) error(401, "You need to login.")
	const profile = await getProfile()
	if (profile?.role !== "administrator") error(403, "Administrators only.")

	const kind = Constants.info.Enums.kind.find((k) => k === url.searchParams.get("kind"))
	if (!kind) error(400, "Pick a document.")

	const { data, error: err } = await supabaseServer
		.schema("info")
		.from("documents")
		.select("version, content")
		.eq("kind", kind)
		.order("version", { ascending: false })
		.limit(1)
		.maybeSingle()
	if (err) error(500, errorRef("Could not load the document", err))

	return json(data ?? { version: null, content: "" })
}
