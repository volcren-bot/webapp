<script lang="ts">
	import Clipboard from "@lucide/svelte/icons/clipboard"
	import ClipboardCheck from "@lucide/svelte/icons/clipboard-check"
	let { uuid }: { uuid: string } = $props()
	let copied = $state(false)
</script>

<button
	class="btn w-fit text-sm"
	title={uuid}
	type="button"
	onclick={async (e) => {
		e.preventDefault()
		await navigator.clipboard.writeText(uuid)
		copied = true
		setTimeout(() => (copied = false), 2000)
	}}
>
	ID: {uuid.split("-")[0]}…
	{#if copied}
		<ClipboardCheck class="size-3.5 shrink-0" />
	{:else}
		<Clipboard class="size-3.5 shrink-0" />
	{/if}
</button>
