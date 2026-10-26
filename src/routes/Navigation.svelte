<script lang="ts">
	import { enhance } from "$app/forms"
	import { navigating, page } from "$app/state"
	import { routeHref } from "#lib/utils"
	import { sidebar } from "#lib/sidebar.svelte.js"
	import { useShortcuts } from "#lib/shortcuts.svelte.js"
	import Logo from "./Logo.svelte"
	import ThemeSwitcher from "./ThemeSwitcher.svelte"

	let showProfile = $state(false)
	let panel = $state<HTMLFormElement>()
	let toggle = $state<HTMLButtonElement>()

	const { profile } = $derived(page.data)

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
</script>

<svelte:window
	onpointerdown={(e) => {
		const target = e.target as Node
		if (showProfile && !panel?.contains(target) && !toggle?.contains(target)) showProfile = false
	}}
	onkeydown={(e) => {
		if (e.key !== "Escape") return
		showProfile = false
		sidebar.open = false
	}}
/>

<nav class="nv-bufferline relative shrink-0">
	<!-- Wide screens link home from here; narrow ones open the sidebar, which holds every page -->
	<div class="flex min-w-0 grow overflow-x-auto">
		<a href="/" class="nv-tab max-md:hidden" class:active={path === "/"} aria-label="Navigate to home page">
			<Logo selected={path === "/"} />
		</a>
		<button
			type="button"
			class="nv-tab cursor-pointer md:hidden"
			class:active={sidebar.open}
			aria-label="Toggle the sidebar"
			aria-expanded={sidebar.open}
			onclick={() => (sidebar.open = !sidebar.open)}
		>
			<Logo selected={sidebar.open} />
		</button>
	</div>

	<button
		bind:this={toggle}
		name="User panel"
		aria-label="Open user panel"
		aria-expanded={showProfile}
		class="nv-tab ml-auto shrink-0 cursor-pointer"
		class:active={showProfile}
		onclick={() => (showProfile = !showProfile)}
	>
		<span class="max-w-[8rem] truncate" class:nv-dim={!profile}>{profile ? profile.username : "guest"}</span>
		<span aria-hidden="true">{showProfile ? "▴" : "▾"}</span>
	</button>

	<ThemeSwitcher />
</nav>

{#if showProfile}
	<form
		method="POST"
		bind:this={panel}
		class="nv-float absolute! top-9 right-3 z-50 mt-0 w-64 border-(--tn-blue) shadow-xl!"
		use:enhance
	>
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
