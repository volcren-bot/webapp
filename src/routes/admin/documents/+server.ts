import { error, json } from "@sveltejs/kit"
import { errorRef, requireAdmin } from "#lib/server/supabase.server"
import { Constants } from "#lib/types/supabase"

// The markdown of the latest published version of a document, for the admin page to edit from.
export const GET = async ({ url, locals }) => {
	const auth = await requireAdmin(locals)
	if ("status" in auth) error(auth.status, auth.message)

	const kind = Constants.info.Enums.kind.find((k) => k === url.searchParams.get("kind"))
	if (!kind) error(400, "Pick a document.")

	const { data, error: err } = await locals.supabaseServer
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
