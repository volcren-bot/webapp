<script lang="ts">
	import { page } from "$app/state"
	import { NAV_ROUTES, SITE_NAME, routeHref } from "#lib/utils"

	const { profile } = $derived(page.data)

	const files = $derived(profile ? [...NAV_ROUTES, "Account"] : NAV_ROUTES)

	function isActive(route: string) {
		const href = routeHref(route)
		return href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href)
	}
</script>

<aside class="nv-tree hidden shrink-0 overflow-auto md:block" aria-label="File explorer">
	<div class="nv-row nv-root mb-1">explorer</div>
	<div class="nv-row" style="color: var(--tn-yellow)">
		<span aria-hidden="true">▾</span>
		<span>{SITE_NAME.toLowerCase()}/</span>
	</div>
	<ul>
		{#each files as route (route)}
			<li>
				<a
					href={routeHref(route)}
					class="pl-[4ch]!"
					class:active={isActive(route)}
					aria-current={isActive(route) ? "page" : undefined}
				>
					<span aria-hidden="true" class="nv-dim">•</span>
					<span>{route.toLowerCase()}.svelte</span>
				</a>
			</li>
		{/each}
	</ul>
</aside>
