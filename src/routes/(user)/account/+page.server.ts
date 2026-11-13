import { deletionBlockers } from "#lib/server/account.server"
import { supabaseAdmin } from "#lib/server/supabase.admin"
import { errorRef } from "#lib/server/supabase.server"
import { UUID } from "#lib/utils"
import { fail, redirect } from "@sveltejs/kit"

const MAX_APPLICATION_CHARS = 2000

async function scripterStatus(userId: string, supabaseServer: App.Locals["supabaseServer"]) {
	const [progress, config, application] = await Promise.all([
		supabaseServer.schema("profiles").rpc("scripter_progress", { p_user: userId }),
		supabaseServer
			.schema("scripts")
			.from("config")
			.select("scripter_min_scripts, scripter_min_users, scripter_min_minutes, scripter_reapply_days")
			.single(),
		supabaseServer
			.schema("profiles")
			.from("scripter_applications")
			.select("id, status, created_at, decided_at, reason")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle()
	])
	if (progress.error || config.error || application.error) return null

	const ids = progress.data.map((p) => p.script_id)
	const { data: scripts } = ids.length
		? await supabaseServer.schema("scripts").from("scripts").select("id, title, url").in("id", ids)
		: { data: [] }
	const named = new Map((scripts ?? []).map((s) => [s.id, s]))
	const rules = config.data
	const scriptsProgress = progress.data
		.map((p) => ({
			...p,
			title: named.get(p.script_id)?.title ?? "a script",
			url: named.get(p.script_id)?.url ?? null
		}))
		.sort((a, b) => b.users - a.users)
	const qualifying = scriptsProgress.filter((p) => p.users >= rules.scripter_min_users).length
	const last = application.data
	const reapplyAt =
		last?.status === "rejected" && last.decided_at
			? new Date(new Date(last.decided_at).getTime() + rules.scripter_reapply_days * 86_400_000).toISOString()
			: null
	const waiting = reapplyAt !== null && new Date(reapplyAt).getTime() > Date.now()

	return {
		rules,
		scripts: scriptsProgress,
		qualifying,
		application: last,
		reapplyAt: waiting ? reapplyAt : null,
		canApply: qualifying >= rules.scripter_min_scripts && last?.status !== "pending" && !waiting
	}
}

export const load = async ({ locals: { user, getProfile, supabaseServer } }) => {
	if (!user) redirect(303, "/")
	const profile = await getProfile()

	const payments = supabaseServer.schema("payments")
	const [account, ledger, blockers, running, ended] = await Promise.all([
		payments.from("accounts").select("microcredits").eq("user_id", user.id).maybeSingle(),
		payments
			.from("credits_ledger")
			.select("id, kind, amount, balance_after, note, fee, bonus, created_at, payments(provider, bonus)")
			.eq("user_id", user.id)
			// id follows insertion order like created_at, and is what credits_ledger_user_id_idx covers
			.order("id", { ascending: false })
			.limit(50),
		deletionBlockers(user.id).catch((e) => [
			errorRef("Could not check whether your account can be deleted", e)
		]),
		payments
			.from("sessions")
			.select("id, script_id, started_at, price, fee_charged")
			.eq("user_id", user.id)
			.is("ended_at", null)
			.order("started_at"),
		payments
			.from("sessions")
			.select("id, script_id, started_at, ended_at, end_reason")
			.eq("user_id", user.id)
			.not("ended_at", "is", null)
			.order("ended_at", { ascending: false })
			.limit(10)
	])

	// Script names, for the ones the user may still see
	const scriptIds = [...new Set([...(running.data ?? []), ...(ended.data ?? [])].map((s) => s.script_id))]
	const { data: scripts } = scriptIds.length
		? await supabaseServer.schema("scripts").from("scripts").select("id, title, url").in("id", scriptIds)
		: { data: [] }
	const named = new Map((scripts ?? []).map((s) => [s.id, s]))
	const withScript = <T extends { script_id: string }>(session: T) => ({
		...session,
		title: named.get(session.script_id)?.title ?? "a script",
		url: named.get(session.script_id)?.url ?? null
	})

	return {
		microcredits: account.data?.microcredits ?? 0,
		ledger: (ledger.data ?? []).map(({ payments: payment, ...entry }) => ({
			...entry,
			provider: payment?.provider ?? null,
			topupBonus: payment?.bonus ?? 0
		})),
		blockers,
		running: (running.data ?? []).map(withScript),
		ended: (ended.data ?? []).map(withScript),
		scripter: profile?.role === "contributor" ? await scripterStatus(user.id, supabaseServer) : null
	}
}

