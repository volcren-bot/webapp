// 1 CREDIT = 1 EUR = 1,000,000 microcredits, payment amounts are stored in cents (see database/CLAUDE.md)
export const MICROCREDITS_PER_CENT = 10_000
export const MICROCREDITS_PER_CREDIT = MICROCREDITS_PER_CENT * 100
export const MIN_TOPUP_CENTS = 500
export const MAX_TOPUP_CENTS = 50_000
/** 30 days of 24 hours: the unit script prices and the extra-session fee are quoted in (payments.minutes_per_month). */
export const MINUTES_PER_MONTH = 30 * 24 * 60
/** Bonus at MAX_TOPUP_CENTS, as a fraction of the microcredits bought. */
const MAX_BONUS = 0.1

/** Logarithmic: 0 at the minimum top-up, MAX_BONUS at the maximum, never above. */
export const bonusRate = (cents: number) => {
	if (!(cents > MIN_TOPUP_CENTS)) return 0
	const progress = Math.log(cents / MIN_TOPUP_CENTS) / Math.log(MAX_TOPUP_CENTS / MIN_TOPUP_CENTS)
	return MAX_BONUS * Math.min(progress, 1)
}

/** Microcredits bought and the bonus on top, both whole numbers of microcredits. */
export const microcreditsFor = (cents: number) => {
	const base = cents * MICROCREDITS_PER_CENT
	const bonus = Math.round(base * bonusRate(cents))
	return { base, bonus, total: base + bonus }
}
