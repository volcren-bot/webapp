import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import type { DocumentVersion } from "#lib/components/VersionedDocument.svelte"
import { errorRef } from "#lib/server/supabase.server"

type Kind = Database["info"]["Enums"]["kind"]

/** Every published version of a document, newest first. */
export async function loadDocument(
	supabase: SupabaseClient<Database>,
	kind: Kind
): Promise<{ versions: DocumentVersion[]; error?: string }> {
	const { data, error } = await supabase
		.schema("info")
		.from("documents")
		.select("version, created_at, content")
		.eq("kind", kind)
		.order("version", { ascending: false })

	if (error) return { versions: [], error: errorRef("Could not load the document", error) }

	return {
		versions: data.map((d) => ({
			version: `v${d.version}`,
			publishedAt: d.created_at.slice(0, 10),
			content: d.content
		}))
	}
}
