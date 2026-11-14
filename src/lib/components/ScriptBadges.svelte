<script lang="ts">
	import Ban from "@lucide/svelte/icons/ban"
	import Gift from "@lucide/svelte/icons/gift"
	import ListOrdered from "@lucide/svelte/icons/list-ordered"

	let {
		community,
		granted = false,
		authorBanned = false,
		queueable = false
	}: { community: boolean; granted?: boolean; authorBanned?: boolean; queueable?: boolean } = $props()
</script>

<span
	class="nv-pill"
	style="color: {community ? 'var(--tn-orange)' : 'var(--tn-blue)'}"
	title={community
		? "Written by a community member and not reviewed by staff. Run it at your own risk."
		: "Written by a scripter."}>{community ? "community" : "official"}</span
>
{#if granted}
	<span
		class="nv-pill flex items-center gap-1 text-(--tn-green)"
		title="Added to your account with a share code"
	>
		<Gift class="size-4 shrink-0" /> shared with you
	</span>
{/if}
{#if queueable}
	<span
		class="nv-pill flex items-center gap-1 text-(--tn-cyan)"
		title="The loader can run it one after another with other scripts in a queue"
	>
		<ListOrdered class="size-4 shrink-0" /> queueable
	</span>
{/if}
{#if authorBanned}
	<span class="nv-pill flex items-center gap-1 text-error-400" title="Hidden from everyone below moderator">
		<Ban class="size-4 shrink-0" /> author banned
	</span>
{/if}
