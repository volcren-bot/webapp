<script lang="ts">
	import { page } from "$app/state"
	import { SITE_NAME } from "#lib/utils"

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
		<span class="nv-seg hidden sm:block">{SITE_NAME.toLowerCase()}</span>
		<span class="nv-seg alt">{profile ? profile.username : "guest"}</span>
		<span class="nv-seg" style="background: var(--tn-blue); color: var(--tn-bg-dark)">
			&copy; {new Date().getFullYear()}
		</span>
	</span>
</footer>
