import type { AuthError, PostgrestError } from "@supabase/supabase-js"

export const SITE_NAME = "VOLCREN"
export const SITE_DESCRIPTION = "Most advanced memory reading bot"
export const WEBSITE_URL = "https://example.com"

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

/** Credits are shown at 1 = 1 EUR, with as many decimals as the amount needs (a single internal credit is 0.0001). */
export const DISPLAY_CREDITS_PER_UNIT = 10_000

/** "12.50", "0.0010" */
export const formatCreditAmount = (credits: number, locale = "en-US") =>
	(credits / DISPLAY_CREDITS_PER_UNIT).toLocaleString(locale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 4
	})

/** "12.50 credits" */
export const formatCredits = (credits: number, locale = "en-US") =>
	`${formatCreditAmount(credits, locale)} credits`

/** "€12.50" */
export const formatEur = (cents: number, locale = "en-US") =>
	(cents / 100).toLocaleString(locale, { style: "currency", currency: "EUR" })
