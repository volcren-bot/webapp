import { loadDocument } from "#lib/server/documents.server"

export const load = async ({ locals: { supabaseServer } }) => {
	const [user, scripter] = await Promise.all([
		loadDocument(supabaseServer, "user_tos"),
		loadDocument(supabaseServer, "scripter_tos")
	])
	return { user, scripter }
}
