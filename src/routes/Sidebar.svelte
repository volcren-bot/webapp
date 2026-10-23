<script lang="ts">
	import { page } from "$app/state"
	import { NAV_CHILDREN, NAV_ROUTES, SITE_NAME, routeHref } from "#lib/utils"

	const { profile } = $derived(page.data)

	// The server row at the top is the home link.
	const files = $derived([...NAV_ROUTES.filter((r) => r !== "Home"), ...(profile ? ["Account"] : [])])

	function isActive(route: string) {
		const href = routeHref(route)
		return href === "/" || route.toLowerCase() in NAV_CHILDREN
			? page.url.pathname === href
			: page.url.pathname.startsWith(href)
	}

	// Manual expand/collapse per parent; unset means "open while the current page is inside it".
	let expanded = $state<Record<string, boolean>>({})

	function isOpen(route: string) {
		const name = route.toLowerCase()
		return expanded[name] ?? page.url.pathname.startsWith(routeHref(route))
	}

	function onParentClick(route: string) {
		const name = route.toLowerCase()
		if (!(name in NAV_CHILDREN)) return
		// Clicking the page you're on toggles it; arriving from elsewhere always opens it.
		expanded[name] = page.url.pathname === routeHref(route) ? !isOpen(route) : true
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

	function guide(parentLast: boolean, last: boolean) {
		return (parentLast ? "  " : "│ ") + (last ? "└─" : "├─")
	}

	function isChildActive(href: string) {
		return page.url.pathname === href
	}
</script>

<aside class="nv-tree hidden shrink-0 overflow-auto md:block" aria-label="File explorer">
	<div class="nv-row nv-root mb-1">explorer</div>
	<a
		href="/"
		class="nv-home"
		class:active={page.url.pathname === "/"}
		aria-current={page.url.pathname === "/" ? "page" : undefined}
	>
		<span aria-hidden="true" class="nv-icon">{ICON_SERVER}</span>
		<span>{SITE_NAME.toLowerCase()}/</span>
	</a>
	<ul>
		{#each files as route, i (route)}
			{@const lastRoute = i === files.length - 1}
			{@const children = NAV_CHILDREN[route.toLowerCase()] ?? []}
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
						<span aria-hidden="true" class="nv-icon">{icon(child, isChildActive(href))}</span>
						<span>{child}/</span>
					</a>
				{/each}
			</li>
		{/each}
	</ul>
</aside>
