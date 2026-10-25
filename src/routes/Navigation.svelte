<script lang="ts">
	import { enhance } from "$app/forms"
	import { navigating, page } from "$app/state"
	import { NAV_ROUTES, USER_ROUTES, routeHref } from "#lib/utils"
	import { useShortcuts } from "#lib/shortcuts.svelte.js"
	import Logo from "./Logo.svelte"
	import ThemeSwitcher from "./ThemeSwitcher.svelte"

	let showProfile = $state(false)
	let panel = $state<HTMLFormElement>()
	let toggle = $state<HTMLButtonElement>()

	const { profile } = $derived(page.data)

	const tabs = $derived(profile ? [...NAV_ROUTES, ...USER_ROUTES] : NAV_ROUTES)

	// Use the destination while navigating so the tabs update on click, not after the load finishes.
	const path = $derived(navigating.to?.url.pathname ?? page.url.pathname)

	useShortcuts(() => [
		{
			display: "u",
			label: "Toggle the user panel",
			scope: "Global",
			keys: ["u"],
			run: () => (showProfile = !showProfile)
		}
	])

	function isActive(route: string) {
		const href = routeHref(route)
		return href === "/" ? path === "/" : path.startsWith(href)
	}
</script>

<svelte:window
	onpointerdown={(e) => {
		const target = e.target as Node
		if (showProfile && !panel?.contains(target) && !toggle?.contains(target)) showProfile = false
	}}
	onkeydown={(e) => e.key === "Escape" && (showProfile = false)}
/>

<nav class="nv-bufferline relative shrink-0">
	{#each tabs as route (route)}
		<a
			href={routeHref(route)}
			class="nv-tab"
			class:md:hidden={route !== "Home"}
			class:active={isActive(route)}
			aria-label={route === "Home" ? "Navigate to home page" : route}
		>
			{#if route === "Home"}
				<Logo selected={isActive(route)} />
			{:else}
				<span>{route.toLowerCase()}</span>
			{/if}
		</a>
	{/each}

	<button
		bind:this={toggle}
		name="User panel"
		aria-label="Open user panel"
		aria-expanded={showProfile}
		class="nv-tab ml-auto cursor-pointer"
		class:active={showProfile}
		onclick={() => (showProfile = !showProfile)}
	>
		<span class:nv-dim={!profile}>{profile ? profile.username : "guest"}</span>
		<span aria-hidden="true">{showProfile ? "▴" : "▾"}</span>
	</button>

	<ThemeSwitcher />
</nav>

{#if showProfile}
	<form method="POST" bind:this={panel}
		class="nv-float absolute! top-9 right-3 z-50 mt-0 w-64 shadow-xl!" use:enhance>
		{#if profile}
			<span class="nv-title">{profile.username}</span>
			<div class="flex flex-col items-start gap-3">
				<a href="/account" aria-label="Open account page" onclick={() => (showProfile = false)}>
					account settings
				</a>
				<button
					name="Logout"
					aria-label="Logout"
					class="btn"
					formaction="/auth?/logout&path={encodeURIComponent(page.url.pathname + page.url.search)}"
				>
					logout
				</button>
			</div>
		{:else}
			<span class="nv-title">log in</span>
			<button
				name="Login"
				aria-label="Login to your account"
				class="btn"
				formaction="/auth?/login&provider=discord&path={encodeURIComponent(
					page.url.pathname + page.url.search
				)}"
			>
				login with discord
			</button>
		{/if}
	</form>
{/if}
