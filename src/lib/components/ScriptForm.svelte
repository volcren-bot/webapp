<script lang="ts">
	import { untrack } from "svelte"
	import { superForm, type Infer, type SuperValidated } from "sveltekit-superforms"
	import { zod4Client } from "sveltekit-superforms/adapters"
	import { CATEGORIES, CATEGORY_ICONS, MAX_PRICE, STAGES, TYPES, scriptSchema } from "#lib/scripts"
	
	let {
		data,
		action = "",
		submit,
		minStage = "prototype"
	}: {
		data: SuperValidated<Infer<typeof scriptSchema>>
		action?: string
		submit: string
		/** Stages can only move forward, so the stages before the current one are disabled. */
		minStage?: (typeof STAGES)[number]
	} = $props()

	const { form, errors, enhance, delayed } = superForm(
		untrack(() => data),
		{
			multipleSubmits: "prevent",
			clearOnSubmit: "errors",
			taintedMessage: null,
			dataType: "json",
			validators: zod4Client(scriptSchema)
		}
	)

	// Free scripts are always 0, premium ones need a price.
	$effect(() => {
		if ($form.type === "free" && $form.price !== 0) $form.price = 0
		if ($form.type === "premium" && $form.price === 0) $form.price = 1
	})
</script>

<form class="cli nv-float flex w-full flex-col gap-4" method="POST" {action} use:enhance>
	<span class="nv-title">script</span>

	{#each $errors._errors ?? [] as err (err)}
		<div class="cli-err">error: {err}</div>
	{/each}

	<div class="cli-field">
		<label for="f-title" class="cli-q">title</label>
		<div class="cli-line">
			<span class="cli-prompt" aria-hidden="true">❯</span>
			<input
				id="f-title"
				class="cli-input"
				bind:value={$form.title}
				maxlength="80"
				placeholder="Script name"
				autocomplete="off"
				spellcheck="false"
				required
			/>
		</div>
		{#each $errors.title ?? [] as err (err)}<div class="cli-err">error: {err}</div>{/each}
	</div>

	<div class="cli-field">
		<label for="f-description" class="cli-q"
			>description <span class="nv-dim">shown in the script list</span></label
		>
		<div class="cli-line">
			<span class="cli-prompt" aria-hidden="true">❯</span>
			<input
				id="f-description"
				class="cli-input"
				bind:value={$form.description}
				maxlength="200"
				placeholder="One line about what it does"
				autocomplete="off"
				required
			/>
		</div>
		{#each $errors.description ?? [] as err (err)}<div class="cli-err">error: {err}</div>{/each}
	</div>

	<div class="cli-field">
		<label for="f-content" class="cli-q"
			>content <span class="nv-dim">what it does, setup, requirements</span></label
		>
		<div class="cli-line">
			<span class="cli-prompt" aria-hidden="true">❯</span>
			<textarea
				id="f-content"
				class="cli-input min-h-40"
				bind:value={$form.content}
				maxlength="10000"
				placeholder="Write the full description..."
				spellcheck="false"
				required></textarea>
		</div>
		{#each $errors.content ?? [] as err (err)}<div class="cli-err">error: {err}</div>{/each}
	</div>

	<fieldset class="cli-field">
		<legend class="cli-q">type</legend>
		<div class="cli-opts">
			{#each TYPES as type (type)}
				<label class="cli-opt">
					<input type="radio" name="type" value={type} bind:group={$form.type} />
					<span class="cli-mark" aria-hidden="true"></span>{type}
				</label>
			{/each}
		</div>
	</fieldset>

	<div class="cli-field">
		<label for="f-price" class="cli-q">price <span class="nv-dim">credits per minute</span></label>
		<div class="cli-line">
			<span class="cli-prompt" aria-hidden="true">❯</span>
			<input
				id="f-price"
				class="cli-input"
				type="number"
				min="0"
				max={MAX_PRICE}
				step="1"
				disabled={$form.type === "free"}
				bind:value={$form.price}
			/>
		</div>
		{#each $errors.price ?? [] as err (err)}<div class="cli-err">error: {err}</div>{/each}
	</div>

	<fieldset class="cli-field">
		<legend class="cli-q">stage</legend>
		<div class="cli-opts">
			{#each STAGES as stage (stage)}
				<label class="cli-opt">
					<input
						type="radio"
						name="stage"
						value={stage}
						bind:group={$form.stage}
						disabled={STAGES.indexOf(stage) < STAGES.indexOf(minStage)}
					/>
					<span class="cli-mark" aria-hidden="true"></span>{stage}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="cli-field">
		<legend class="cli-q"
			>categories <span class="nv-dim">up to 5, {$form.categories.length} selected</span></legend
		>
		<div class="cli-opts">
			{#each CATEGORIES as category (category)}
				{@const Icon = CATEGORY_ICONS[category]}
				<label class="cli-opt">
					<input type="checkbox" value={category} bind:group={$form.categories} />
					<span class="cli-mark" aria-hidden="true"></span>
					<Icon class="h-4 text-(--tn-purple)" />
					{category}
				</label>
			{/each}
		</div>
		{#each $errors.categories?._errors ?? [] as err (err)}<div class="cli-err">error: {err}</div>{/each}
	</fieldset>

	<div class="cli-submit">
		<span class="cli-dollar" aria-hidden="true">$</span>
		<button type="submit" class="cli-run" disabled={$delayed}>
			{$delayed ? "running..." : submit}{#if !$delayed}<span class="nv-cursor" aria-hidden="true"></span>{/if}
		</button>
	</div>
</form>

<style>
	.cli {
		font-family: inherit;
	}
	.cli-q {
		display: block;
		padding: 0;
		color: var(--tn-green);
		font-weight: bold;
	}
	.cli-q::before {
		content: "? ";
		color: var(--tn-purple);
	}
	.cli-q .nv-dim {
		font-weight: normal;
		margin-left: 1ch;
	}
	.cli-line {
		display: flex;
		gap: 1ch;
		align-items: flex-start;
	}
	.cli-prompt {
		color: var(--tn-blue);
		user-select: none;
	}
	.cli-input {
		flex: 1;
		min-width: 0;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--tn-fg);
		font: inherit;
		caret-color: var(--tn-fg);
		caret-shape: block;
		resize: vertical;
		box-shadow: none;
	}
	.cli-input::placeholder {
		color: var(--tn-comment);
	}
	.cli-input:focus {
		outline: none;
	}
	.cli-input:disabled {
		color: var(--tn-comment);
	}
	.cli-line:focus-within .cli-prompt {
		color: var(--tn-red);
	}
	.cli-err {
		color: var(--tn-red);
	}
	.cli-opts {
		display: flex;
		flex-wrap: wrap;
		gap: 0 2ch;
	}
	.cli-opt {
		display: inline-flex;
		align-items: center;
		gap: 0.75ch;
		cursor: pointer;
	}
	.cli-opt input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.cli-mark::before {
		content: "( )";
		color: var(--tn-comment);
	}
	.cli-opt input[type="radio"]:checked + .cli-mark::before {
		content: "(•)";
		color: var(--tn-green);
	}
	.cli-opt input[type="checkbox"] + .cli-mark::before {
		content: "[ ]";
	}
	.cli-opt input[type="checkbox"]:checked + .cli-mark::before {
		content: "[x]";
		color: var(--tn-green);
	}
	.cli-opt input:focus-visible + .cli-mark {
		outline: 1px solid var(--tn-blue);
		outline-offset: 2px;
	}
	.cli-opt:has(input:disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.cli-submit {
		display: flex;
		gap: 1ch;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px dashed var(--tn-border);
	}
	.cli-dollar {
		color: var(--tn-green);
	}
	.cli-run {
		padding: 0;
		background: transparent;
		border: 0;
		color: var(--tn-fg);
		font: inherit;
		cursor: pointer;
	}
	.cli-run:hover:not(:disabled),
	.cli-run:focus-visible {
		color: var(--tn-blue);
	}
	.cli-run:disabled {
		color: var(--tn-comment);
		cursor: wait;
	}
</style>
