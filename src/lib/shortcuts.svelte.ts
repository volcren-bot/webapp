import { page } from "$app/state"

export type Shortcut = {
	/** What the key badge in the cheat sheet shows. */
	display: string
	label: string
	scope: string
	/** `KeyboardEvent.key` values that trigger it. Without any, it is only listed (the browser or a component handles it). */
	keys?: string[]
	/** Where it navigates to, so a press on that page moves on to the next shortcut instead. */
	href?: string
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

export const KEY_POPUP_MS = 1800

let nextPopup = 0
/** Recently pressed shortcuts, oldest first. */
export const keyPopups = $state<{ id: number; display: string }[]>([])

function showKey(display: string) {
	const id = nextPopup++
	keyPopups.push({ id, display })
	// Same lifetime for all, so they expire in the order they were pressed.
	setTimeout(() => {
		const i = keyPopups.findIndex((p) => p.id === id)
		if (i !== -1) keyPopups.splice(i, 1)
	}, KEY_POPUP_MS)
}

let lastKey: string | undefined
let lastIndex = 0

/**
 * Runs the shortcut matching the key: the current page's first, then the global ones.
 * When several share the key, repeated presses cycle through them in that order.
 */
export function handleKey(e: KeyboardEvent, globals: Shortcut[]) {
	if (e.key === "Backspace" && !e.repeat) {
		const modal = document.querySelector<HTMLDialogElement>("dialog[open]")
		// Backspace still edits text, so it only closes the modal from an empty or non-text target.
		const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
		if (modal && !(typing && e.target.value !== "")) {
			e.preventDefault()
			modal.close()
			return
		}
	}
	if (cheatSheet.open) return
	if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return
	if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]"))
		return
	const all = [...localShortcuts(), ...globals].filter((s) => s.run && s.keys?.includes(e.key))
	const elsewhere = all.filter((s) => s.href !== page.url.pathname)
	const matches = elsewhere.length ? elsewhere : all
	if (!matches.length) {
		lastKey = undefined
		return
	}
	lastIndex = e.key === lastKey ? (lastIndex + 1) % matches.length : 0
	lastKey = e.key
	const match = matches[lastIndex]
	e.preventDefault()
	showKey(match.display)
	match.run?.(e)
}
