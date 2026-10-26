import { listKey } from "./shortcuts.svelte.js"

type FaqModule = { question: string; order: number }

// Every directory under /information/faq is one question; its name is the URL and the page exports the rest.
const pages = import.meta.glob<FaqModule>("/src/routes/*/information/faq/*/+page.svelte", {
	eager: true
})

export const faqs = Object.entries(pages)
	.map(([path, m]) => ({ id: path.split("/").at(-2)!, q: m.question, order: m.order }))
	.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
	.map(({ id, q }, i) => ({ id, q, key: listKey(i) }))
