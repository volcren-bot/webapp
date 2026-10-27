import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import { loadDocument } from "#lib/server/documents.server"
import { errorRef } from "#lib/server/supabase.server"
import type { DocumentVersion } from "#lib/components/VersionedDocument.svelte"

type Client = SupabaseClient<Database>
type Kind = Database["info"]["Enums"]["kind"]

/** The documents a creator has to accept (info.accept_terms). */
export const TERMS = [
	{ kind: "scripter_tos", label: "Scripter terms of service" },
	{ kind: "community_tos", label: "Community scripts addendum" }
] as const satisfies readonly { kind: Kind; label: string }[]

/**
 * Whether the user may create scripts, upload revisions and generate share codes: they accepted the current
 * version of both documents. The database enforces it too; this only decides what the pages show. Fails closed.
 */
export async function hasAcceptedTerms(supabase: Client, userId: string) {
	const { data, error } = await supabase.schema("profiles").rpc("has_accepted_terms", { user_id: userId })
	if (error) {
		errorRef("Could not check the accepted terms", error)
		return false
	}
	return data === true
}

export interface TermsDocument {
	kind: Kind
	label: string
	/** Null while nothing is published. */
	current: (DocumentVersion & { number: number }) | null
	accepted: boolean
}

/** The current version of each document and whether the user accepted it. */
export async function termsDocuments(supabase: Client, userId: string) {
	const [documents, { data: rows, error }] = await Promise.all([
		Promise.all(TERMS.map((t) => loadDocument(supabase, t.kind))),
		supabase.schema("info").from("acceptances").select("kind, version").eq("user_id", userId)
	])
	const failure =
		documents.find((d) => d.error)?.error ??
		(error ? errorRef("Could not load your acceptances", error) : null)

	const accepted = new Set((rows ?? []).map((r) => `${r.kind}:${r.version}`))
	return {
		error: failure,
		documents: TERMS.map((t, i): TermsDocument => {
			const latest = documents[i].versions[0]
			const number = latest ? Number(latest.version.slice(1)) : 0
			return {
				kind: t.kind,
				label: t.label,
				current: latest ? { ...latest, number } : null,
				accepted: latest != null && accepted.has(`${t.kind}:${number}`)
			}
		})
	}
}

/** Where the acceptance page sends the user back to, if they came from a page that needs the terms. */
export const termsRedirect = (next: string) => `/account/terms?next=${encodeURIComponent(next)}`
