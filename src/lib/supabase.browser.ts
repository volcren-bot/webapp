import type { Database } from "#lib/types/supabase"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "$app/env/public"

// Loaded on demand so the Supabase client stays out of the initial bundle
export const getSupabaseBrowser = () =>
	import("@supabase/ssr").then(({ createBrowserClient }) =>
		createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
	)
