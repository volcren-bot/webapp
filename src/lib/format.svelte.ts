import { page } from "$app/state"
import {
	DEFAULT_LOCALE,
	formatCreditAmount,
	formatCredits,
	formatDate,
	formatDateTime,
	formatEur
} from "#lib/utils"
import { formatPrice, formatPriceInput, megabytes, parsePrice } from "#lib/scripts"

const locale = () => page.data.locale ?? DEFAULT_LOCALE

/** Locale-aware formatting from the request's Accept-Language header (via the root layout), so server and client render the same text. */
export const fmt = {
	get locale() {
		return locale()
	},
	number: (n: number, options?: Intl.NumberFormatOptions) => n.toLocaleString(locale(), options),
	credits: (microcredits: number, full = false) => formatCredits(microcredits, locale(), full),
	creditAmount: (microcredits: number, full = false) => formatCreditAmount(microcredits, locale(), full),
	price: (price: number) => formatPrice(price, locale()),
	priceInput: (price: number) => formatPriceInput(price, locale()),
	parsePrice: (raw: string) => parsePrice(raw, locale()),
	eur: (cents: number, code = false) => formatEur(cents, locale(), code),
	megabytes: (bytes: number) => megabytes(bytes, locale()),
	percent: (fraction: number, digits = 1) =>
		fraction.toLocaleString(locale(), { style: "percent", maximumFractionDigits: digits }),
	date: (value: string | number | Date) => formatDate(value, locale()),
	dateTime: (value: string | number | Date) => formatDateTime(value, locale())
}
