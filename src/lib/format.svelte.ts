import { page } from "$app/state"
import { SvelteDate } from "svelte/reactivity"
import { formatCredits } from "#lib/utils"
import { formatPrice } from "#lib/scripts"

const DEFAULT_LOCALE = "en-US"

/** Best locale from an Accept-Language header, falling back to en-US if it isn't one Intl knows. */
export const localeFrom = (acceptLanguage: string | null | undefined) => {
	const first = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim()
	if (!first || first === "*") return DEFAULT_LOCALE
	try {
		return Intl.getCanonicalLocales(first)[0] ?? DEFAULT_LOCALE
	} catch {
		return DEFAULT_LOCALE
	}
}

const locale = () => page.data.locale ?? DEFAULT_LOCALE

/**
 * Locale-aware formatting. The locale comes from the request's Accept-Language header (via the root layout),
 * so server and client render the same text and hydration doesn't mismatch.
 */
export const fmt = {
	get locale() {
		return locale()
	},
	number: (n: number, options?: Intl.NumberFormatOptions) => n.toLocaleString(locale(), options),
	credits: (credits: number) => formatCredits(credits, locale()),
	price: (credits: number) => formatPrice(credits, locale()),
	eur: (cents: number) => (cents / 100).toLocaleString(locale(), { style: "currency", currency: "EUR" }),
	percent: (fraction: number, digits = 1) =>
		fraction.toLocaleString(locale(), { style: "percent", maximumFractionDigits: digits }),
	date: (value: string | number | Date) => new SvelteDate(value).toLocaleDateString(locale()),
	dateTime: (value: string | number | Date) => new SvelteDate(value).toLocaleString(locale())
}
