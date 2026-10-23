import type { Database } from "./supabase"

export type ProfileBase = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileRole = ProfileBase["role"] | undefined
