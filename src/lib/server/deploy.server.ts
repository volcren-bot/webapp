import { createHash, randomBytes } from "node:crypto"

/** Prefixed so a leaked token is easy to recognise (and to add as a secret-scanning pattern). */
const PREFIX = "vdt_"

/** Only the hash is stored (scripts.deploy_tokens.token_hash), so a database leak can't be replayed. */
export const hashDeployToken = (token: string) => createHash("sha256").update(token).digest("hex")

export function newDeployToken() {
	const token = PREFIX + randomBytes(32).toString("base64url")
	return { token, hash: hashDeployToken(token) }
}
