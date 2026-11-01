import { createClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import { SUPABASE_URL } from "$app/env/public"
import { SUPABASE_SERVICE_KEY } from "$app/env/private"

let client: ReturnType<typeof createClient<Database>> | null = null

/** Bypasses RLS: server only, for flows restricted to service_role, with one shared client since it holds no session. */
export const supabaseAdmin = () =>
	(client ??= createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	}))
