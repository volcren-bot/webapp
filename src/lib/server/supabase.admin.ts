import { createClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import { SUPABASE_URL } from "$app/env/public"
import { SUPABASE_SERVICE_KEY } from "$app/env/private"

let client: ReturnType<typeof createClient<Database>> | null = null

/**
 * Bypasses RLS. Server only, and only for flows the database restricts to service_role (payments).
 * It holds no session, so one client is shared instead of building a new one per call.
 */
export const supabaseAdmin = () =>
	(client ??= createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	}))
