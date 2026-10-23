<script lang="ts">
	import { page } from "$app/state"
	import { SITE_NAME } from "#lib/utils"
	import { cheatSheet } from "#lib/shortcuts.svelte.js"

	const { profile } = $derived(page.data)

	let insert = $state(false)

	function isField(el: EventTarget | null) {
		return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
	}
</script>

<svelte:window onfocusin={(e) => (insert = isField(e.target))} onfocusout={() => (insert = false)} />

<footer class="nv-statusline">
	<span>
		<span class="nv-mode" class:insert>{insert ? "INSERT" : "NORMAL"}</span>
		<span class="nv-seg accent">⎇ main</span>
		<span class="nv-seg">{page.url.pathname}</span>
	</span>
	<span>
		{#if page.url.pathname !== "/"}
			<button
				type="button"
				class="nv-seg cursor-pointer hover:text-(--tn-blue)"
				onclick={() => (cheatSheet.open = true)}
			>
				<span style="color: var(--tn-orange)">K</span> cheat sheet
			</button>
		{/if}
		<a href="/" class="nv-seg hidden sm:block">{SITE_NAME.toLowerCase()}</a>
		<a href="/account" class="nv-seg alt">{profile ? profile.username : "guest"}</a>
		<a
			href="/information"
			class="nv-seg"
			style="background: var(--tn-blue); color: var(--tn-bg-dark)"
		>
			&copy; {new Date().getFullYear()}
		</a>
	</span>
</footer>
