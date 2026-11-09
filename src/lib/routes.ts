import { faqs } from "./faqs"

/** One page in the route tree. `key` is unique among its siblings and empty once a level runs out of keys. */
export type RouteNode = {
	name: string
	href: string
	key: string
	children: RouteNode[]
}

type Viewer = { member: boolean; admin: boolean; scripts: string[] }

// Every static page. Route groups like (nav) are not part of the URL.
const PAGES = Object.keys(import.meta.glob("/src/routes/**/+page.svelte"))
	.map((path) => ({
		href:
			path
				.slice("/src/routes".length, -"/+page.svelte".length)
				.split("/")
				.filter((part) => !part.startsWith("("))
				.join("/") || "/",
		member: path.includes("/(user)/")
	}))
	.filter(({ href }) => !href.includes("["))

const MEMBER_ONLY = ["/scripts/new"]
const ADMIN_ONLY = ["/admin"]

// Pages listed in a fixed order instead of by name; negative values come before every named page.
const ORDER = new Map([
	["/scripts/new", -1],
	...faqs.map((faq, i): [string, number] => [`/information/faq/${faq.id}`, i])
])

const KEYS = "abcdefghijklmnopqrstuvwxyz0123456789"

/** The first letter of the name that no sibling took, then the first free letter overall. */
function pickKey(name: string, taken: Set<string>) {
	const key =
		[...name.toLowerCase()].find((c) => KEYS.includes(c) && !taken.has(c)) ??
		[...KEYS].find((c) => !taken.has(c)) ??
		""
	taken.add(key)
	return key
}

function byOrder(a: RouteNode, b: RouteNode) {
	return (ORDER.get(a.href) ?? 0) - (ORDER.get(b.href) ?? 0) || a.name.localeCompare(b.name)
}

function assignKeys(nodes: RouteNode[]) {
	const taken = new Set<string>()
	for (const node of nodes) node.key = pickKey(node.name, taken)
}

function finish(node: RouteNode) {
	node.children.sort(byOrder)
	// Home shares a level with its children, so `g` can reach it too.
	assignKeys(options(node))
	for (const child of node.children) finish(child)
}

/** The pages this viewer may open, nested by URL, with a key per node that is unique among its siblings. */
export function routeTree(viewer: Viewer): RouteNode {
	const hrefs = [
		...PAGES.filter(
			({ href, member }) =>
				(viewer.member || !(member || MEMBER_ONLY.includes(href))) &&
				(viewer.admin || !ADMIN_ONLY.includes(href))
		).map(({ href }) => href),
		...viewer.scripts.map((url) => `/scripts/${url}`)
	]
	const nodes = new Map<string, RouteNode>()
	for (const href of hrefs) {
		const name = href === "/" ? "home" : href.slice(href.lastIndexOf("/") + 1)
		nodes.set(href, { name, href, key: "", children: [] })
	}
	const root = nodes.get("/")!
	for (const node of nodes.values()) {
		if (node === root) continue
		// A page whose parent is not a page hangs from the nearest ancestor that is.
		let parent = node.href
		do parent = parent.slice(0, parent.lastIndexOf("/")) || "/"
		while (!nodes.has(parent))
		nodes.get(parent)!.children.push(node)
	}
	finish(root)
	return root
}

/** The rows the go panel offers at a node: its children, plus home itself at the root. */
export function options(node: RouteNode): RouteNode[] {
	return node.href === "/" ? [node, ...node.children] : node.children
}

/** Every page with the keys that reach it, e.g. ["g", "i", "f"], in tree order. */
export function sequences(root: RouteNode, prefix = ["g"]): { node: RouteNode; keys: string[] }[] {
	const own = { node: root, keys: [...prefix, root.key] }
	const rest = root.children.flatMap((child) => sequences(child, root.href === "/" ? prefix : own.keys))
	return [own, ...rest]
}
