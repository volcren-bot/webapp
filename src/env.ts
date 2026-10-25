import { defineEnvVars } from "@sveltejs/kit/env"

export const variables = defineEnvVars({
	SUPABASE_URL: { public: true, static: true },
	SUPABASE_ANON_KEY: { public: true, static: true },
	SUPABASE_SERVICE_KEY: { public: false, static: false },
	BITCART_API_URL: { public: false, static: false },
	BITCART_API_TOKEN: { public: false, static: false },
	BITCART_STORE_ID: { public: false, static: false }
})
