<script lang="ts">
	import { KEY_POPUP_MS, keyPopups } from "#lib/shortcuts.svelte.js"
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-12 z-50 flex flex-row items-center justify-center gap-2"
	aria-hidden="true"
>
	{#each keyPopups as popup (popup.id)}
		<span class="nv-key key-popup" style:animation-duration="{KEY_POPUP_MS}ms">{popup.display}</span>
	{/each}
</div>

<style>
	.key-popup {
		padding: 0.25rem 1ch;
		border: 1px solid var(--tn-orange);
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.4);
		animation-name: key-fade;
		animation-timing-function: ease-in;
		animation-fill-mode: forwards;
	}

	@keyframes key-fade {
		0%,
		30% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
