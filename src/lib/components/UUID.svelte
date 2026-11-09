<script lang="ts">
	import Clipboard from "@lucide/svelte/icons/clipboard"
	import ClipboardCheck from "@lucide/svelte/icons/clipboard-check"
	import { clipboard } from "#lib/clipboard.svelte.js"

	let { uuid }: { uuid: string } = $props()
	const clip = clipboard()
</script>

<button
	class="btn w-fit text-sm"
	title={uuid}
	type="button"
	onclick={(e) => {
		e.preventDefault()
		clip.copy(uuid)
	}}
>
	ID: {uuid.split("-")[0]}…
	{#if clip.copied === uuid}
		<ClipboardCheck class="size-3.5 shrink-0" />
	{:else}
		<Clipboard class="size-3.5 shrink-0" />
	{/if}
</button>
