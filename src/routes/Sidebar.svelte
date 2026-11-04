<script lang="ts">
	import { navigating, page } from "$app/state"
	import { untrack } from "svelte"
	import { useRouteTree } from "#lib/keys.svelte.js"
	import type { RouteNode } from "#lib/routes"
	import { sidebar } from "#lib/sidebar.svelte.js"
	import { SITE_NAME } from "#lib/utils"

	const tree = useRouteTree()
	const root = $derived(tree())

	// Use the destination while navigating so the tree updates on click, not after the load finishes.
	const path = $derived(navigating.to?.url.pathname ?? page.url.pathname)

	function inside(href: string) {
		return path === href || path.startsWith(`${href}/`)
	}

	// A page with children is active only on itself; a leaf also covers its dynamic sub-pages.
	function isActive(node: RouteNode) {
		return node.children.length ? path === node.href : inside(node.href)
	}

	// Manual expand/collapse per node; unset means "open while the current page is inside it".
	let expanded = $state<Record<string, boolean>>({})

	function isOpen(node: RouteNode) {
		return expanded[node.href] ?? inside(node.href)
	}

	// Leaving a node drops its manual override so it collapses again.
	$effect(() => {
		const current = path
		untrack(() => {
			for (const href of Object.keys(expanded)) {
				if (current !== href && !current.startsWith(`${href}/`)) delete expanded[href]
			}
		})
	})

	function onClick(node: RouteNode) {
		if (!node.children.length) return
		// Clicking the page you're on toggles it; arriving from elsewhere always opens it.
		expanded[node.href] = path === node.href ? !isOpen(node) : true
	}

	// Nerd Font glyphs, as in neovim's file explorer.
	const ICON_FOLDER = ""
	const ICON_FOLDER_OPEN = ""
	const ICON_TERMINAL = ""
	const ICON_SERVER = ""
	const ICON_FILE = ""

	// The first two levels are directories, as in the file tree they mirror; deeper pages are files.
	function isDir(depth: number) {
		return depth < 3
	}

	function icon(node: RouteNode, depth: number) {
		if (node.name === "scripts" && depth === 1) return ICON_TERMINAL
		if (!isDir(depth)) return ICON_FILE
		return isOpen(node) || isActive(node) ? ICON_FOLDER_OPEN : ICON_FOLDER
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

{#snippet branch(nodes: RouteNode[], prefix: string, depth: number)}
	{#each nodes as node, i (node.href)}
		{@const last = i === nodes.length - 1}
		<li>
			<a
				href={node.href}
				title={node.name}
				onclick={() => onClick(node)}
				class:active={isActive(node)}
				aria-expanded={node.children.length ? isOpen(node) : undefined}
				aria-current={isActive(node) ? "page" : undefined}
			>
				<span aria-hidden="true" class="nv-guide">{prefix}{last ? "└─" : "├─"}</span>
				<span aria-hidden="true" class="nv-icon">{icon(node, depth)}</span>
				<span class="nv-name">{node.name}{isDir(depth) ? "/" : ""}</span>
				{#if node.key}<span class="nv-tree-key" aria-hidden="true">{node.key}</span>{/if}
			</a>
			{#if node.children.length && isOpen(node)}
				<ul>{@render branch(node.children, prefix + (last ? "  " : "│ "), depth + 1)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<aside
	class="nv-tree shrink-0 overflow-auto max-md:fixed max-md:top-9 max-md:bottom-0 max-md:left-0 max-md:z-40 max-md:max-w-[85vw] max-md:shadow-xl md:block"
	class:max-md:hidden={!sidebar.open}
	aria-label="File explorer"
>
	<div class="nv-row nv-root mb-1">explorer</div>
	<a href="/" class="nv-home" class:active={path === "/"} aria-current={path === "/" ? "page" : undefined}>
		<span aria-hidden="true" class="nv-icon">{ICON_SERVER}</span>
		<span class="nv-name">{SITE_NAME}/</span>
		<span class="nv-tree-key" aria-hidden="true">{root.key}</span>
	</a>
	<ul>{@render branch(root.children, "", 1)}</ul>
</aside>
