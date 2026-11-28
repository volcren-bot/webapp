import { fail } from "@sveltejs/kit"
import { referralRules } from "#lib/server/payments.server"
import { errorRef } from "#lib/server/supabase.server"
import {
	CLAIM_MESSAGES,
	claimReferral,
	referralCode,
	REFERRAL_COOKIE,
	REFERRAL_COOKIE_DAYS
} from "#lib/server/referrals.server"

export const load = async ({ url, cookies, locals: { user, supabaseServer } }) => {
	const invite = referralCode(url.searchParams.get("ref"))
	if (invite && !user) {
		cookies.set(REFERRAL_COOKIE, invite, {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS
		})
	}

	const rules = await referralRules()
	if (!user)
		return {
			rules,
			invite: invite ?? referralCode(cookies.get(REFERRAL_COOKIE)),
			signedIn: false,
			mine: null
		}

	const [profile, referrals, own] = await Promise.all([
		supabaseServer.schema("profiles").from("profiles").select("referral_code").eq("id", user.id).single(),
		supabaseServer.schema("payments").rpc("list_referrals"),
		supabaseServer.schema("payments").rpc("own_referral").maybeSingle()
	])
	const failed = profile.error ?? referrals.error ?? own.error
	if (failed || !profile.data) {
		return {
			rules,
			invite,
			signedIn: true,
			mine: null,
			loadError: errorRef("Could not load your referrals", failed)
		}
	}

	return {
		rules,
		invite,
		signedIn: true,
		mine: {
			link: `${url.origin}/referrals?ref=${profile.data.referral_code}`,
			referrals: referrals.data ?? [],
			own: own.data
		}
	}
}

export const actions = {
	claim: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { claimMessage: "You need to login." })
		const code = referralCode(String((await request.formData()).get("code") ?? ""))
		if (!code) return fail(400, { claimMessage: CLAIM_MESSAGES.invalid })

		try {
			const status = await claimReferral(supabaseServer, code)
			const claimMessage = CLAIM_MESSAGES[status] ?? CLAIM_MESSAGES.invalid
			return status === "claimed" ? { claimMessage } : fail(409, { claimMessage })
		} catch (e) {
			return fail(500, { claimMessage: errorRef("Could not accept the invite", e) })
		}
	}
}
