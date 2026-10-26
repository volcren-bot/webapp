<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import { tick, untrack } from "svelte"
	import { superForm } from "sveltekit-superforms"
	import { zod4Client } from "sveltekit-superforms/adapters"
	import { CATEGORIES, MAX_PRICE, STAGES, TYPES } from "#lib/scripts"
	import { scriptSchema } from "#lib/schemas"
	import type { Infer, SuperValidated } from "sveltekit-superforms"

	let {
		data,
		action = "",
		label,
		heading,
		confirm,
		progress,
		fresh = false,
		boxed = false,
		minStage = "prototype"
	}: {
		data: SuperValidated<Infer<typeof scriptSchema>>
		action?: string
		/** Accessible name of the form. */
		label: string
		/** First line of the screen. */
		heading: string
		/** The y/n question, e.g. "Create this script?" */
		confirm: string
		/** Printed after answering y. */
		progress: string
		/** A blank script: starts on the example stage and has nothing to prefill. */
		fresh?: boolean
		/** Shown inside its own titled box that grows with its content, and does not take the focus on load. */
		boxed?: boolean
		/** Stages only move forward, so the stages before the current one are not offered. */
		minStage?: (typeof STAGES)[number]
	} = $props()

	const { form, enhance, submit, message } = superForm(
		untrack(() => data),
		{
			dataType: "json",
			taintedMessage: null,
			validators: zod4Client(scriptSchema),
			onResult({ result }) {
				if (result.type !== "success" || !busy) return
				busy = false
				// Start over from the first question with the saved answers prefilled.
				lines = header()
				say("Saved.", "ok")
				say("")
				revisiting = true
				enter(0)
			}
		}
	)

	type Field = keyof typeof $form
	type Step = {
		key: Field | "confirm"
		label: string
		kind: "text" | "single" | "multi" | "confirm"
		options?: readonly string[]
		hint?: string
		skip?: () => boolean
	}

	const STEPS: Step[] = [
		{ key: "title", label: "Script name:", kind: "text" },
		{ key: "description", label: "Script description:", kind: "text", hint: "Shown in the script list." },
		{
			key: "content",
			label: "Script content:",
			kind: "text",
			hint: "What it does, setup, requirements. Shift+Enter for a new line."
		},
		{ key: "type", label: "Script type:", kind: "single", options: TYPES },
		{
			key: "price",
			label: "Price (credits per minute):",
			kind: "text",
			hint: `${fmt.credits(1)} to ${fmt.credits(MAX_PRICE)}, whole numbers.`,
			skip: () => $form.type === "free"
		},
		{
			key: "stage",
			label: "Script stage:",
			kind: "single",
			get options() {
				return STAGES.slice(STAGES.indexOf(minStage))
			}
		},
		{ key: "categories", label: "Categories:", kind: "multi", options: CATEGORIES, hint: "Pick up to 5." },
		{ key: "confirm", label: `${untrack(() => confirm)} (y/n)`, kind: "confirm" }
	]

	type Line = { text: string; cls?: "dim" | "err" | "ok" | "prompt" }
	const header = (): Line[] => [
		{ text: `${untrack(() => heading)} (TIP: ↑/↓ goes back and forward through your answers)`, cls: "dim" },
		{ text: "" }
	]
	let lines = $state<Line[]>(header())
	let step = $state(0)
	let draft = $state("")
	let cursor = $state(0)
	let selected = $state<string[]>([])
	let busy = $state(false)
	// After answering "n" the questions come back with the previous answers filled in.
	let revisiting = !untrack(() => fresh)
	// Where each question starts in `lines`, so going back can drop everything printed after it.
	const marks: number[] = []
	let furthest = 0

	// Start on the example default so the list reads [x] beta, not prototype.
	if (untrack(() => fresh)) $form.stage = "beta"

	// A blank script can only move forward over answered questions; an existing one has every field set already.
	const canAdvance = $derived(!fresh || step < furthest)

	const current = $derived(STEPS[step])
	const done = $derived(step >= STEPS.length)

	// A boxed form sits among other things, so it only takes the keyboard once clicked or tabbed into.
	let active = !untrack(() => boxed)

	let screen: HTMLElement | undefined = $state()
	let input: HTMLTextAreaElement | undefined = $state()
	let list: HTMLElement | undefined = $state()

	function say(text: string, cls?: Line["cls"]) {
		lines.push({ text, cls })
	}

	async function focusActive() {
		await tick()
		if (screen) screen.scrollTop = screen.scrollHeight
		if (!active) return
		;(current?.kind === "text" ? input : list)?.focus({ preventScroll: true })
	}

	function enter(index: number) {
		let next = index
		while (next < STEPS.length && STEPS[next].skip?.()) next++
		step = next
		furthest = Math.max(furthest, next)
		marks[next] = lines.length
		cursor = 0
		const s = STEPS[next]
		draft = s?.kind === "text" && revisiting ? String($form[s.key as Field]) : ""
		if (s?.kind === "confirm") preview()
		else if (s?.kind === "single") {
			const value = String($form[s.key as Field])
			selected = [value]
			cursor = Math.max(0, s.options!.indexOf(value))
		} else if (s?.kind === "multi") {
			selected = [...$form.categories]
		}
		focusActive()
	}

	function goBack() {
		let prev = step - 1
		while (prev >= 0 && STEPS[prev].skip?.()) prev--
		if (prev < 0) return
		lines.length = marks[prev]
		revisiting = true
		enter(prev)
	}

	function preview() {
		const rule = "─".repeat(40)
		say("")
		say(rule, "dim")
		say(`title:        ${$form.title}`)
		say(`description:  ${$form.description}`)
		say(`type:         ${$form.type}`)
		say(`price:        ${$form.price === 0 ? "free" : fmt.price($form.price)}`)
		say(`stage:        ${$form.stage}`)
		say(`categories:   ${$form.categories.join(", ") || "none"}`)
		say("content:")
		say($form.content)
		say(rule, "dim")
		say("")
	}

	function check(key: Field, raw: string): string | null {
		if (key === "price" && !/^\d+$/.test(raw)) return "Must be a whole number of credits."
		const value = key === "price" ? Number(raw) : raw
		const result = scriptSchema.shape[key].safeParse(value)
		return result.success ? null : result.error.issues[0].message
	}

	function accept(value: string | number | string[]) {
		const s = current
		const shown =
			s.key === "price"
				? fmt.price(Number(value))
				: Array.isArray(value)
					? value.join(", ") || "none"
					: value
		say(`${s.label} ${shown}`)
		;($form as Record<string, unknown>)[s.key] = value
		if (s.key === "type") $form.price = value === "free" ? 0 : Math.max(1, $form.price)
		enter(step + 1)
	}

	function submitText() {
		const s = current
		const value = draft.trim()
		const problem = check(s.key as Field, value)
		if (problem) {
			say(`${s.label} ${value}`, "dim")
			say(`error: ${problem}`, "err")
			draft = ""
			focusActive()
			return
		}
		accept(s.key === "price" ? Number(value) : value)
	}

	function onTextKey(e: KeyboardEvent) {
		e.stopPropagation()
		if (e.isComposing) return
		const caret = input?.selectionStart ?? 0
		if (e.key === "ArrowUp" && !draft.slice(0, caret).includes("\n")) {
			e.preventDefault()
			goBack()
		} else if (e.key === "ArrowDown" && canAdvance && !draft.slice(caret).includes("\n")) {
			e.preventDefault()
			submitText()
		} else if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			submitText()
		}
	}

	function onListKey(e: KeyboardEvent) {
		e.stopPropagation()
		const s = current
		const options = s.options!
		const submitList = () => {
			if (s.kind === "single" && !selected.length) selected = [options[cursor]]
			accept(s.kind === "single" ? selected[0] : selected)
		}
		// Moving past either end of the list leaves the question instead of wrapping.
		if (e.key === "ArrowUp" || e.key === "k") {
			if (cursor > 0) cursor--
			else if (e.key === "ArrowUp") goBack()
		} else if (e.key === "ArrowDown" || e.key === "j") {
			if (cursor < options.length - 1) cursor++
			else if (e.key === "ArrowDown" && canAdvance) submitList()
		} else if (e.key === " ") {
			const option = options[cursor]
			if (s.kind === "single") selected = [option]
			else if (selected.includes(option)) selected = selected.filter((o) => o !== option)
			else if (selected.length < 5) selected = [...selected, option]
		} else if (e.key === "Enter") {
			submitList()
		} else return
		e.preventDefault()
	}

	function onConfirmKey(e: KeyboardEvent) {
		e.stopPropagation()
		const key = e.key.toLowerCase()
		if (key === "y") {
			e.preventDefault()
			say(`${current.label} y`)
			say(progress, "dim")
			busy = true
			step = STEPS.length
			submit()
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			goBack()
		} else if (key === "n") {
			e.preventDefault()
			// Clear the whole screen and ask everything again, keeping the previous answers.
			lines = header()
			revisiting = true
			enter(0)
		}
	}

	// A failed save drops the user back at the confirmation.
	$effect(() => {
		if ($message && busy) {
			busy = false
			say(`error: ${$message}`, "err")
			lines.push({ text: "" })
			enter(STEPS.length - 1)
		}
	})

	// Keep the newest line in view as the screen fills up.
	$effect(() => {
		lines.length
		tick().then(() => screen && (screen.scrollTop = screen.scrollHeight))
	})

	enter(0)