export const actions = {
	apply: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { applyMessage: "You need to login.", applyError: true })
		const message = String((await request.formData()).get("message") ?? "").trim()
		if (!message)
			return fail(400, { applyMessage: "Tell us about yourself and your scripts.", applyError: true })
		if (message.length > MAX_APPLICATION_CHARS)
			return fail(400, {
				applyMessage: `Keep it under ${MAX_APPLICATION_CHARS} characters.`,
				applyError: true
			})

		const { error: err } = await supabaseServer
			.schema("profiles")
			.rpc("apply_for_scripter", { p_message: message })
		const refusals: Record<string, string> = {
			"42501": "Only contributors can apply.",
			"23514": "You don't have enough scripts with users yet.",
			"23505": "You already have an application waiting for review.",
			"55000": "Your last application was rejected recently. Try again later."
		}
		if (err?.code && err.code in refusals)
			return fail(400, { applyMessage: refusals[err.code], applyError: true })
		if (err)
			return fail(500, { applyMessage: errorRef("Could not send your application", err), applyError: true })
		return { applyMessage: "Sent. An administrator will review it.", applyError: false }
	},

	// The database checks the session is the user's; the loader stops the script at its next heartbeat
	stop: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { stopMessage: "You need to login.", stopError: true })
		const id = String((await request.formData()).get("session") ?? "")
		if (!UUID.test(id)) return fail(400, { stopMessage: "Pick a session.", stopError: true })

		const { data, error: err } = await supabaseServer
			.schema("payments")
			.rpc("stop_session", { p_session: id })
		if (err?.code === "42501") return fail(403, { stopMessage: "That session isn't yours.", stopError: true })
		if (err) return fail(500, { stopMessage: errorRef("Could not stop the session", err), stopError: true })
		return {
			stopMessage: data
				? "Stopped. The loader ends the script within a minute."
				: "That session had already ended.",
			stopError: false
		}
	},

	// Deletes the auth user; the database cascades to profile, balance, stats and deploy tokens, while payment and usage records stay.
	delete: async ({ request, locals: { user, getProfile, supabaseServer } }) => {
		if (!user) return fail(401, { deleteMessage: "You need to login." })
		const profile = await getProfile()
		if (!profile) return fail(404, { deleteMessage: "Your account was not found." })

		const data = await request.formData()
		if (String(data.get("confirm") ?? "").trim() !== profile.username) {
			return fail(400, { deleteMessage: "Type your username exactly to confirm." })
		}

		let blockers
		try {
			blockers = await deletionBlockers(user.id)
		} catch (e) {
			return fail(502, { deleteMessage: errorRef("Could not check whether your account can be deleted", e) })
		}
		if (blockers.length) return fail(409, { deleteMessage: blockers.join(" ") })

		const { error: err } = await supabaseAdmin().auth.admin.deleteUser(user.id)
		if (err) return fail(500, { deleteMessage: errorRef("Could not delete your account", err) })

		console.log(`User ${user.id} deleted their account`)
		// The user is gone, so Auth rejects the logout; signOut ignores that and clears the cookies
		await supabaseServer.auth.signOut({ scope: "local" })
		redirect(303, "/")
	}
}
