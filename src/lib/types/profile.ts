import type { Database } from "./supabase"

type ProfileBase = Database["profiles"]["Tables"]["profiles"]["Row"]

/** The columns loaded for the logged in user, on the server (hooks.server.ts) and in the browser (+layout.ts). */
export const SESSION_PROFILE_COLUMNS = "id, username, avatar, role, banned_at"
export type SessionProfile = Pick<ProfileBase, "id" | "username" | "avatar" | "role" | "banned_at">
