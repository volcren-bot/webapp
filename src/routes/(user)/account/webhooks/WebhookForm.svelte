<script lang="ts">
	import { enhance } from "$app/forms"
	import Plus from "@lucide/svelte/icons/plus"
	import X from "@lucide/svelte/icons/x"
	import type { Database } from "#lib/types/supabase"

	type Endpoint = Pick<
		Database["webhooks"]["Tables"]["endpoints"]["Row"],
		"id" | "name" | "url" | "format" | "events" | "has_bearer" | "header_names" | "enabled"
	>

	const { endpoint = null, error = null }: { endpoint?: Endpoint | null; error?: string | null } = $props()

	const FORMATS = [
		{ value: "volcren", label: "VOLCREN JSON" },
		{ value: "github_dispatch", label: "GitHub repository_dispatch" },
		{ value: "text", label: 'Text: {"text": ...}' },
		{ value: "discord", label: "Discord" }
	]

	const savedHeaders = () => endpoint?.header_names ?? []
	let headers = $state(savedHeaders().map((name) => ({ name, existing: true, key: crypto.randomUUID() })))
</script>

<form
	method="POST"
	action="?/save"
	class="flex flex-col gap-3"
	use:enhance={() =>
		({ update }) =>
			update({ reset: !endpoint })}
>
	{#if endpoint}<input type="hidden" name="id" value={endpoint.id} />{/if}
	<div class="grid gap-3 sm:grid-cols-[1fr_2fr]">
		<label class="flex flex-col gap-1">
			<span class="nv-dim text-sm">name</span>
			<input
				class="input"
				name="name"
				maxlength="64"
				required
				value={endpoint?.name ?? ""}
				autocomplete="off"
			/>
		</label>
		<label class="flex flex-col gap-1">
			<span class="nv-dim text-sm">url</span>
			<input
				class="input"
				name="url"
				type="url"
				maxlength="2048"
				placeholder="https://"
				required
				value={endpoint?.url ?? ""}
				autocomplete="off"
			/>
		</label>
	</div>

	<div class="flex flex-wrap items-end gap-x-6 gap-y-3">
		<label class="flex flex-col gap-1">
			<span class="nv-dim text-sm">format</span>
			<select class="input" name="format">
				{#each FORMATS as format (format.value)}
					<option value={format.value} selected={(endpoint?.format ?? "volcren") === format.value}
						>{format.label}</option
					>
				{/each}
			</select>
		</label>
		<fieldset class="flex flex-wrap gap-x-4 gap-y-1">
			<legend class="nv-dim mb-1 text-sm">events</legend>
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					name="events"
					value="client_release"
					checked={!endpoint || endpoint.events.includes("client_release")}
				/>
				client releases
			</label>
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					name="events"
					value="script_check"
					checked={!endpoint || endpoint.events.includes("script_check")}
				/>
				checks of my live scripts
			</label>
		</fieldset>
		<label class="flex items-center gap-2">
			<input type="checkbox" name="enabled" checked={endpoint?.enabled ?? true} />
			on
		</label>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<label class="flex grow flex-col gap-1">
			<span class="nv-dim text-sm">bearer token (optional)</span>
			<input
				class="input"
				name="bearer"
				type="password"
				maxlength="4096"
				placeholder={endpoint?.has_bearer ? "set, leave empty to keep it" : "none"}
				autocomplete="off"
			/>
		</label>
		{#if endpoint?.has_bearer}
			<label class="flex items-center gap-2 self-end">
				<input type="checkbox" name="clear_bearer" />
				remove the token
			</label>
		{/if}
	</div>

	<div class="flex flex-col gap-2">
		<span class="nv-dim text-sm">custom headers (optional, at most 8)</span>
		{#each headers as header, i (header.key)}
			<div class="flex items-center gap-2">
				<input
					class="input w-1/3"
					name="header_name"
					maxlength="64"
					placeholder="name"
					bind:value={header.name}
					autocomplete="off"
				/>
				<input
					class="input grow"
					name="header_value"
					type="password"
					maxlength="1024"
					placeholder={header.existing ? "set, leave empty to keep it" : "value"}
					autocomplete="off"
				/>
				<button
					type="button"
					class="btn"
					aria-label="Remove header"
					onclick={() => (headers = headers.filter((_, j) => j !== i))}><X class="size-4" /></button
				>
			</div>
		{/each}
		{#if headers.length < 8}
			<button
				type="button"
				class="btn self-start"
				onclick={() => headers.push({ name: "", existing: false, key: crypto.randomUUID() })}
				><Plus class="size-4" /> add header</button
			>
		{/if}
	</div>

	{#if error}<small class="text-error-400">{error}</small>{/if}
	<button type="submit" class="btn self-start">{endpoint ? "save" : "add webhook"}</button>
</form>
