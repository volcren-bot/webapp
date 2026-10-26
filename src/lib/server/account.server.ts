import { openPayments } from "#lib/server/payments.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"

/**
 * Why the account can't be deleted yet, as messages for the account page. The database refuses
 * the first two on its own (scripts.protected_author_fkey, payments.tr_accounts_pre_delete); these
 * checks only explain why. An invoice paid after the account is gone would have nowhere to go.
 */
export async function deletionBlockers(userId: string) {
	const admin = supabaseAdmin()
	const [scripts, account, open] = await Promise.all([
		admin
			.schema("scripts")
			.from("protected")
			.select("id", { count: "exact", head: true })
			.eq("author", userId),
		admin.schema("payments").from("accounts").select("earnings").eq("user_id", userId).maybeSingle(),
		openPayments(userId)
	])
	if (scripts.error) throw scripts.error
	if (account.error) throw account.error

	const blockers: string[] = []
	if (scripts.count) {
		blockers.push(
			`You're the author of ${scripts.count === 1 ? "a script" : `${scripts.count} scripts`}. Ask staff to remove ${scripts.count === 1 ? "it" : "them"} or hand ${scripts.count === 1 ? "it" : "them"} to another scripter.`
		)
	}
	if (account.data?.earnings)
		blockers.push("You have unpaid earnings. Move them to credits or withdraw them first.")
	if (open.length) blockers.push("You have an unpaid invoice. Finish paying it or wait for it to expire.")
	return blockers
}
