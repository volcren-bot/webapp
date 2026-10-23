<script lang="ts">
	import "../app.css"
	import { invalidate } from "$app/navigation"
	import { onMount } from "svelte"
	import Navigation from "./Navigation.svelte"
	import Footer from "./Footer.svelte"
	import Sidebar from "./Sidebar.svelte"

	let { data, children } = $props()
	const { user, expiresAt, supabaseClient } = $derived(data)

	let callTimestamps: number[] = []
	onMount(() => {
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

		return () => data.subscription.unsubscribe()
	})
</script>

<div class="flex h-full flex-col">
	<Navigation />

	<div class="flex min-h-0 grow">
		<Sidebar />
		<main class="flex min-w-0 grow flex-col overflow-auto px-4">
			{@render children()}
		</main>
	</div>

	<div
		class="nv-dim shrink-0 px-4 py-1 text-center text-[0.85rem]"
		role="note"
	>
		<p>Volcren is not affiliated with or endorsed by any game developer or publisher.</p>
		<p>Using our products may violate EULAs you've agreed to, which we do not condone.</p>
	</div>

	<Footer />
</div>
