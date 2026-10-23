import type { Session, SupabaseClient, User } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"
import type { ProfileBase } from "#lib/types/profile"

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
			getProfile: () => Promise<ProfileBase | null> | null
		}
		interface PageData {
			supabaseClient: SupabaseClient<Database>
			user: string | null
			expiresAt: number | null
			profile: ProfileBase | null
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
