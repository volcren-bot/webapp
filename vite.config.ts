import tailwindcss from "@tailwindcss/vite"
import { sveltekit, type Config } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

const sveltekitConfig: Config = {
	adapter: adapter(),
	preprocess: [vitePreprocess()],
	csp: {
		mode: "auto",
		directives: {
			"connect-src": [
				"self",
				"ws://localhost:*",
				"http://localhost:*",
				"https://db.volcren.com",
				"wss://db.volcren.com"
			],
			"script-src": ["self", "unsafe-inline", "wasm-unsafe-eval"],
			"img-src": [
				"self",
				"data:",
				"blob:",
				"http://localhost:*",
				"https://db.volcren.com",
				"https://cdn.discordapp.com"
			],
			"base-uri": ["self"],
			"object-src": ["none"]
		}
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(sveltekitConfig)],
	build: { target: "es2022" }
})
