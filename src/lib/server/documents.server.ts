import type { SupabaseClient } from "@supabase/supabase-js"
import MarkdownIt from "markdown-it"
import type { Database } from "#lib/types/supabase"
import type { DocumentVersion } from "#lib/components/VersionedDocument.svelte"
import { errorRef } from "#lib/server/supabase.server"

type Kind = Database["info"]["Enums"]["kind"]

const MAX_CACHED = 64
const rendered = new Map<string, string>()

// Links are an allowlist (markdown-it's own check is a denylist); images are never loaded from a document.
const SAFE_LINK = /^(https?:|mailto:|#|(?!\/\/)[^:]*$)/i

const md = new MarkdownIt({ html: false, linkify: false, typographer: false })
md.validateLink = (url) => SAFE_LINK.test(url.trim())
md.disable("image")

/**
 * Markdown to HTML. Raw HTML in the source is escaped and only allowlisted link protocols survive,
 * so the result is safe to inject. Cached by content: published versions rarely change.
 */
function render(content: string) {
	const hit = rendered.get(content)
	if (hit !== undefined) return hit
	const html = md.render(content)
	if (rendered.size >= MAX_CACHED) rendered.delete(rendered.keys().next().value!)
	rendered.set(content, html)
	return html
}

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
			html: render(d.content)
		}))
	}
}
