import { createClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import { SUPABASE_URL } from "$app/env/public"
import { SUPABASE_SERVICE_KEY } from "$app/env/private"

/** Bypasses RLS. Server only, and only for flows the database restricts to service_role (payments). */
export const supabaseAdmin = () =>
	createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	})
