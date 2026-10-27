/**
 * Revision files are stored encrypted (scripts.version_keys, scripts.set_version_key): AES-256-GCM under a random key
 * per revision, laid out as nonce (12 bytes) || ciphertext || tag (16 bytes). The additional data ties a file to its
 * place, so a file copied to another script, revision or name does not open. The loader does the same in reverse.
 * Works in the browser and on the server (Web Crypto).
 */

const NONCE_BYTES = 12
const TAG_BYTES = 16

/** What encryption adds to a file's size. */
export const ENCRYPTION_OVERHEAD = NONCE_BYTES + TAG_BYTES

export const encryptedSize = (size: number) => size + ENCRYPTION_OVERHEAD

export const newRevisionKey = () => crypto.getRandomValues(new Uint8Array(32))

export const keyHex = (key: Uint8Array) => Array.from(key, (b) => b.toString(16).padStart(2, "0")).join("")

const additionalData = (scriptId: string, revision: number, name: string) =>
	new TextEncoder().encode(`volcren:${scriptId}/${String(revision).padStart(9, "0")}/${name}`)

export async function encryptFile(
	file: Blob,
	key: Uint8Array,
	scriptId: string,
	revision: number,
	name: string
) {
	const aes = await crypto.subtle.importKey("raw", key as BufferSource, "AES-GCM", false, ["encrypt"])
	const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES))
	const sealed = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: nonce,
			additionalData: additionalData(scriptId, revision, name),
			tagLength: TAG_BYTES * 8
		},
		aes,
		await file.arrayBuffer()
	)
	return new Blob([nonce, sealed], { type: "application/octet-stream" })
}