</script>

{#snippet console()}
	<form method="POST" {action} use:enhance class="console" aria-label={label}>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="screen"
			bind:this={screen}
			onfocusin={() => (active = true)}
			onclick={() => {
				active = true
				focusActive()
			}}
		>
			<div class="feed" role="log" aria-live="polite">
				{#each lines as line, i (i)}
					<div class={line.cls} class:blank={!line.text}>{line.text || " "}</div>
				{/each}

				{#if !done && current}
					<div class="prompt">{current.label}</div>
					{#if current.hint}<div class="dim">{current.hint}</div>{/if}

					{#if current.kind === "text"}
						<div class="entry">
							<span class="caret" aria-hidden="true">&gt;</span>
							<div class="grow" data-value={draft}>
								<textarea
									bind:this={input}
									bind:value={draft}
									onkeydown={onTextKey}
									rows="1"
									spellcheck="false"
									autocomplete="off"
									aria-label={current.label}></textarea>
							</div>
						</div>
					{:else if current.kind === "confirm"}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
						<div
							class="options"
							tabindex="0"
							role="group"
							aria-label={current.label}
							bind:this={list}
							onkeydown={onConfirmKey}
						>
							<span class="caret" aria-hidden="true">&gt;</span> <span class="nv-cursor"></span>
						</div>
					{:else}
						<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
						<div
							class="options"
							role="listbox"
							tabindex="0"
							aria-label={current.label}
							aria-multiselectable={current.kind === "multi"}
							bind:this={list}
							onkeydown={onListKey}
						>
							{#each current.options! as option, i (option)}
								<div
									class="option"
									class:active={i === cursor}
									role="option"
									aria-selected={selected.includes(option)}
								>
									{i === cursor ? "›" : " "} [{selected.includes(option) ? "x" : " "}] {option}
								</div>
							{/each}
						</div>
						<div class="dim">
							↑/↓ move (past the ends: previous/next question) · space {current.kind === "multi"
								? "toggle"
								: "select"} · enter confirm
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</form>
{/snippet}

{#if boxed}
	<div class="nv-float flex min-h-[28rem] flex-col p-0 [&>form]:grow">
		<span class="nv-title">edit</span>
		{@render console()}
	</div>
{:else}
	{@render console()}
{/if}

<style>
	.console {
		font-family: "FiraCode Nerd Font Mono", var(--font-mono, ui-monospace, monospace);
		/* One fixed length for every line (text, prompts, options, input), so no row can grow with its glyphs. */
		--lh: 1.3rem;
		line-height: var(--lh);
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}
	.screen {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		/* Matches .nv-float's padding, so the text lines up with the box title when boxed */
		padding: 1.25rem;
		cursor: text;
	}
	/* margin-top:auto pins the text to the bottom, so new lines push the older ones up. */
	.feed {
		margin-top: auto;
		overflow-wrap: anywhere;
	}
	/* pre-wrap only on the lines themselves: on .feed it turns the whitespace between blocks into empty lines. */
	.feed > div {
		white-space: pre-wrap;
	}
	.dim {
		color: var(--tn-comment);
	}
	.err {
		color: var(--tn-red);
	}
	.ok {
		color: var(--tn-green);
	}
	.prompt {
		color: var(--tn-green);
		font-weight: bold;
	}
	.entry {
		display: flex;
		gap: 1ch;
	}
	.caret {
		color: var(--tn-blue);
		user-select: none;
	}
	/* The hidden ::after copy of the text sizes the box, so an empty and a typed line are the same height. */
	.grow {
		display: grid;
		flex: 1;
		min-width: 0;
	}
	.grow::after,
	textarea {
		grid-area: 1 / 1;
		font: inherit;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.grow::after {
		content: attr(data-value) " ";
		visibility: hidden;
	}
	textarea {
		line-height: var(--lh);
		margin: 0;
		min-width: 0;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--tn-fg);
		font: inherit;
		resize: none;
		overflow: hidden;
		caret-color: var(--tn-fg);
		caret-shape: block;
	}
	/* The forms plugin and the global focus style both draw a ring; a terminal has neither. */
	textarea,
	textarea:focus,
	textarea:focus-visible,
	.options:focus,
	.options:focus-visible {
		outline: none;
		box-shadow: none;
		--tw-ring-shadow: 0 0 #0000;
	}
	textarea:focus {
		border: 0;
	}
	.option.active {
		color: var(--tn-blue);
		background: var(--tn-bg-hl);
	}
</style>
