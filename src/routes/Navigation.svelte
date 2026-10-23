<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/state"
	import { NAV_ROUTES, routeHref } from "#lib/utils"
	import Logo from "./Logo.svelte"
	import ThemeSwitcher from "./ThemeSwitcher.svelte"

	let showProfile = $state(false)

	const { profile } = $derived(page.data)

	const tabs = $derived(profile ? [...NAV_ROUTES, "Account"] : NAV_ROUTES)

	function isActive(route: string) {
		const href = routeHref(route)
		return href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href)
	}
</script>

<nav class="nv-bufferline relative">
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
	<form method="POST" class="nv-float absolute top-9 right-3 mt-0 w-64 shadow-xl!" use:enhance>
		{#if profile}
			<span class="nv-title">{profile.username}</span>
			<div class="flex flex-col items-start gap-3">
				<a href="/account" aria-label="Open account page" onclick={() => (showProfile = false)}>
					account settings
				</a>
				<button name="Logout" aria-label="Logout" class="btn" formaction="/auth?/logout"> logout </button>
			</div>
		{:else}
			<span class="nv-title">log in</span>
			<!-- Change the provider to whichever OAuth provider you enabled in Supabase -->
			<button
				name="Login"
				aria-label="Login to your account"
				class="btn"
				formaction="/auth?/login&provider=github&path={encodeURIComponent(
					page.url.pathname + page.url.search
				)}"
			>
				login with github
			</button>
		{/if}
	</form>
{/if}
