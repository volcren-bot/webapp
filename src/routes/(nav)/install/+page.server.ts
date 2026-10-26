import { getRelease } from "#lib/server/release.server"

const SYSTEMS = ["windows", "linux"] as const

export const load = async ({ url, request, setHeaders }) => {
	// Download links must always point at the newest release.
	setHeaders({ "cache-control": "no-store" })

	const asked = url.searchParams.get("os")
	// Without a choice, Linux visitors get the Linux tab and everyone else the Windows one.
	const userAgent = request.headers.get("user-agent") ?? ""
	const os =
		SYSTEMS.find((s) => s === asked) ??
		(/Linux/.test(userAgent) && !/Android/.test(userAgent) ? "linux" : "windows")

	return { os, release: await getRelease() }
}
