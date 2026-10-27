import { fail, redirect } from "@sveltejs/kit"
import { safePath, errorRef } from "#lib/server/supabase.server"
import { TERMS, termsDocuments } from "#lib/server/terms.server"

export const load = async ({ url, locals: { user, supabaseServer } }) => {
	if (!user) redirect(303, "/auth")
	const { documents, error } = await termsDocuments(supabaseServer, user.id)
	return {
		documents,
		error,
		// Where the user was headed when they were sent here
		next: safePath(url.searchParams.get("next") ?? "", url.origin) ?? "/scripts"
	}
}

export const actions = {
	// The versions the user read come from the form, and the database only accepts the current ones, so
	// a document published in the meantime can't be accepted unseen.
	accept: async ({ request, url, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })

		const data = await request.formData()
		if (data.get("agree") !== "on") return fail(400, { message: "Tick the box to accept." })

		for (const { kind } of TERMS) {
			const version = Number(data.get(kind))
			if (!Number.isSafeInteger(version) || version < 1) {
				return fail(409, { message: "The terms are not published yet. Try again later." })
			}
			const { error } = await supabaseServer
				.schema("info")
				.rpc("accept_terms", { p_kind: kind, p_version: version })
			// 23514: the version is no longer the current one
			if (error?.code === "23514") {
				return fail(409, { message: "The terms changed while you were reading. Review the new version." })
			}
			if (error) return fail(500, { message: errorRef("Could not record your acceptance", error) })
		}

		redirect(303, safePath(url.searchParams.get("next") ?? "", url.origin) ?? "/scripts")
	}
}
