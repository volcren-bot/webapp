<script lang="ts">
	import { TOAST_MS, go, toast } from "#lib/keys.svelte.js"
	import { options } from "#lib/routes"
</script>

<!-- Bottom-right like a which-key window: the pending go sequence and its options, or the last key that fired -->
<div class="pointer-events-none fixed right-4 bottom-10 z-50 flex max-w-[min(24rem,92vw)] flex-col items-end">
	{#if go.node}
		<div class="nv-float key-panel m-0 flex flex-col gap-1 shadow-xl" role="status" aria-live="polite">
			<span class="nv-title">{go.keys.join(" ")}</span>
			<ul class="flex max-h-[50vh] flex-col overflow-y-auto">
				{#each options(go.node).filter((n) => n.key) as option (option.href)}
					<li class="flex items-center gap-2">
						<span class="nv-key">{option.key}</span>
						<span class="truncate" class:nv-dim={option.href === go.node.href}
							>{option.name}{option.children.length ? "/" : ""}</span
						>
					</li>
				{/each}
			</ul>
			<span class="nv-dim text-sm"><span class="nv-key">Esc</span> cancel</span>
		</div>
	{:else if toast.id >= 0}
		{#key toast.id}
			<div
				class="key-toast flex items-center gap-2 rounded-md border border-(--tn-orange) bg-(--tn-bg) px-3 py-1 shadow-xl"
				style:animation-duration="{TOAST_MS}ms"
				role="status"
				aria-live="polite"
			>
				<span class="nv-key">{toast.keys}</span>
				<span class="truncate">{toast.label}</span>
			</div>
		{/key}
	{/if}
</div>

<style>
	.key-panel {
		min-width: 14rem;
	}
	.key-toast {
		animation-name: key-fade;
		animation-timing-function: ease-in;
		animation-fill-mode: forwards;
	}
	@keyframes key-fade {
		0%,
		60% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
