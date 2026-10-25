<script lang="ts">
	import { goto } from "$app/navigation"
	import { informationPages } from "#lib/information"
	import { useShortcuts } from "#lib/shortcuts.svelte.js"

	let { children } = $props()

	// Registered here rather than on the index page so they work on every page below it.
	useShortcuts(() =>
		informationPages.map((i) => ({
			display: i.key,
			label: i.label,
			scope: "Information",
			keys: [i.key],
			href: i.href,
			run: () => goto(i.href)
		}))
	)
</script>

{@render children()}
