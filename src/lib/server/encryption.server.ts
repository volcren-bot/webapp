import { additionalData, NONCE_BYTES, TAG_BYTES } from "#lib/encryption"
import { supabaseAdmin } from "#lib/server/supabase.server"

const hexBytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16))

export async function revisionKey(scriptId: string, revision: number) {
	const { data, error } = await supabaseAdmin()
		.schema("scripts")
		.from("version_keys")
		.select("key")
		.eq("id", scriptId)
		.eq("revision", revision)
		.maybeSingle()
	if (error) throw error
	return data ? hexBytes(data.key.replace(/^\\x/, "")) : null
}

export async function decryptFile(
	sealed: Uint8Array,
	key: Uint8Array,
	scriptId: string,
	revision: number,
	name: string
) {
	const aes = await crypto.subtle.importKey("raw", key as BufferSource, "AES-GCM", false, ["decrypt"])
	const plain = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: sealed.subarray(0, NONCE_BYTES) as BufferSource,
			additionalData: additionalData(scriptId, revision, name),
			tagLength: TAG_BYTES * 8
		},
		aes,
		sealed.subarray(NONCE_BYTES) as BufferSource
	)
	return new Uint8Array(plain)
}
