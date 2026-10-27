<script lang="ts">
	import Ban from "@lucide/svelte/icons/ban"
	import Gift from "@lucide/svelte/icons/gift"

	let {
		community,
		granted = false,
		authorBanned = false
	}: { community: boolean; granted?: boolean; authorBanned?: boolean } = $props()
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
{#if authorBanned}
	<span class="nv-pill flex items-center gap-1 text-error-400" title="Hidden from everyone below moderator">
		<Ban class="size-4 shrink-0" /> author banned
	</span>
{/if}
