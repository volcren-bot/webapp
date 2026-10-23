<script lang="ts">
	import { onMount } from "svelte"
	import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, type ThemeId } from "#lib/themes"

	let open = $state(false)
	let current = $state<ThemeId>(DEFAULT_THEME)

	const currentName = $derived(THEMES.find((t) => t.id === current)?.name ?? "")

	onMount(() => {
		const saved = document.documentElement.dataset.nvTheme as ThemeId | undefined
		if (saved && THEMES.some((t) => t.id === saved)) current = saved
	})

	function select(id: ThemeId) {
		current = id
		document.documentElement.dataset.nvTheme = id
		try {
			localStorage.setItem(THEME_STORAGE_KEY, id)
		} catch {
			// storage unavailable; the theme still applies for this session
		}
		open = false
	}
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && (open = false)} />

<div class="relative flex">
	<button
		type="button"
		aria-label="Change theme"
		aria-haspopup="menu"
		aria-expanded={open}
		title={currentName}
		class="nv-tab cursor-pointer border-r-0"
		class:active={open}
		onclick={() => (open = !open)}
	>
		<span aria-hidden="true" style="color: var(--tn-purple)">◐</span>
		<span class="hidden sm:inline">theme</span>
	</button>

	{#if open}
		<button
			type="button"
			tabindex="-1"
			aria-label="Close theme menu"
			class="fixed inset-0 z-30 cursor-default"
			onclick={() => (open = false)}
		></button>
		<div class="nv-float nv-themes fixed top-9 right-3 z-40 mt-0 w-56" role="menu">
			<span class="nv-title">colorscheme</span>
			{#each THEMES as theme (theme.id)}
				<button
					type="button"
					role="menuitemradio"
					aria-checked={theme.id === current}
					onclick={() => select(theme.id)}
				>
					<span class="nv-swatch" data-nv-theme={theme.id} aria-hidden="true">
						<i></i><i></i><i></i>
					</span>
					<span>{theme.name}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
