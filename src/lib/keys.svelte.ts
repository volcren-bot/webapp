import { goto } from "$app/navigation"
import { page } from "$app/state"
import { getContext, setContext, untrack } from "svelte"
import { options, type RouteNode } from "./routes"

/** A key a page or component handles while it is mounted. */
export type Key = {
	/** `KeyboardEvent.key` values that trigger it. */
	keys: string[]
	/** What the key badge shows. */
	display: string
	label: string
	run: (e: KeyboardEvent) => void
}

export const GO = "g"
export const HELP = "h"
export const UP = "Backspace"
const RESERVED = [GO, HELP, UP, "Escape"]

const ROUTES = Symbol("routes")

export function setRouteTree(get: () => RouteNode) {
	setContext(ROUTES, get)
}

/** The layout's tree, as a getter to call from derived state. Call during component init. */
export function useRouteTree() {
	return getContext<() => RouteNode>(ROUTES)
}

export const help = $state({ open: false })

/** The go sequence in progress: the node whose options are offered, and the keys typed so far. */
export const go = $state<{ node: RouteNode | null; keys: string[] }>({ node: null, keys: [] })

export const TOAST_MS = 1800
/** The last key that fired; `id` is -1 once it has faded. */
export const toast = $state({ id: -1, keys: "", label: "" })
let toastTimer: ReturnType<typeof setTimeout>
let nextToast = 0

function show(keys: string, label: string) {
	Object.assign(toast, { id: nextToast++, keys, label })
	clearTimeout(toastTimer)
	toastTimer = setTimeout(() => (toast.id = -1), TOAST_MS)
}

let nextOwner = 0
const registry = $state<Record<number, { scope: string; keys: Key[] }>>({})

export function activeKeys() {
	return Object.values(registry).flatMap((r) => r.keys.map((key) => ({ ...key, scope: r.scope })))
}

/** Registers keys for the lifetime of the calling component. Call during component init. */
export function useKeys(get: () => Key[], scope = "This page") {
	const owner = nextOwner++
	$effect(() => {
		registry[owner] = { scope, keys: get() }
		// The check reads every registration; tracking them would rerun this effect on its own write.
		if (import.meta.env.DEV) untrack(checkCollisions)
		return () => delete registry[owner]
	})
}

function checkCollisions() {
	const owners: Record<string, string> = {}
	for (const key of activeKeys()) {
		for (const k of key.keys) {
			const owner = RESERVED.includes(k) ? "the layout" : owners[k]
			if (owner) console.error(`Key "${k}" for "${key.label}" is already taken by ${owner}`)
			owners[k] = `"${key.label}"`
		}
	}
}

function reset() {
	go.node = null
	go.keys = []
}

function step(e: KeyboardEvent) {
	e.preventDefault()
	const from = go.node!
	const target = options(from).find((n) => n.key === e.key)
	if (!target) return reset()
	go.keys.push(e.key)
	goto(target.href)
	if (target.href === from.href || !target.children.length) {
		show(go.keys.join(" "), target.href)
		reset()
	} else go.node = target
}

export function handleKey(e: KeyboardEvent, root: RouteNode) {
	if (e.ctrlKey || e.metaKey || e.altKey) return
	const target = e.target instanceof HTMLElement ? e.target : null
	const dialog = document.querySelector<HTMLDialogElement>("dialog[open]")
	if (dialog) {
		// Backspace still edits text, so it only closes the dialog from an empty or non-text target.
		const text = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
		if (e.key === UP && !(text && target.value !== "")) {
			e.preventDefault()
			dialog.close()
		}
		return
	}
	if (target?.closest("input, textarea, select, [contenteditable]")) return
	if (go.node) return step(e)
	if (e.key === GO) {
		e.preventDefault()
		go.node = root
		go.keys = [GO]
		return
	}
	if (e.key === HELP) {
		e.preventDefault()
		help.open = true
		return
	}
	if (e.key === UP) {
		const path = page.url.pathname.replace(/\/+$/, "")
		if (!path) return
		e.preventDefault()
		const parent = path.slice(0, path.lastIndexOf("/")) || "/"
		show(UP, parent)
		goto(parent)
		return
	}
	// Enter on a focused link or button belongs to that element.
	if (e.key === "Enter" && target?.closest("a, button, summary")) return
	const match = activeKeys().find((key) => key.keys.includes(e.key))
	if (!match) return
	e.preventDefault()
	show(match.display, match.label)
	match.run(e)
}
