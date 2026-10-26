import { loadDocument } from "#lib/server/documents.server"

export const load = async ({ locals: { supabaseServer } }) => ({
	scripter: await loadDocument(supabaseServer, "scripter_tos")
})
