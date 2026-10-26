<script lang="ts">
	import { page } from "$app/state"
	import MessageCircle from "@lucide/svelte/icons/message-circle"
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
			href="https://github.com/volcren-bot"
			target="_blank"
			rel="noopener noreferrer"
			class="nv-seg inline-flex items-center gap-1 hover:text-(--tn-blue)"
		>
			<svg
				class="size-3.5"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path
					d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
				/>
				<path d="M9 18c-4.51 2-5-2-7-2" />
			</svg>
			github
		</a>
		<a
			href="https://discord.gg/pGfe2zhJph"
			target="_blank"
			rel="noopener noreferrer"
			class="nv-seg inline-flex items-center gap-1 hover:text-(--tn-blue)"
		>
			<MessageCircle class="size-3.5" aria-hidden="true" />
			discord
		</a>
		<a href="/account" class="nv-seg alt">{profile ? profile.username : "guest"}</a>
		<a href="/information" class="nv-seg" style="background: var(--tn-blue); color: var(--tn-bg-dark)">
			&copy; {new Date().getFullYear()}
		</a>
	</span>
</footer>
