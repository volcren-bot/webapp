import type { SupabaseClient } from "@supabase/supabase-js"
import { ENCRYPTION_OVERHEAD, encryptFile, encryptedSize, keyHex, newRevisionKey } from "#lib/encryption"
import { megabytes } from "#lib/scripts"
import type { Database, Json } from "#lib/types/supabase"

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
	if (!files.length) return "A revision needs at least one script file."
	if (files.length > MAX_FILES) return `At most ${MAX_FILES} files per revision.`
	const big = files.find((f) => f.size > MAX_FILE_BYTES)
	if (big) return `${big.name} is larger than ${megabytes(MAX_FILE_BYTES, locale)} MB.`
	if (new Set(files.map((f) => f.name)).size !== files.length) return "File names must be unique."
	const bad = files.find((f) => !validFileName(f.name))
	if (bad) return `${bad.name}: file names may only use letters, digits, _ . - and / between folders.`
	return null
}

export const MANIFEST_FILE = "manifest.json"
const MANIFEST_KEYS = ["queueable", "goals", "settings", "finish_grace_minutes"]
const MAX_MANIFEST_BYTES = 64 * 1024
const MAX_GOALS = 16
const MAX_FIELDS = 200
const GOAL_ID = /^[a-z][a-z0-9_]{0,31}$/

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value)

function goalsProblem(goals: unknown) {
	if (!Array.isArray(goals)) return "goals must be a list."
	if (goals.length > MAX_GOALS) return `at most ${MAX_GOALS} goals.`
	const ids = new Set<string>()
	for (const goal of goals) {
		if (!isObject(goal) || Object.keys(goal).length !== 2) return "each goal is { id, label }."
		const { id, label } = goal
		if (typeof id !== "string" || !GOAL_ID.test(id))
			return "a goal id is 1 to 32 lowercase letters, digits or _, starting with a letter."
		if (typeof label !== "string" || label.length < 1 || label.length > 64)
			return `goal ${id} needs a label of 1 to 64 characters.`
		if (ids.has(id)) return `goal ${id} is listed twice.`
		ids.add(id)
	}
	return null
}

function settingsProblem(settings: unknown) {
	if (!isObject(settings) || !Array.isArray(settings.fields))
		return "settings must be an object with a fields list."
	if (settings.fields.length > MAX_FIELDS) return `at most ${MAX_FIELDS} settings fields.`
	if (!settings.fields.every(isObject)) return "each settings field is an object."
	return null
}

export function manifestProblem(manifest: unknown) {
	if (!isObject(manifest)) return `${MANIFEST_FILE} must hold a JSON object.`
	const unknown = Object.keys(manifest).find((key) => !MANIFEST_KEYS.includes(key))
	const grace = manifest.finish_grace_minutes
	const problem = unknown
		? `unknown key "${unknown}".`
		: "queueable" in manifest && typeof manifest.queueable !== "boolean"
			? "queueable must be true or false."
			: grace !== undefined && !(Number.isInteger(grace) && Number(grace) >= 1 && Number(grace) <= 120)
				? "finish_grace_minutes must be a whole number from 1 to 120."
				: (("goals" in manifest ? goalsProblem(manifest.goals) : null) ??
					("settings" in manifest ? settingsProblem(manifest.settings) : null))
	return problem && `${MANIFEST_FILE}: ${problem}`
}

export async function readManifest(files: File[]) {
	const file = files.find((f) => f.name === MANIFEST_FILE)
	const modules = files.filter((f) => f !== file)
	if (!file) return { modules, manifest: null, problem: null }
	if (file.size > MAX_MANIFEST_BYTES)
		return { modules, manifest: null, problem: `${MANIFEST_FILE} is larger than 64 KiB.` }
	let manifest: Json
	try {
		manifest = JSON.parse(await file.text())
	} catch {
		return { modules, manifest: null, problem: `${MANIFEST_FILE} isn't valid JSON.` }
	}
	return { modules, manifest, problem: manifestProblem(manifest) }
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
export const createRevision = (
	supabase: Client,
	id: string,
	files: File[],
	entry: string,
	manifest: Json | null
) =>
	supabase
		.schema("scripts")
		.from("versions")
		.insert({
			id,
			files: files.map((f) => f.name),
			sizes: files.map((f) => encryptedSize(f.size)),
			entry,
			manifest
		} as {
			id: string
			files: string[]
			sizes: number[]
			entry: string
			manifest: Json | null
			revision: number
		})
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
