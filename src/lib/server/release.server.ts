import { SUPABASE_URL } from "$app/env/public"

/** The public `client` bucket that the release workflow in the client repo publishes to. */
export const CLIENT_BUCKET_URL = `${SUPABASE_URL}/storage/v1/object/public/client`

export interface Download {
	name: string
	url: string
	sha256: string
}

export interface Release {
	version: string
	windows: Download | null
	linux: Download | null
}

const FETCH_TIMEOUT_MS = 5_000
// A release is reused for this long, so page views don't each hit the bucket.
const CACHE_MS = 5 * 60_000
// When the read fails, wait a little before trying again instead of retrying on every view.
const RETRY_MS = 30_000

// `YYYY.MM.DD-<7 character commit>`, as stamped by the release workflow.
const VERSION = /^\d{4}\.\d{2}\.\d{2}-[0-9a-f]{7}$/
const PATH = /^[\w.-]+\/[\w.-]+$/
const NAME = /^[\w.-]+$/
const SHA256 = /^[0-9a-f]{64}$/

let cached: { until: number; release: Release | null } | null = null

function download(entry: unknown): Download | null {
	if (typeof entry !== "object" || entry === null) return null
	const { name, path, sha256 } = entry as Record<string, unknown>
	if (typeof name !== "string" || typeof path !== "string" || typeof sha256 !== "string") return null
	if (!NAME.test(name) || !PATH.test(path) || !SHA256.test(sha256)) return null
	return { name, url: `${CLIENT_BUCKET_URL}/${path}`, sha256 }
}

/** The newest client release from the bucket's `latest.json`, cached for five minutes. Null when there is none or it can't be read. */
export async function getRelease(): Promise<Release | null> {
	if (cached && Date.now() < cached.until) return cached.release

	let release: Release | null = null
	let failed = false
	try {
		const response = await fetch(`${CLIENT_BUCKET_URL}/latest.json?t=${Date.now()}`, {
			cache: "no-store",
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
		})
		if (response.ok) {
			const manifest = (await response.json()) as {
				version?: unknown
				files?: { windows?: unknown; linux?: unknown }
			}
			if (typeof manifest.version === "string" && VERSION.test(manifest.version)) {
				release = {
					version: manifest.version,
					windows: download(manifest.files?.windows),
					linux: download(manifest.files?.linux)
				}
			}
		} else if (response.status !== 400 && response.status !== 404) {
			failed = true
			console.error("Could not read the client release manifest:", response.status)
		}
	} catch (err) {
		failed = true
		console.error("Could not read the client release manifest:", err)
	}

	// An unreachable bucket keeps showing the last good release instead of blanking the page.
	if (!release && cached?.release && failed) release = cached.release
	cached = { until: Date.now() + (failed ? RETRY_MS : CACHE_MS), release }
	return release
}
