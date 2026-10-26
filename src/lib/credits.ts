// 1 EUR = 10,000 credits, amounts are stored in cents (see database/CLAUDE.md)
export const CREDITS_PER_CENT = 100
export const CREDITS_PER_EUR = CREDITS_PER_CENT * 100
export const MIN_TOPUP_CENTS = 500
export const MAX_TOPUP_CENTS = 50_000
/** Bonus at MAX_TOPUP_CENTS, as a fraction of the credits bought. */
export const MAX_BONUS = 0.1

/** Logarithmic: 0 at the minimum top-up, MAX_BONUS at the maximum, never above. */
export const bonusRate = (cents: number) => {
	if (!(cents > MIN_TOPUP_CENTS)) return 0
	const progress = Math.log(cents / MIN_TOPUP_CENTS) / Math.log(MAX_TOPUP_CENTS / MIN_TOPUP_CENTS)
	return MAX_BONUS * Math.min(progress, 1)
}

/** Credits bought and the bonus on top, both whole numbers of credits. */
export const creditsFor = (cents: number) => {
	const base = cents * CREDITS_PER_CENT
	const bonus = Math.round(base * bonusRate(cents))
	return { base, bonus, total: base + bonus }
}
