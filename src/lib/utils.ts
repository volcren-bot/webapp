import type { AuthError, PostgrestError } from "@supabase/supabase-js"

export const SITE_NAME = "VOLCREN"
export const SITE_DESCRIPTION = "Most advanced memory reading bot"
export const WEBSITE_URL = "https://example.com"

// Any top-level page placed in src/routes/(nav)/<name>/+page.svelte becomes a nav tab.
// "Home" is the first tab and the root route.
const navPages = import.meta.glob("/src/routes/**/+page.svelte")

function topLevelPages(group: string) {
	const re = new RegExp(`^/src/routes/\\(${group}\\)/[^/]+/\\+page\\.svelte$`)
	return Object.keys(navPages)
		.filter((p) => re.test(p))
		.map((p) => p.split("/")[4])
		.filter((name) => !name.includes("["))
		.sort()
		.map((name) => name[0].toUpperCase() + name.slice(1))
}

export const NAV_ROUTES = ["Home", ...topLevelPages("nav")]

// Any top-level page placed in src/routes/(user)/<name>/+page.svelte is a nav tab for logged-in users only.
export const USER_ROUTES = topLevelPages("user")

// Pages nested one level below a nav page, keyed by the lowercase parent name.
export const NAV_CHILDREN: Record<string, string[]> = {}
for (const p of Object.keys(navPages)) {
	const match = p.match(/^\/src\/routes\/\(nav\)\/([^/[]+)\/([^/[]+)\/\+page\.svelte$/)
	if (match) (NAV_CHILDREN[match[1]] ??= []).push(match[2])
}
for (const children of Object.values(NAV_CHILDREN)) children.sort()

export function routeHref(route: string): string {
	return "/" + route.toLowerCase().replace("home", "")
}

export const UUID_V4_REGEX =
	/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i

export function formatError(err: AuthError | PostgrestError) {
	const id = crypto.randomUUID().slice(0, 8)
	console.error(`[${id}]`, err)
	return `${err.message} (ref: ${id})`
}

export function metaDescription(str: string | null | undefined, length = 155) {
	const text = (str ?? "").replace(/\s+/g, " ").trim()
	if (text.length <= length) return text
	const cut = text.substring(0, length - 1)
	const space = cut.lastIndexOf(" ")
	return (space > length / 2 ? cut.substring(0, space) : cut).replace(/[\s.,;:!?-]+$/, "") + "…"
}

export function cropString(str: string, length = 80) {
	return str.length > length ? str.substring(0, length) + "..." : str
}

export function formatNumber(n: number): string {
	let i = 0
	let f: number = n
	const arr: string[] = ["", "K", "M", "B", "T"]

	while (Math.abs(f) >= 1000) {
		i++
		f = f / 1000
	}

	return parseFloat(f.toFixed(2)).toString() + arr[i]
}

export function groupBy<T, K>(items: T[], key: (item: T) => K) {
	const groups = new Map<K, T[]>()
	for (const item of items) {
		const k = key(item)
		const group = groups.get(k)
		if (group) group.push(item)
		else groups.set(k, [item])
	}
	return groups
}

const PROVIDER_NAMES: Record<string, string> = { bitcart: "Bitcart", stripe: "Stripe", molly: "Mollie" }

/** Where a credits ledger entry came from, in words a user understands. */
export const creditSource = (entry: { kind: string; provider: string | null }) => {
	switch (entry.kind) {
		case "topup":
			return entry.provider ? `Top-up via ${PROVIDER_NAMES[entry.provider] ?? entry.provider}` : "Top-up"
		case "usage":
			return "Script usage"
		case "transfer":
			return "Moved from earnings"
		case "refund":
			return "Refund"
		case "adjustment":
			return "Adjusted by staff"
		default:
			return entry.kind
	}
}

/** "1,250 credits" */
export const formatCredits = (credits: number, locale = "en-US") =>
	`${credits.toLocaleString(locale)} ${credits === 1 ? "credit" : "credits"}`
