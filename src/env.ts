import { defineEnvVars } from "@sveltejs/kit/env"

export const variables = defineEnvVars({
	SUPABASE_URL: { public: true, static: true },
	SUPABASE_ANON_KEY: { public: true, static: true },
	STRIPE_PUBLISHABLE_KEY: { public: true, static: true },
	SUPER_USER_ID: { public: true, static: true }
})
