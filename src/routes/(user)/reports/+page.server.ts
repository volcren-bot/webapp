import { redirect } from "@sveltejs/kit"
import { isReportStatus } from "#lib/feedback"
import { errorRef } from "#lib/server/supabase.server"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Row level security decides what the viewer sees: their own reports, those on their scripts, those assigned to them, or everything for moderators. */
export const load = async ({ url, locals: { user, supabaseServer } }) => {
	if (!user) redirect(303, "/auth")

	const script = url.searchParams.get("script")
	const status = url.searchParams.get("status")
	const { data, error: err } = await supabaseServer
		.schema("feedback")
		.rpc("list_reports", { p_script: script && UUID.test(script) ? script : undefined })
	if (err) console.error(errorRef("Could not list the reports", err))

	const reports = (data ?? []).filter((r) => !isReportStatus(status) || r.status === status)
	return {
		reports,
		filter: {
			script: script && UUID.test(script) ? script : null,
			status: isReportStatus(status) ? status : null
		},
		scriptTitle: data?.find((r) => r.script_id === script)?.script_title ?? null
	}
}
