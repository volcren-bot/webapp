<script lang="ts">
	import { page } from "$app/state"
	import { SITE_NAME } from "#lib/utils"
	import { cheatSheet } from "#lib/shortcuts.svelte.js"

	const { profile } = $derived(page.data)

	let insert = $state(false)

	let copied = $state(false)
	let copiedTimer: ReturnType<typeof setTimeout>

	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(page.url.href)
		} catch {
			return
		}
		copied = true
		clearTimeout(copiedTimer)
		copiedTimer = setTimeout(() => (copied = false), 1500)
	}

	function isField(el: EventTarget | null) {
		return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
	}
</script>

<svelte:window onfocusin={(e) => (insert = isField(e.target))} onfocusout={() => (insert = false)} />

<footer class="nv-statusline shrink-0">
	<span>
		<span class="nv-mode" class:insert>{insert ? "INSERT" : "NORMAL"}</span>
		<span class="nv-seg accent">⎇ main</span>
		<button
			type="button"
			class="nv-seg cursor-pointer hover:text-(--tn-blue)"
			title="Copy URL"
			onclick={copyUrl}
		>
			{copied ? "copied!" : page.url.pathname}
		</button>
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
		<a
			href="https://discord.gg/pGfe2zhJph"
			target="_blank"
			rel="noopener noreferrer"
			class="nv-seg hover:text-(--tn-blue)"
		>
			discord
		</a>
		<a href="/" class="nv-seg hidden sm:block">{SITE_NAME}</a>
		<a href="/account" class="nv-seg alt">{profile ? profile.username : "guest"}</a>
		<a href="/information" class="nv-seg" style="background: var(--tn-blue); color: var(--tn-bg-dark)">
			&copy; {new Date().getFullYear()}
		</a>
	</span>
</footer>
