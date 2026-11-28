import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "#lib/types/supabase"

export const REFERRAL_COOKIE = "referral_code"
export const REFERRAL_COOKIE_DAYS = 7

const CODE = /^[0-9a-f]{12}$/

export function referralCode(raw: string | null | undefined) {
	const code = raw?.trim().toLowerCase()
	return code && CODE.test(code) ? code : null
}

export const CLAIM_MESSAGES: Record<string, string> = {
	claimed: "You joined through the invite.",
	invalid: "This invite link isn't valid.",
	own: "You can't use your own invite link.",
	already_referred: "Your account has already joined through an invite.",
	not_new: "Only new accounts can join through an invite, before they run a script or buy CREDIT.",
	unavailable: "Invites can't be accepted right now. Try again later."
}

export async function claimReferral(supabase: SupabaseClient<Database>, code: string) {
	const { data, error } = await supabase.schema("payments").rpc("claim_referral", { p_code: code })
	if (error) throw error
	return data
}
