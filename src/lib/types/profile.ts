import type { Database } from "./supabase"

export type ProfileBase = Database["profiles"]["Tables"]["profiles"]["Row"]
export type ProfileRole = ProfileBase["role"] | undefined
/** The columns hooks.server.ts loads for the logged in user */
export type SessionProfile = Pick<ProfileBase, "id" | "username" | "avatar" | "role" | "banned_at">
