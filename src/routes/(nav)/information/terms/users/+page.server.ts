import { loadDocument } from "#lib/server/documents.server"

export const load = async ({ locals: { supabaseServer } }) => ({
	user: await loadDocument(supabaseServer, "user_tos")
})
