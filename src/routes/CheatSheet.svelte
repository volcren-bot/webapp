<script lang="ts">
	import { cheatSheet, localShortcuts, type Shortcut } from "#lib/shortcuts.svelte.js"

	let { globals }: { globals: Shortcut[] } = $props()

	let dialog = $state<HTMLDialogElement>()
	let query = $state("")

	$effect(() => {
		if (!dialog) return
		if (cheatSheet.open && !dialog.open) {
			query = ""
			dialog.showModal()
		} else if (!cheatSheet.open && dialog.open) dialog.close()
	})

	const rows = $derived.by(() => {
		const q = query.trim().toLowerCase()
		return [...localShortcuts(), ...globals].filter(
			(s) => !q || `${s.display} ${s.label} ${s.scope}`.toLowerCase().includes(q)
		)
	})
</script>

<dialog
	bind:this={dialog}
	onclose={() => (cheatSheet.open = false)}
	onclick={(e) => e.target === dialog && dialog.close()}
	aria-label="Keyboard shortcuts"
	class="m-auto w-[min(40rem,92vw)] rounded-md border border-(--tn-bg-hl) bg-(--tn-bg) p-4 text-(--tn-fg) backdrop:bg-black/60"
>
	<div class="flex flex-col gap-3">
		<h2 class="text-lg font-bold">Cheat sheet</h2>

		<input
			type="search"
			bind:value={query}
			placeholder="Search shortcuts…"
			aria-label="Search shortcuts"
			class="rounded border border-(--tn-bg-hl) bg-transparent px-2 py-1 outline-none focus:border-(--tn-blue)"
		/>

		<div class="max-h-[50vh] overflow-y-auto">
			<table class="w-full border-collapse text-left">
				<thead class="nv-dim sticky top-0 bg-(--tn-bg)">
					<tr>
						<th class="py-1 pr-4 font-normal">Key</th>
						<th class="py-1 pr-4 font-normal">Action</th>
						<th class="py-1 font-normal">Where</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-(--tn-bg-hl)">
					{#each rows as s (s.scope + s.display + s.label)}
						<tr>
							<td class="py-1 pr-4 whitespace-nowrap"><span class="nv-key">{s.display}</span></td>
							<td class="py-1 pr-4">{s.label}</td>
							<td class="nv-dim py-1">{s.scope}</td>
						</tr>
					{:else}
						<tr><td colspan="3" class="nv-dim py-3 text-center">No shortcuts match.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>

		<p class="nv-dim text-[0.85rem]"><span class="nv-key">Esc</span> to close</p>
	</div>
</dialog>
