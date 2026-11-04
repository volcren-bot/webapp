<script lang="ts">
	import "../app.css"
	import { invalidate, preloadCode } from "$app/navigation"
	import { match } from "$app/paths"
	import { onMount } from "svelte"
	import Navigation from "./Navigation.svelte"
	import Footer from "./Footer.svelte"
	import Sidebar from "./Sidebar.svelte"
	import CheatSheet from "./CheatSheet.svelte"
	import KeyPanel from "./KeyPanel.svelte"
	import { handleKey, setRouteTree } from "#lib/keys.svelte.js"
	import { routeTree } from "#lib/routes"
	import { getSupabaseBrowser } from "#lib/supabase.browser"

	let { data, children } = $props()
	const { user, expiresAt } = $derived(data)

	// One tree of the pages this viewer may open feeds the sidebar, the key sequences and the cheat sheet.
	const root = $derived(
		routeTree({
			member: !!data.profile,
			admin: data.profile?.role === "administrator",
			scripts: data.sidebarScripts.map((s: { url: string }) => s.url)
		})
	)
	setRouteTree(() => root)

	// Key sequences call goto() without the hover preload, so fetch the top-level pages' code (not data) up front.
	onMount(() => {
		for (const node of root.children) match(node.href).then((found) => found && preloadCode(found.id))
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

<svelte:window onkeydown={(e) => handleKey(e, root)} />

<CheatSheet />
<KeyPanel />

<div class="flex h-full flex-col overflow-hidden">
	<Navigation />

	<div class="flex min-h-0 grow">
		<Sidebar />
		<div class="flex min-h-0 min-w-0 grow flex-col">
			<main class="flex min-h-0 grow flex-col overflow-auto px-4">
				{@render children()}
			</main>

			<div
				class="nv-dim shrink-0 px-4 py-1 text-center text-[0.625rem] leading-snug sm:text-[0.75rem] md:text-[0.8125rem] lg:text-[0.875rem]"
				role="note"
			>
				<p>VOLCREN is not affiliated with or endorsed by any game developer or publisher.</p>
				<p>Using our products may violate EULAs you've agreed to, which we do not condone.</p>
			</div>
		</div>
	</div>

	<Footer />
</div>
