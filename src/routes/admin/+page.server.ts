import { fail, redirect, type RequestEvent } from "@sveltejs/kit"
import { markStale } from "#lib/server/scripts.cache"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef, requireAdmin, type Refusal } from "#lib/server/supabase.server"
import { Constants } from "#lib/types/supabase"
import { formatCredits, localeFrom, UUID } from "#lib/utils"

const MAX_DOCUMENT_CHARS = 200_000

/** The profile behind a UUID typed into a form, as a failure message when there is none. */
async function findUser(userId: string): Promise<Refusal | { target: { id: string; username: string } }> {
	if (!UUID.test(userId)) return { status: 400, message: "Enter a valid user UUID." }
	const { data, error } = await supabaseAdmin()
		.schema("profiles")
		.from("profiles")
		.select("id, username")
		.eq("id", userId)
		.maybeSingle()
	if (error) return { status: 500, message: errorRef("Could not look up the user", error) }
	if (!data) return { status: 404, message: `No user with the UUID ${userId}.` }
	return { target: data }
}

export const load = async ({ url, locals }) => {
	const auth = await requireAdmin(locals)
	if ("status" in auth) redirect(303, auth.status === 401 ? "/auth" : "/")

	const admin = supabaseAdmin()
	const [{ data: ledger }, { data: logins }, { data: bans }] = await Promise.all([
		admin
			.schema("payments")
			.from("credits_ledger")
			.select("id, user_id, amount, balance_after, note, granted_by, created_at")
			.eq("kind", "adjustment")
			.order("id", { ascending: false })
			.limit(50),
		admin
			.schema("profiles")
			.from("impersonations")
			.select("id, admin_id, user_id, created_at")
			.order("id", { ascending: false })
			.limit(50),
		admin
			.schema("profiles")
			.from("bans")
			.select("id, admin_id, user_id, banned, reason, created_at")
			.order("id", { ascending: false })
			.limit(50)
	])

	const ids = [
		...new Set([
			...(ledger ?? []).flatMap((row) => [row.user_id, row.granted_by ?? []].flat()),
			...[...(logins ?? []), ...(bans ?? [])].flatMap((row) => [row.admin_id, row.user_id])
		])
	]
	const { data: profiles } = ids.length
		? await admin.schema("profiles").from("profiles").select("id, username").in("id", ids)
		: { data: [] }
	const names = new Map((profiles ?? []).map((p) => [p.id, p.username]))
	const name = (id: string) => names.get(id) ?? id

	// A user to inspect: a UUID, or an exact username
	const search = (url.searchParams.get("user") ?? "").trim().slice(0, 64)
	let inspected = null
	if (search) {
		const { data: found } = await admin
			.schema("profiles")
			.from("profiles")
			.select("id, username, avatar, role, banned_at, created_at")
			.eq(UUID.test(search) ? "id" : "username", search)
			.maybeSingle()
		if (found) {
			const [{ data: account }, { data: auth }] = await Promise.all([
				admin
					.schema("payments")
					.from("accounts")
					.select("microcredits, earnings")
					.eq("user_id", found.id)
					.maybeSingle(),
				admin.auth.admin.getUserById(found.id)
			])
			inspected = {
				...found,
				microcredits: account?.microcredits ?? 0,
				earnings: account?.earnings ?? 0,
				email: auth.user?.email ?? null
			}
		}
	}

	return {
		search,
		inspected,
		adjustments: (ledger ?? []).map((row) => ({
			...row,
			user: name(row.user_id),
			admin: row.granted_by ? name(row.granted_by) : null
		})),
		impersonations: (logins ?? []).map((row) => ({
			...row,
			user: name(row.user_id),
			admin: name(row.admin_id)
		})),
		bans: (bans ?? []).map((row) => ({ ...row, user: name(row.user_id), admin: name(row.admin_id) }))
	}
}

// Auth takes a duration, not "forever"
const BAN_DURATION = "876000h"

/** The database ban (profiles.set_banned) decides what the account can do; the Auth ban on top blocks sign-in and is reapplied on repeats to retry failures. */
async function setBanned(banned: boolean, { request, locals }: RequestEvent) {
	const auth = await requireAdmin(locals)
	if ("status" in auth) return fail(auth.status, { message: auth.message, ban: true })
	const { user } = auth

	const data = await request.formData()
	const reason = String(data.get("reason") ?? "").trim()
	if (!reason) return fail(400, { message: "A reason is required.", ban: true })
	if (reason.length > 500) return fail(400, { message: "Keep the reason under 500 characters.", ban: true })

	const found = await findUser(String(data.get("user") ?? "").trim())
	if ("status" in found) return fail(found.status, { message: found.message, ban: true })
	const { target } = found

	const admin = supabaseAdmin()
	const { data: changed, error: err } = await admin.schema("profiles").rpc("set_banned", {
		p_admin: user.id,
		p_user: target.id,
		p_banned: banned,
		p_reason: reason
	})
	if (err?.code === "42501") return fail(403, { message: "Administrators can't be banned.", ban: true })
	if (err) return fail(500, { message: errorRef("Could not record the ban", err), ban: true })
	// A banned author's scripts stop being public
	markStale()

	const { error: authErr } = await admin.auth.admin.updateUserById(target.id, {
		ban_duration: banned ? BAN_DURATION : "none"
	})
	if (authErr) {
		const message = banned
			? `${target.username} is banned, but could not be blocked from signing in. Ban again to retry`
			: `${target.username} is unbanned, but is still blocked from signing in. Unban again to retry`
		return fail(500, { message: errorRef(message, authErr), ban: true })
	}

	console.log(`Admin ${user.id} ${banned ? "banned" : "unbanned"} ${target.id}`)
	const verb = banned ? "banned" : "unbanned"
	return {
		message: changed ? `Done: ${target.username} is ${verb}.` : `${target.username} was already ${verb}.`,
		ok: true,
		ban: true
	}
}

