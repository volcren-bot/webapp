type TutorialModule = { title: string; description: string; order: number }

// Every directory under /tutorials is one tutorial; its name is the URL and the page exports the rest.
const pages = import.meta.glob<TutorialModule>("/src/routes/*/tutorials/*/+page.svelte", {
	eager: true
})

export const tutorials = Object.entries(pages)
	.map(([path, m]) => ({
		id: path.split("/").at(-2)!,
		title: m.title,
		description: m.description,
		order: m.order
	}))
	.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
