import { Constants, type Database } from "#lib/types/supabase"

type ReportStatus = Database["feedback"]["Enums"]["report_status"]

/** `feedback.report_status`, in workflow order. */
export const REPORT_STATUSES = Constants.feedback.Enums.report_status

export const STATUS_LABELS: Record<ReportStatus, string> = {
	open: "open",
	in_progress: "in progress",
	resolved: "resolved",
	rejected: "rejected"
}

export const STATUS_COLORS: Record<ReportStatus, string> = {
	open: "var(--tn-yellow)",
	in_progress: "var(--tn-blue)",
	resolved: "var(--tn-green)",
	rejected: "var(--tn-comment)"
}

export const isReportStatus = (value: unknown): value is ReportStatus =>
	typeof value === "string" && (REPORT_STATUSES as readonly string[]).includes(value)

/** A report's attachment as text for a `<pre>`: pretty JSON, or the raw text. */
export const attachmentText = (value: unknown) =>
	typeof value === "string" ? value : JSON.stringify(value, null, 2)
