<script lang="ts">
	import { navigating, page } from "$app/state"
	import { untrack } from "svelte"
	import { faqs } from "#lib/faqs"
	import { sidebar } from "#lib/sidebar.svelte.js"
	import { NAV_CHILDREN, NAV_ROUTES, SITE_NAME, USER_ROUTES, routeHref } from "#lib/utils"

	const { profile } = $derived(page.data)

	// Children only scripters (and staff) may open; hidden from everyone else.
	const SCRIPTER_ONLY = ["scripts/new"]
	const isScripter = $derived(!!profile && ["scripter", "moderator", "administrator"].includes(profile.role))

	// Scripts the user can see are listed under /scripts, after "new" when they may create one.
	function visibleChildren(route: string) {
		const name = route.toLowerCase()
		const children = (NAV_CHILDREN[name] ?? []).filter(
			(c) => isScripter || !SCRIPTER_ONLY.includes(`${name}/${c}`)
		)
		if (name !== "scripts") return children
		const urls = new Set(children)
		return [
			...children,
			...(page.data.sidebarScripts ?? [])
				.map((s: { url: string }) => s.url)
				.filter((u: string) => !urls.has(u))
		]
	}

	// Use the destination while navigating so the tree updates on click, not after the load finishes.
	const path = $derived(navigating.to?.url.pathname ?? page.url.pathname)

	// The server row at the top is the home link.
	const files = $derived(
		[
			...NAV_ROUTES.filter((r) => r !== "Home"),
			...(profile ? USER_ROUTES : []),
			...(profile?.role === "administrator" ? ["Admin"] : [])
		].sort((a, b) => a.localeCompare(b))
	)

	function isActive(route: string) {
		const href = routeHref(route)
		return href === "/" || route.toLowerCase() in NAV_CHILDREN ? path === href : path.startsWith(href)
	}

	// Manual expand/collapse per parent; unset means "open while the current page is inside it".
	let expanded = $state<Record<string, boolean>>({})

	function isOpen(route: string) {
		const name = route.toLowerCase()
		return expanded[name] ?? path.startsWith(routeHref(route))
	}

	// Leaving a parent drops its manual override so it collapses again.
	$effect(() => {
		const current = path
		untrack(() => {
			for (const route of NAV_ROUTES) {
				const name = route.toLowerCase()
				if (name in expanded && !current.startsWith(routeHref(route))) delete expanded[name]
			}
		})
	})

	function onParentClick(route: string) {
		const name = route.toLowerCase()
		if (!(name in NAV_CHILDREN)) return
		// Clicking the page you're on toggles it; arriving from elsewhere always opens it.
		expanded[name] = path === routeHref(route) ? !isOpen(route) : true
	}

	// Nerd Font glyphs, as in neovim's file explorer.
	const ICON_FOLDER = "\uf07b"
	const ICON_FOLDER_OPEN = "\uf07c"
	const ICON_TERMINAL = "\uf489"
	const ICON_SERVER = "\uf233"

	function icon(name: string, open = false) {
		if (name === "scripts") return ICON_TERMINAL
		return open ? ICON_FOLDER_OPEN : ICON_FOLDER
	}

	const ICON_FILE = "\uf15b"

	// Pages nested two levels down, keyed by "parent/child". Listed by id.
	const LEAVES: Record<string, string[]> = {
		"information/faq": faqs.map((f) => f.id)
	}

	function guide(parentLast: boolean, last: boolean) {
		return (parentLast ? "  " : "│ ") + (last ? "└─" : "├─")
	}

	function leafGuide(parentLast: boolean, childLast: boolean, last: boolean) {
		return (parentLast ? "  " : "│ ") + (childLast ? "  " : "│ ") + (last ? "└─" : "├─")
	}

	function isChildActive(href: string) {
		return path === href
	}
</script>

<!-- Below md the sidebar is a drawer under the nav bar, closed by the backdrop, Esc or the nav button -->
{#if sidebar.open}
	<button
		type="button"
		tabindex="-1"
		aria-label="Close the sidebar"
		class="fixed inset-x-0 top-9 bottom-0 z-30 cursor-default bg-black/50 md:hidden"
		onclick={() => (sidebar.open = false)}
	></button>
{/if}

<aside
	class="nv-tree shrink-0 overflow-auto max-md:fixed max-md:top-9 max-md:bottom-0 max-md:left-0 max-md:z-40 max-md:max-w-[85vw] max-md:shadow-xl md:block"
	class:max-md:hidden={!sidebar.open}
	aria-label="File explorer"
>
	<div class="nv-row nv-root mb-1">explorer</div>
	<a href="/" class="nv-home" class:active={path === "/"} aria-current={path === "/" ? "page" : undefined}>
		<span aria-hidden="true" class="nv-icon">{ICON_SERVER}</span>
		<span>{SITE_NAME}/</span>
	</a>
	<ul>
		{#each files as route, i (route)}
			{@const lastRoute = i === files.length - 1}
			{@const children = visibleChildren(route)}
			<li>
				<a
					href={routeHref(route)}
					onclick={() => onParentClick(route)}
					class:active={isActive(route)}
					aria-expanded={children.length ? isOpen(route) : undefined}
					aria-current={isActive(route) ? "page" : undefined}
				>
					<span aria-hidden="true" class="nv-guide">{lastRoute ? "└─" : "├─"}</span>
					<span aria-hidden="true" class="nv-icon"
						>{icon(route.toLowerCase(), children.length ? isOpen(route) : isActive(route))}</span
					>
					<span>{route.toLowerCase()}/</span>
				</a>
				{#each isOpen(route) ? children : [] as child, j (child)}
					{@const href = `${routeHref(route)}/${child}`}
					<a
						{href}
						class:active={isChildActive(href)}
						aria-current={isChildActive(href) ? "page" : undefined}
					>
						<span aria-hidden="true" class="nv-guide">{guide(lastRoute, j === children.length - 1)}</span>
						<span aria-hidden="true" class="nv-icon"
							>{icon(
								child,
								isChildActive(href) || (`${route.toLowerCase()}/${child}` in LEAVES && path.startsWith(href))
							)}</span
						>
						<span>{child}/</span>
					</a>
					{#each path.startsWith(href) ? (LEAVES[`${route.toLowerCase()}/${child}`] ?? []) : [] as leaf, k (leaf)}
						{@const leafHref = `${href}/${leaf}`}
						{@const leaves = LEAVES[`${route.toLowerCase()}/${child}`]}
						<a
							href={leafHref}
							class:active={isChildActive(leafHref)}
							aria-current={isChildActive(leafHref) ? "page" : undefined}
						>
							<span aria-hidden="true" class="nv-guide"
								>{leafGuide(lastRoute, j === children.length - 1, k === leaves.length - 1)}</span
							>
							<span aria-hidden="true" class="nv-icon">{ICON_FILE}</span>
							<span>{leaf}</span>
						</a>
					{/each}
				{/each}
			</li>
		{/each}
	</ul>
</aside>
