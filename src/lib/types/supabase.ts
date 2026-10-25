// Minimal database types for the template. Once your Supabase project is set up, regenerate with:
//   pnpm dlx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	profiles: {
		Tables: {
			profiles: {
				Row: {
					id: string
					username: string
					avatar: string
					role: Database["profiles"]["Enums"]["roles"]
				}
				Insert: {
					id: string
					username?: string
					avatar?: string
					role?: Database["profiles"]["Enums"]["roles"]
				}
				Update: {
					id?: string
					username?: string
					avatar?: string
					role?: Database["profiles"]["Enums"]["roles"]
				}
				Relationships: []
			}
		}
		Views: { [_ in never]: never }
		Functions: { [_ in never]: never }
		Enums: {
			roles: "user" | "contributor" | "tester" | "scripter" | "moderator" | "administrator"
		}
		CompositeTypes: { [_ in never]: never }
	}
	public: {
		Tables: { [_ in never]: never }
		Views: { [_ in never]: never }
		Functions: { [_ in never]: never }
		Enums: { [_ in never]: never }
		CompositeTypes: { [_ in never]: never }
	}
}
