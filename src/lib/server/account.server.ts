import type { SupabaseClient } from "@supabase/supabase-js"
import { openPayments } from "#lib/server/payments.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import type { Database } from "#lib/types/supabase"

/** Why the account can't be deleted yet, as messages for the account page; the database enforces the first two, these checks only explain why. */
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
		blockers.push("You have unpaid earnings. Move them to CREDIT or withdraw them first.")
	if (open.length) blockers.push("You have an unpaid invoice. Finish paying it or wait for it to expire.")
	return blockers
}

/** What a community author has used of their limits, or null when it can't be read. */
export async function communityUsage(supabase: SupabaseClient<Database>) {
	const { data } = await supabase.schema("scripts").rpc("get_community_usage").maybeSingle()
	return data
		? {
				scripts: data.script_count,
				maxScripts: data.max_scripts,
				bytes: data.used_bytes,
				maxBytes: data.max_bytes
			}
		: null
}
