<script lang="ts">
	import Clipboard from "@lucide/svelte/icons/clipboard"
	import ClipboardCheck from "@lucide/svelte/icons/clipboard-check"
	let { uuid }: { uuid: string } = $props()
	let copied = $state(false)
</script>

<button
	class="btn inline-flex w-fit items-center gap-1 self-start text-xs"
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
		<ClipboardCheck class="h-3" />
	{:else}
		<Clipboard class="h-3" />
	{/if}
</button>
