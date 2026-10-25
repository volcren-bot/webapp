import type { Database } from "./supabase"

export type ProfileBase = Database["profiles"]["Tables"]["profiles"]["Row"]
export type ProfileRole = ProfileBase["role"] | undefined
