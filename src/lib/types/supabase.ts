// Minimal database types for the template. Once your Supabase project is set up, regenerate with:
//   pnpm dlx supabase gen types typescript --project-id <id> > src/lib/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
	public: {
		Tables: {
			profiles: {
				Row: {
					id: string
					username: string
					avatar: string
					role: Database["public"]["Enums"]["roles"]
				}
				Insert: {
					id: string
					username?: string
					avatar?: string
					role?: Database["public"]["Enums"]["roles"]
				}
				Update: {
					id?: string
					username?: string
					avatar?: string
					role?: Database["public"]["Enums"]["roles"]
				}
				Relationships: []
			}
		}
		Views: { [_ in never]: never }
		Functions: { [_ in never]: never }
		Enums: {
			roles: "user" | "administrator"
		}
		CompositeTypes: { [_ in never]: never }
	}
}
