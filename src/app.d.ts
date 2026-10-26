import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import type { SessionProfile } from "#lib/types/profile"

// Built from the verified JWT claims rather than the full Auth server objects.
type Session = { expires_at: number }
type User = { id: string; email?: string }

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabaseServer: SupabaseClient<Database>
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
			resetSession: () => void
			session: Session | null
			user: User | null
			getProfile: () => Promise<SessionProfile | null> | null
		}
		interface PageData {
			locale: string
			user: string | null
			expiresAt: number | null
			profile: SessionProfile | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
