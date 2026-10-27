import { loadDocument } from "#lib/server/documents.server"

export const load = async ({ locals: { supabaseServer } }) => ({
	community: await loadDocument(supabaseServer, "community_tos")
})
