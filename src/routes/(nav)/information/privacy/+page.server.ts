import { loadDocument } from "#lib/server/documents.server"

export const load = async ({ locals: { supabaseServer } }) => ({
	privacy: await loadDocument(supabaseServer, "privacy_policy")
})
