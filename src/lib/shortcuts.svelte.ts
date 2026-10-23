export type Shortcut = {
	/** What the key badge in the cheat sheet shows. */
	display: string
	label: string
	scope: string
	/** `KeyboardEvent.key` values that trigger it. Without any, it is only listed (the browser or a component handles it). */
	keys?: string[]
	run?: (e: KeyboardEvent) => void
}

export const cheatSheet = $state({ open: false })

// Shortcuts registered by whichever page or component is currently mounted.
let nextOwner = 0
const registry = $state<Record<number, Shortcut[]>>({})

export function localShortcuts(): Shortcut[] {
	return Object.values(registry).flat()
}

/** Registers shortcuts for the lifetime of the calling component. Call during component init. */
export function useShortcuts(get: () => Shortcut[]) {
	const owner = nextOwner++
	$effect(() => {
		registry[owner] = get()
		return () => delete registry[owner]
	})
}

/** Runs the shortcut matching the key: the current page's first, then the global ones. */
export function handleKey(e: KeyboardEvent, globals: Shortcut[]) {
	if (cheatSheet.open) return
	if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
	if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]")) return
	const match = [...localShortcuts(), ...globals].find((s) => s.keys?.includes(e.key))
	if (!match?.run) return
	e.preventDefault()
	match.run(e)
}