export const actions = {
	// Publishes a new version of a legal document; versions are immutable, and a new scripter_tos or community_tos version asks every creator to accept again.
	publishDocument: async ({ request, locals }) => {
		const auth = await requireAdmin(locals)
		if ("status" in auth) return fail(auth.status, { message: auth.message, document: true })

		const data = await request.formData()
		const kind = Constants.info.Enums.kind.find((k) => k === data.get("kind"))
		const content = String(data.get("content") ?? "").trim()
		if (!kind) return fail(400, { message: "Pick a document.", document: true })
		if (!content) return fail(400, { message: "The document is empty.", document: true })
		if (content.length > MAX_DOCUMENT_CHARS)
			return fail(400, { message: "The document is too long.", document: true })

		// The version number is assigned by a trigger, so the generated type's required `version` is cast away; row level security lets only administrators insert.
		const { error: err } = await locals.supabaseServer
			.schema("info")
			.from("documents")
			.insert({ kind, content } as { kind: typeof kind; content: string; version: number })
		if (err?.code === "42501") return fail(403, { message: "Administrators only.", document: true })
		if (err) return fail(500, { message: errorRef("Could not publish the document", err), document: true })

		console.log(`Admin ${auth.user.id} published a new ${kind}`)
		return { message: `Published a new version of ${kind}.`, ok: true, document: true }
	},

	ban: (event) => setBanned(true, event),
	unban: (event) => setBanned(false, event),

	adjust: async ({ request, locals }) => {
		const auth = await requireAdmin(locals)
		if ("status" in auth) return fail(auth.status, { message: auth.message })

		const data = await request.formData()
		const amount = Number(data.get("amount"))
		const note = String(data.get("note") ?? "").trim()
		if (!Number.isSafeInteger(amount) || amount === 0) {
			return fail(400, { message: "The amount must be a whole number of microcredits other than 0." })
		}
		if (!note) return fail(400, { message: "A note is required." })

		const found = await findUser(String(data.get("user") ?? "").trim())
		if ("status" in found) return fail(found.status, { message: found.message })
		const { target } = found

		const { data: balance, error: err } = await supabaseAdmin().schema("payments").rpc("adjust_credits", {
			p_admin: auth.user.id,
			p_user: target.id,
			p_amount: amount,
			p_note: note
		})
		// 23514 is the account check: removing more credits than the user has
		if (err?.code === "23514")
			return fail(400, { message: `${target.username} doesn't have that much CREDIT.` })
		if (err) return fail(500, { message: errorRef("Could not adjust the CREDIT", err) })

		return {
			message: `Done: ${target.username} now has ${formatCredits(balance, localeFrom(request), true)}.`,
			ok: true
		}
	},

	// Signs this browser in as another user, replacing the admin's own session
	impersonate: async ({ request, locals }) => {
		const auth = await requireAdmin(locals)
		if ("status" in auth) return fail(auth.status, { message: auth.message, login: true })
		const { user } = auth

		const data = await request.formData()
		const userId = String(data.get("user") ?? "").trim()
		if (!UUID.test(userId)) return fail(400, { message: "Enter a valid user UUID.", login: true })

		const admin = supabaseAdmin()
		// Recorded before the login exists so an unrecordable impersonation doesn't happen; the database also refuses administrators as targets.
		const { error: logErr } = await admin
			.schema("profiles")
			.rpc("log_impersonation", { p_admin: user.id, p_user: userId })
		if (logErr?.code === "42501") {
			return fail(403, { message: "Administrators can't be impersonated.", login: true })
		}
		if (logErr?.code === "P0002") return fail(404, { message: "No user with that UUID.", login: true })
		if (logErr) return fail(500, { message: errorRef("Could not record the login", logErr), login: true })

		const { data: target, error: lookup } = await admin.auth.admin.getUserById(userId)
		if (lookup || !target.user?.email) {
			return fail(404, { message: "No user with that UUID and an email.", login: true })
		}

		const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
			type: "magiclink",
			email: target.user.email
		})
		if (linkErr) return fail(500, { message: errorRef("Could not create the login", linkErr), login: true })

		const { error: otpErr } = await locals.supabaseServer.auth.verifyOtp({
			token_hash: link.properties.hashed_token,
			type: "magiclink"
		})
		if (otpErr) return fail(500, { message: errorRef("Could not log in as the user", otpErr), login: true })

		console.log(`Admin ${user.id} logged in as ${userId}`)
		locals.resetSession()
		redirect(303, "/")
	}
}
