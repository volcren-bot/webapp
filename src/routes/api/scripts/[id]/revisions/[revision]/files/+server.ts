import { error, isHttpError } from "@sveltejs/kit"
import { MANIFEST_FILE, revisionFolder } from "#lib/revisions"
import { roleAtLeast } from "#lib/scripts"
import { decryptFile, revisionKey } from "#lib/server/encryption.server"
import { errorRef } from "#lib/server/supabase.server"
import { zip, type ZipEntry } from "#lib/server/zip.server"
import { UUID } from "#lib/utils"

const MAX_REVISION = 999_999_999

export const GET = async ({ params, locals: { supabaseServer, user, getProfile } }) => {
	if (!user) error(401, "Log in to download revisions.")
	const revision = Number(params.revision)
	if (!UUID.test(params.id) || !Number.isInteger(revision) || revision < 1 || revision > MAX_REVISION) {
		error(404, "Revision not found")
	}

	const scripts = supabaseServer.schema("scripts")
	const [author, profile] = await Promise.all([
		scripts.rpc("is_author", { user_id: user.id, script_id: params.id }),
		getProfile()
	])
	if (author.error) error(500, errorRef("Could not check the script's author", author.error))
	if (author.data !== true && !roleAtLeast(profile?.role, "moderator")) {
		error(403, "Only the script's author and moderators can download its revisions.")
	}

	const { data: version, error: versionErr } = await scripts
		.from("versions")
		.select("files, manifest")
		.eq("id", params.id)
		.eq("revision", revision)
		.maybeSingle()
	if (versionErr) error(500, errorRef("Could not read the revision", versionErr))
	if (!version) error(404, "Revision not found")

	const folder = revisionFolder(params.id, revision)
	const storage = supabaseServer.storage.from("scripts")
	let entries: ZipEntry[]
	try {
		const key = await revisionKey(params.id, revision)
		entries = await Promise.all(
			version.files.map(async (name) => {
				const path = `${folder}/${name}`
				const { data, error: downloadErr } = await storage.download(path)
				if (!data) {
					if ((await storage.exists(path)).data === false)
						error(410, "This revision's files are no longer stored.")
					throw downloadErr
				}
				const sealed = new Uint8Array(await data.arrayBuffer())
				return { name, bytes: key ? await decryptFile(sealed, key, params.id, revision, name) : sealed }
			})
		)
	} catch (e) {
		if (isHttpError(e)) throw e
		error(500, errorRef(`Could not read revision ${revision}'s files`, e))
	}
	if (version.manifest != null) {
		entries.push({
			name: MANIFEST_FILE,
			bytes: new TextEncoder().encode(JSON.stringify(version.manifest, null, "\t") + "\n")
		})
	}

	return new Response(zip(entries), {
		headers: {
			"content-type": "application/zip",
			"content-disposition": `attachment; filename="${params.id}-r${revision}.zip"`,
			"cache-control": "private, no-store"
		}
	})
}
