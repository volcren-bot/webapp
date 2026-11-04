import { error, fail, redirect } from "@sveltejs/kit"
import { isReportStatus } from "#lib/feedback"
import { roleAtLeast } from "#lib/scripts"
import { errorRef } from "#lib/server/supabase.server"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const load = async ({ params, locals: { user, supabaseServer, getProfile } }) => {
	if (!user) redirect(303, "/auth")
	if (!UUID.test(params.id)) error(404, "Report not found")

	const feedback = supabaseServer.schema("feedback")
	// Row level security decides whether the viewer sees the row at all
	const { data: report, error: err } = await feedback
		.from("reports")
		.select(
			"id, script_id, user_id, session_id, revision, description, log, snapshot, diagnostics, status, assigned_to, created_at, updated_at"
		)
		.eq("id", params.id)
		.maybeSingle()
	if (err) error(500, errorRef("Could not load the report", err))
	if (!report) error(404, "Report not found")

	const [profile, listed, author, testers] = await Promise.all([
		getProfile(),
		// The usernames, which only list_reports gives out
		feedback.rpc("list_reports", { p_script: report.script_id }),
		supabaseServer.schema("scripts").rpc("is_author", { user_id: user.id, script_id: report.script_id }),
		feedback.rpc("list_testers")
	])
	const names = listed.data?.find((r) => r.id === report.id)
	const moderator = roleAtLeast(profile?.role, "moderator")
	const canAssign = moderator || author.data === true
	const own = report.user_id === user.id

	return {
		report: {
			...report,
			username: names?.username ?? "unknown",
			assignee: names?.assignee ?? null,
			scriptTitle: names?.script_title ?? "a script",
			scriptUrl: names?.script_url ?? null
		},
		canAssign,
		canManage: canAssign || report.assigned_to === user.id,
		canDelete: own || moderator,
		testers: canAssign ? (testers.data ?? []) : []
	}
}

export const actions = {
	// Only status and assigned_to are writable; the database refuses everything else
	status: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const status = (await request.formData()).get("status")
		if (!isReportStatus(status)) return fail(400, { message: "Pick a status." })

		const { data, error: err } = await supabaseServer
			.schema("feedback")
			.from("reports")
			.update({ status })
			.eq("id", params.id)
			.select("id")
		if (err) return fail(500, { message: errorRef("Could not change the status", err) })
		if (!data.length) return fail(403, { message: "You can't change this report." })
		return { message: "Status saved." }
	},

	assign: async ({ request, params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const who = String((await request.formData()).get("user") ?? "")
		if (who && !UUID.test(who)) return fail(400, { message: "Pick a tester." })

		const { data, error: err } = await supabaseServer
			.schema("feedback")
			.from("reports")
			.update({ assigned_to: who || null })
			.eq("id", params.id)
			.select("id")
		if (err?.code === "42501")
			return fail(403, { message: "Only the author or a moderator can assign a report." })
		if (err?.code === "23514") return fail(400, { message: err.message })
		if (err) return fail(500, { message: errorRef("Could not assign the report", err) })
		if (!data.length) return fail(403, { message: "You can't change this report." })
		return { message: who ? "Report assigned." : "Assignment removed." }
	},

	delete: async ({ params, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { message: "You need to login." })
		const { data, error: err } = await supabaseServer
			.schema("feedback")
			.from("reports")
			.delete()
			.eq("id", params.id)
			.select("id")
		if (err) return fail(500, { message: errorRef("Could not delete the report", err) })
		if (!data.length) return fail(403, { message: "You can't delete this report." })
		redirect(303, "/reports")
	}
}
