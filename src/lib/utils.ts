export const SITE_NAME = "VOLCREN"
export const SITE_DESCRIPTION = "Most advanced memory reading bot"

/** Any UUID, as Postgres prints it. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const DEFAULT_LOCALE = "en-US"

/** Best locale from the request's Accept-Language header, falling back to en-US if it isn't one Intl knows. */
export const localeFrom = (request: Request) => {
	const first = request.headers.get("accept-language")?.split(",")[0]?.split(";")[0]?.trim()
	if (!first || first === "*") return DEFAULT_LOCALE
	try {
		return Intl.getCanonicalLocales(first)[0] ?? DEFAULT_LOCALE
	} catch {
		return DEFAULT_LOCALE
	}
}

/** Matches the text literally inside a LIKE pattern. */
export const likeEscape = (text: string) => text.replace(/[\\%_]/g, "\\$&")

/** `url` with one query parameter set, or removed when `value` is null; the bare path when no query is left. */
export function withParam(url: { search: string; pathname: string }, key: string, value: string | null) {
	const params = new URLSearchParams(url.search)
	if (value) params.set(key, value)
	else params.delete(key)
	const query = params.toString()
	return query ? `?${query}` : url.pathname
}

export function metaDescription(str: string | null | undefined, length = 155) {
	const text = (str ?? "").replace(/\s+/g, " ").trim()
	if (text.length <= length) return text
	const cut = text.substring(0, length - 1)
	const space = cut.lastIndexOf(" ")
	return (space > length / 2 ? cut.substring(0, space) : cut).replace(/[\s.,;:!?-]+$/, "") + "…"
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
const DISPLAY_CREDITS_PER_UNIT = 10_000

/** "12", "12.50", "0.001"; `full` always shows every decimal, "12.5000", for account balances. */
export const formatCreditAmount = (credits: number, locale = DEFAULT_LOCALE, full = false) => {
	const amount = credits / DISPLAY_CREDITS_PER_UNIT
	return amount.toLocaleString(locale, {
		minimumFractionDigits: full ? 4 : Number.isInteger(amount) ? 0 : 2,
		maximumFractionDigits: 4
	})
}

/** "12.50 CREDIT": the unit is written like a currency code, never plural. */
export const formatCredits = (credits: number, locale = DEFAULT_LOCALE, full = false) =>
	`${formatCreditAmount(credits, locale, full)}\u00a0CREDIT`

/** "€12", "€12.50"; `code` writes "12.50 EUR", to sit beside "12.50 CREDIT". */
export const formatEur = (cents: number, locale = DEFAULT_LOCALE, code = false) => {
	const minimumFractionDigits = Number.isInteger(cents / 100) ? 0 : 2
	return code
		? `${(cents / 100).toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits: 2 })}\u00a0EUR`
		: (cents / 100).toLocaleString(locale, { style: "currency", currency: "EUR", minimumFractionDigits })
}

export const formatDate = (value: string | number | Date, locale = DEFAULT_LOCALE) =>
	new Date(value).toLocaleDateString(locale)

export const formatDateTime = (value: string | number | Date, locale = DEFAULT_LOCALE) =>
	new Date(value).toLocaleString(locale)
