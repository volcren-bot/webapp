import tailwindcss from "@tailwindcss/vite"
import { sveltekit, type Config } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"

import { mdsvex, escapeSvelte } from "mdsvex"
import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"
import { getSingletonHighlighter } from "shiki"

const shikiHighlighter = await getSingletonHighlighter({
	themes: ["github-dark", "github-light"],
	langs: ["javascript", "typescript", "bash", "yml", "yaml", "json"]
})

const mdsvexOptions = {
	extensions: [".md"],
	highlight: {
		highlighter: async (code: string, lang: string | null | undefined = "text") => {
			const html = escapeSvelte(
				shikiHighlighter.codeToHtml(code, {
					lang: lang ?? "text",
					themes: { light: "github-light", dark: "github-dark" }
				})
			)
			return `{@html \`${html}\` }`
		}
	}
}

const sveltekitConfig: Config = {
	adapter: adapter(),
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	extensions: [".svelte", ".svx", ".md"],
	csp: {
		mode: "auto",
		directives: {
			// Add your Supabase domain (and any other services you use) here.
			"connect-src": [
				"self",
				"ws://localhost:*",
				"http://localhost:*",
				"https://*.supabase.co",
				"wss://*.supabase.co"
			],
			"script-src": ["self", "unsafe-inline", "wasm-unsafe-eval"],
			"img-src": [
				"self",
				"data:",
				"blob:",
				"http://localhost:*",
				"https://*.supabase.co",
				"https://cdn.discordapp.com",
				"https://avatars.githubusercontent.com",
				"https://api.dicebear.com"
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
