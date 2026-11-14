import { error, json } from "@sveltejs/kit"
import { createRevision, filesProblem, readManifest, storeRevision } from "#lib/revisions"
import { hashDeployToken } from "#lib/server/deploy.server"
import { refreshScript } from "#lib/server/scripts.cache"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { localeFrom, UUID } from "#lib/utils"

/** CI uploads a revision with a deploy token: curl -H "Authorization: Bearer $TOKEN" -H "Origin: <site>" -F files=@main.luau -F files=@manifest.json -F entry=main.luau <site>/api/scripts/<id>/revisions (entry optional for one file; Origin passes the CSRF check). */
export const POST = async ({ request, params }) => {
	const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/)?.[1]
	if (!token) error(401, "Missing deploy token")
	if (!UUID.test(params.id)) error(404, "Script not found")

	const admin = supabaseAdmin()

	// Checked before the body is read, so an unauthenticated caller can't make us buffer an upload
	const { error: tokenErr } = await admin.schema("scripts").rpc("use_deploy_token", {
		p_script: params.id,
		p_token_hash: hashDeployToken(token)
	})
	if (tokenErr?.code === "42501") error(401, "Invalid deploy token for this script")
	if (tokenErr) error(500, errorRef("Could not check the deploy token", tokenErr))

	const form = await request.formData().catch(() => null)
	const uploaded = (form?.getAll("files") ?? []).filter((entry) => entry instanceof File)
	if (!uploaded.length) error(400, 'Send the revision\'s files as multipart "files" fields.')
	const { modules: files, manifest, problem: manifestProblem } = await readManifest(uploaded)
	if (manifestProblem) error(400, manifestProblem)
	const names = files.map((file) => file.name)
	const entryField = form?.get("entry")
	const entry =
		typeof entryField === "string" && entryField ? entryField : files.length === 1 ? names[0] : null
	if (!entry) error(400, 'A revision with several files needs an "entry" field naming the file to run.')
	if (!names.includes(entry)) error(400, `The entry file ${entry} is not one of the uploaded files.`)
	const problem = filesProblem(files, localeFrom(request))
	if (problem) error(400, problem)

	const created = await createRevision(admin, params.id, files, entry, manifest)
	if (created.error?.code === "23505") {
		error(409, "Another revision of this script is still pending. Discard it before uploading a new one.")
	}
	// 23514: a community author's storage is full
	if (created.error?.code === "23514") error(413, created.error.message)
	if (created.error) error(500, errorRef("Could not create the revision", created.error))

	const revision = created.data.revision
	try {
		await storeRevision(admin, params.id, revision, files)
	} catch (e) {
		error(500, errorRef(`Could not publish revision ${revision}`, e))
	}
	await refreshScript(params.id)

	return json({ revision }, { status: 201 })
}
