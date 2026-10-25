<script lang="ts">
	import "../app.css"
	import { goto, invalidate, preloadCode } from "$app/navigation"
	import { match } from "$app/paths"
	import { page } from "$app/state"
	import { onMount } from "svelte"
	import Navigation from "./Navigation.svelte"
	import Footer from "./Footer.svelte"
	import Sidebar from "./Sidebar.svelte"
	import CheatSheet from "./CheatSheet.svelte"
	import KeyPopups from "./KeyPopups.svelte"
	import { cheatSheet, handleKey, type Shortcut } from "#lib/shortcuts.svelte.js"
	import { NAV_ROUTES, routeHref } from "#lib/utils"
	import { getSupabaseBrowser } from "#lib/supabase.browser"

	let { data, children } = $props()
	const { user, expiresAt } = $derived(data)

	const NAV_KEYS: Record<string, string> = {
		Home: "v",
		Scripts: "s",
		Stats: "d",
		Information: "i",
		Tutorials: "t"
	}

	const globals = $derived<Shortcut[]>([
		...NAV_ROUTES.filter((route) => route in NAV_KEYS).map((route) => ({
			display: NAV_KEYS[route],
			label: `Go to ${route.toLowerCase()}`,
			scope: "Global",
			keys: [NAV_KEYS[route]],
			href: routeHref(route),
			run: () => goto(routeHref(route))
		})),
		...(data.profile
			? [
					{
						display: "a",
						label: "Go to account",
						scope: "Global",
						keys: ["a"],
						href: "/account",
						run: () => goto("/account")
					}
				]
			: []),
		{
			display: "K",
			label: "Open the cheat sheet",
			scope: "Global",
			keys: ["k"],
			run: () => (cheatSheet.open = true)
		},
		{
			display: "Backspace",
			label: "Go to the parent page",
			scope: "Global",
			keys: ["Backspace"],
			run: () => {
				const parent = page.url.pathname.replace(/\/+$/, "").replace(/\/[^/]*$/, "") || "/"
				if (parent !== page.url.pathname) goto(parent)
			}
		},
		{ display: "Alt + ←", label: "Go back", scope: "Global" },
		{ display: "Esc", label: "Close menus and modals", scope: "Global" }
	])

	// Shortcuts call goto() without the hover preload, so fetch the nav pages' code up front.
	// Only code, not data: preloading data would run every server load on each page view.
	onMount(() => {
		for (const route of NAV_ROUTES) match(routeHref(route)).then((found) => found && preloadCode(found.id))
	})

	let callTimestamps: number[] = []
	onMount(() => {
		let unsubscribe = () => {}
		let destroyed = false

		getSupabaseBrowser().then((supabaseClient) => {
			if (destroyed) return
			const { data } = supabaseClient.auth.onAuthStateChange((_, newSession) => {
				if (newSession?.user.id !== user || newSession?.expires_at !== expiresAt) {
					const now = Date.now()
					callTimestamps = callTimestamps.filter((ts) => now - ts < 10000)
					if (callTimestamps.length >= 10) {
						console.error(
							"Rate limit exceeded: invalidate('supabase:layout') blocked to prevent loop infinite loop."
						)
						return
					}
					callTimestamps.push(now)
					invalidate("supabase:auth")
				}
			})

			unsubscribe = () => data.subscription.unsubscribe()
		})

		return () => {
			destroyed = true
			unsubscribe()
		}
	})
</script>

<svelte:window onkeydown={(e) => handleKey(e, globals)} />

<CheatSheet {globals} />
<KeyPopups />

<div class="flex h-full flex-col">
	<Navigation />

	<div class="flex min-h-0 grow">
		<Sidebar />
		<div class="flex min-w-0 grow flex-col">
			<main class="flex min-h-0 grow flex-col overflow-auto px-4">
				{@render children()}
			</main>

			<div
				class="nv-dim block shrink-0 px-4 py-0.5 text-center text-[0.85rem] leading-tight no-underline"
				role="note"
			>
				<p>Volcren is not affiliated with or endorsed by any game developer or publisher.</p>
				<p>Using our products may violate EULAs you've agreed to, which we do not condone.</p>
			</div>
		</div>
	</div>

	<Footer />
</div>
