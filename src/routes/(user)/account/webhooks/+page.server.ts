import { fail, redirect } from "@sveltejs/kit"
import type { PostgrestError } from "@supabase/supabase-js"
import { roleAtLeast } from "#lib/scripts"
import { errorRef } from "#lib/server/supabase.server"
import type { Database } from "#lib/types/supabase"
import { UUID } from "#lib/utils"

type Event = Database["webhooks"]["Enums"]["event"]
type Format = Database["webhooks"]["Enums"]["format"]

const FORMATS: Format[] = ["volcren", "github_dispatch", "text", "discord"]
const EVENTS: Event[] = ["client_release", "script_check"]

export const load = async ({ locals: { user, supabaseServer, getProfile } }) => {
	if (!user) redirect(303, "/auth")
	const profile = await getProfile()
	const allowed = roleAtLeast(profile?.role, "contributor") && !profile?.banned_at
	if (!allowed) return { allowed, endpoints: [], deliveries: [], error: null }

	const webhooks = supabaseServer.schema("webhooks")
	const [endpoints, deliveries] = await Promise.all([
		webhooks
			.from("endpoints")
			.select(
				"id, name, url, format, events, has_bearer, header_names, signing_secret, enabled, failures, disabled_reason, created_at, updated_at"
			)
			.order("created_at"),
		webhooks
			.from("deliveries")
			.select("id, endpoint_id, event, status, attempts, response_status, error, created_at, finished_at")
			.order("created_at", { ascending: false })
			.limit(100)
	])
	const failed = endpoints.error ?? deliveries.error
	return {
		allowed,
		endpoints: endpoints.data ?? [],
		deliveries: deliveries.data ?? [],
		error: failed ? errorRef("Could not load your webhooks", failed) : null
	}
}

function saveProblem(error: PostgrestError): [number, string] {
	if (error.code === "42501") return [403, "Webhooks need the contributor role."]
	if (error.code === "54000") return [409, "You can have at most 5 webhooks."]
	if (error.code === "P0002") return [404, "Webhook not found."]
	if (error.code === "22023" && error.message.includes("has no value to keep"))
		return [400, "Give every new header a value."]
	if (error.code === "23514" || error.code === "22023" || error.code === "22P02")
		return [
			400,
			"Check the URL (https with a host name, no credentials), the token (no spaces) and the headers (no reserved names, printable text)."
		]
	return [500, errorRef("Could not save the webhook", error)]
}

const text = (data: FormData, key: string) => {
	const value = data.get(key)
	return typeof value === "string" ? value : ""
}

export const actions = {
	save: async ({ request, locals: { user, supabaseServer } }) => {
		const data = await request.formData()
		const id = text(data, "id")
		const problem = (status: number, saveError: string) => fail(status, { saveError, saveId: id || null })
		if (!user) return problem(401, "You need to login.")
		if (id && !UUID.test(id)) return problem(404, "Webhook not found.")
		const name = text(data, "name").trim()
		if (!name || name.length > 64) return problem(400, "Name the webhook (at most 64 characters).")
		const url = text(data, "url").trim()
		if (!url.startsWith("https://") || url.length > 2048)
			return problem(400, "The URL must start with https:// (at most 2048 characters).")
		const format = text(data, "format") as Format
		if (!FORMATS.includes(format)) return problem(400, "Pick a format.")
		const events = data.getAll("events").filter((e): e is Event => EVENTS.includes(e as Event))
		if (!events.length) return problem(400, "Pick at least one event.")

		const bearer = text(data, "bearer").trim()
		const clearBearer = data.get("clear_bearer") === "on"
		const names = data.getAll("header_name").map((n) => (typeof n === "string" ? n.trim() : ""))
		const values = data.getAll("header_value").map((v) => (typeof v === "string" ? v : ""))
		if (names.length !== values.length || names.length > 8) return problem(400, "At most 8 headers.")
		const headers = names
			.map((name, i) => ({ name, value: values[i] === "" ? null : values[i] }))
			.filter((h) => h.name !== "")

		const { error } = await supabaseServer.schema("webhooks").rpc("save_endpoint", {
			p_id: (id || null) as string,
			p_name: name,
			p_url: url,
			p_format: format,
			p_events: events,
			p_enabled: data.get("enabled") === "on",
			p_bearer_token: (clearBearer ? "" : bearer || null) as string,
			p_headers: headers
		})
		if (error) return problem(...saveProblem(error))
		return { saved: id || "new" }
	},

	delete: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { actionError: "You need to login." })
		const id = text(await request.formData(), "id")
		if (!UUID.test(id)) return fail(404, { actionError: "Webhook not found." })
		const { data, error } = await supabaseServer
			.schema("webhooks")
			.from("endpoints")
			.delete()
			.eq("id", id)
			.select("id")
		if (error) return fail(500, { actionError: errorRef("Could not delete the webhook", error) })
		if (!data.length) return fail(404, { actionError: "Webhook not found." })
		return { actionMessage: "Webhook deleted." }
	},

	test: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { actionError: "You need to login." })
		const id = text(await request.formData(), "id")
		if (!UUID.test(id)) return fail(404, { actionError: "Webhook not found." })
		const { error } = await supabaseServer.schema("webhooks").rpc("send_test", { p_id: id })
		if (error?.code === "54000")
			return fail(429, { actionError: "Wait for the last test to finish. You can send 10 an hour." })
		if (error?.code === "P0002") return fail(404, { actionError: "Webhook not found." })
		if (error) return fail(500, { actionError: errorRef("Could not send a test", error) })
		return { actionMessage: "Test queued. It is sent within about 15 seconds; reload to see the result." }
	},

	rotate: async ({ request, locals: { user, supabaseServer } }) => {
		if (!user) return fail(401, { actionError: "You need to login." })
		const id = text(await request.formData(), "id")
		if (!UUID.test(id)) return fail(404, { actionError: "Webhook not found." })
		const { error } = await supabaseServer.schema("webhooks").rpc("rotate_signing_secret", { p_id: id })
		if (error?.code === "P0002") return fail(404, { actionError: "Webhook not found." })
		if (error) return fail(500, { actionError: errorRef("Could not rotate the secret", error) })
		return { actionMessage: "Signing secret rotated. Update it wherever you verify signatures." }
	}
}
