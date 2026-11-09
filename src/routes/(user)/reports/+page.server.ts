import { redirect } from "@sveltejs/kit"
import { isReportStatus } from "#lib/feedback"
import { errorRef } from "#lib/server/supabase.server"
import { UUID } from "#lib/utils"

/** Row level security decides what the viewer sees: their own reports, those on their scripts, those assigned to them, or everything for moderators. */
export const load = async ({ url, locals: { user, supabaseServer } }) => {
	if (!user) redirect(303, "/auth")

	const scriptParam = url.searchParams.get("script")
	const script = scriptParam && UUID.test(scriptParam) ? scriptParam : null
	const statusParam = url.searchParams.get("status")
	const status = isReportStatus(statusParam) ? statusParam : null
	const { data, error: err } = await supabaseServer
		.schema("feedback")
		.rpc("list_reports", { p_script: script ?? undefined })
	if (err) errorRef("Could not list the reports", err)

	return {
		reports: (data ?? []).filter((r) => !status || r.status === status),
		filter: { script, status },
		scriptTitle: data?.find((r) => r.script_id === script)?.script_title ?? null
	}
}
