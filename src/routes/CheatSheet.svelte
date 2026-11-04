<script lang="ts">
	import { GO, HELP, UP, activeKeys, help, useRouteTree } from "#lib/keys.svelte.js"
	import { sequences } from "#lib/routes"

	const tree = useRouteTree()
	let dialog = $state<HTMLDialogElement>()
	let query = $state("")

	$effect(() => {
		if (!dialog) return
		if (help.open && !dialog.open) {
			query = ""
			dialog.showModal()
		} else if (!help.open && dialog.open) dialog.close()
	})

	const layoutKeys = [
		{ display: GO, label: "Go to a page, following the panel", scope: "Global" },
		{ display: HELP, label: "Open this cheat sheet", scope: "Global" },
		{ display: UP, label: "Go to the parent page, or close a dialog", scope: "Global" },
		{ display: "Esc", label: "Close menus and panels", scope: "Global" }
	]

	const rows = $derived.by(() => {
		const all = [
			...layoutKeys,
			...activeKeys(),
			...sequences(tree()).map(({ node, keys }) => ({
				display: keys.join(" "),
				label: node.href,
				scope: "Pages"
			}))
		]
		const q = query.trim().toLowerCase()
		return all.filter((s) => !q || `${s.display} ${s.label} ${s.scope}`.toLowerCase().includes(q))
	})
</script>

<dialog
	bind:this={dialog}
	onclose={() => (help.open = false)}
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
			class="input"
		/>

		<div class="max-h-[50vh] overflow-y-auto">
			<table class="w-full border-collapse text-left">
				<thead class="nv-dim sticky top-0 bg-(--tn-bg)">
					<tr>
						<th class="py-1 pr-4 font-normal">Keys</th>
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

		<p class="nv-dim text-sm"><span class="nv-key">Esc</span> to close</p>
	</div>
</dialog>
