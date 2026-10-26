import { error, json } from "@sveltejs/kit"
import { MAX_FILES, MAX_FILE_BYTES } from "#lib/scripts"
import { hashDeployToken } from "#lib/server/deploy.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** A path inside the revision folder: plain segments, no "." or ".." and no leading or trailing slash. */
const validName = (name: string) =>
	name.length <= 200 &&
	name.split("/").every((part) => /^[\w.-]+$/.test(part) && part !== "." && part !== "..")

/**
 * CI uploads a revision with a deploy token (see the script page):
 *   curl -H "Authorization: Bearer $TOKEN" -H "Origin: <site>" -F files=@main.luau <site>/api/scripts/<id>/revisions
 * The Origin header is only there to pass SvelteKit's CSRF check for multipart bodies; the token is the auth.
 * Does what RevisionUpload does in the browser, as service_role once the token checks out.
 */
export const POST = async ({ request, params }) => {
	const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1]
	if (!token) error(401, "Missing deploy token")
	if (!UUID.test(params.id)) error(404, "Script not found")

	const admin = supabaseAdmin()
	const scripts = admin.schema("scripts")

	// Checked before the body is read, so an unauthenticated caller can't make us buffer an upload
	const { error: tokenErr } = await scripts.rpc("use_deploy_token", {
		p_script: params.id,
		p_token_hash: hashDeployToken(token)
	})
	if (tokenErr?.code === "42501") error(401, "Invalid deploy token for this script")
	if (tokenErr) error(500, errorRef("Could not check the deploy token", tokenErr))

	const form = await request.formData().catch(() => null)
	const files = (form?.getAll("files") ?? []).filter((entry) => entry instanceof File)
	const names = files.map((file) => file.name)

	if (!files.length) error(400, 'Send the revision\'s files as multipart "files" fields.')
	if (files.length > MAX_FILES) error(400, `At most ${MAX_FILES} files per revision.`)
	if (new Set(names).size !== names.length) error(400, "File names must be unique.")
	const badName = names.find((name) => !validName(name))
	if (badName != null) error(400, `Invalid file name: ${badName}`)
	const big = files.find((file) => file.size > MAX_FILE_BYTES)
	if (big) error(400, `${big.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`)

	// A trigger assigns the revision, so the generated type's required `revision` is cast away (see RevisionUpload)
	const created = await scripts
		.from("versions")
		.insert({ id: params.id, files: names } as { id: string; files: string[]; revision: number })
		.select("revision")
		.single()
	if (created.error?.code === "23505") {
		error(409, "Another revision of this script is still pending. Discard it before uploading a new one.")
	}
	if (created.error) error(500, errorRef("Could not create the revision", created.error))

	const revision = created.data.revision
	const folder = `${params.id}/${String(revision).padStart(9, "0")}`

	try {
		for (const file of files) {
			const { error: err } = await admin.storage.from("scripts").upload(`${folder}/${file.name}`, file)
			if (err) throw err
		}
		const { error: err } = await scripts.rpc("publish_version", { script_id: params.id, revision })
		if (err) throw err
	} catch (e) {
		// A pending revision blocks the next one, so drop it.
		await scripts.rpc("discard_version", { script_id: params.id, revision })
		error(500, errorRef(`Could not publish revision ${revision}`, e))
	}

	return json({ revision }, { status: 201 })
}
