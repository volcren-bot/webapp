import { defineEnvVars } from "@sveltejs/kit/env"

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_ANON_KEY: { public: true, static: true },
	PUBLIC_STRIPE_PUBLISHABLE_KEY: { public: true, static: true },
	PUBLIC_SUPER_USER_ID: { public: true, static: true }
})
