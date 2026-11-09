import type { SupabaseClient } from "@supabase/supabase-js"
import { ENCRYPTION_OVERHEAD, encryptFile, encryptedSize, keyHex, newRevisionKey } from "#lib/encryption"
import { megabytes } from "#lib/scripts"
import type { Database } from "#lib/types/supabase"

export const MAX_FILES = 50
/** The scripts bucket allows 5 MB per object, and the encrypted file is a little larger than the plain one. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024 - ENCRYPTION_OVERHEAD
const UPLOAD_CONCURRENCY = 6

type Client = SupabaseClient<Database>

/** A file path inside a revision: letters, digits, _ . - and / between segments, no "." or ".." segment, at most 200 characters (as in scripts.valid_files). */
const validFileName = (name: string) =>
	name.length <= 200 &&
	name.split("/").every((part) => /^[A-Za-z0-9_.-]+$/.test(part) && part !== "." && part !== "..")

/** Why these files can't make a revision, or null when they can. */
export function filesProblem(files: { name: string; size: number }[], locale: string) {
	if (files.length > MAX_FILES) return `At most ${MAX_FILES} files per revision.`
	const big = files.find((f) => f.size > MAX_FILE_BYTES)
	if (big) return `${big.name} is larger than ${megabytes(MAX_FILE_BYTES, locale)} MB.`
	if (new Set(files.map((f) => f.name)).size !== files.length) return "File names must be unique."
	const bad = files.find((f) => !validFileName(f.name))
	if (bad) return `${bad.name}: file names may only use letters, digits, _ . - and / between folders.`
	return null
}

/** Runs `upload` over the files a few at a time; after the first error no new uploads start and it is thrown once those in flight settle. */
async function uploadAll(files: File[], upload: (file: File) => Promise<void>) {
	const queue = [...files]
	const errors: unknown[] = []
	const worker = async () => {
		for (let file = queue.shift(); file && !errors.length; file = queue.shift()) {
			try {
				await upload(file)
			} catch (error) {
				errors.push(error)
			}
		}
	}
	await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker))
	if (errors.length) throw errors[0]
}

/** Inserts the pending revision. Clients may only insert these columns (column grants), the sizes tell the database what is coming, and a trigger assigns the revision, so the generated type's required `revision` is cast away. */
export const createRevision = (supabase: Client, id: string, files: File[], entry: string) =>
	supabase
		.schema("scripts")
		.from("versions")
		.insert({
			id,
			files: files.map((f) => f.name),
			sizes: files.map((f) => encryptedSize(f.size)),
			entry
		} as { id: string; files: string[]; sizes: number[]; entry: string; revision: number })
		.select("revision")
		.single()

/** Stores the files encrypted under a fresh key, which the database keeps for the loader, and makes the revision live. A pending revision blocks the next one, so any failure discards it before rethrowing. */
export async function storeRevision(
	supabase: Client,
	id: string,
	revision: number,
	files: File[],
	onUploaded?: (done: number) => void
) {
	const scripts = supabase.schema("scripts")
	try {
		const key = newRevisionKey()
		const keyed = await scripts.rpc("set_version_key", { script_id: id, revision, key: keyHex(key) })
		if (keyed.error) throw keyed.error

		const folder = `${id}/${String(revision).padStart(9, "0")}`
		let done = 0
		await uploadAll(files, async (file) => {
			const sealed = await encryptFile(file, key, id, revision, file.name)
			const { error } = await supabase.storage.from("scripts").upload(`${folder}/${file.name}`, sealed)
			if (error) throw error
			onUploaded?.(++done)
		})

		const published = await scripts.rpc("publish_version", { script_id: id, revision })
		if (published.error) throw published.error
	} catch (e) {
		await scripts.rpc("discard_version", { script_id: id, revision })
		throw e
	}
}
