import type { AuthError, PostgrestError } from "@supabase/supabase-js"

export const SITE_NAME = "Volcren"
export const SITE_DESCRIPTION = "A botting platform."
export const WEBSITE_URL = "https://example.com"

// Add your pages here. "Home" is the first tab and the root route.
export const NAV_ROUTES = ["Home", "Scripts", "Stats", "Information", "Tutorials"]

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
