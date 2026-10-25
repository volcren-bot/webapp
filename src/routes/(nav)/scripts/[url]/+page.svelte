<script lang="ts">
	import { enhance } from "$app/forms"
	import Head from "#lib/components/Head.svelte"
	import ScriptForm from "#lib/components/ScriptForm.svelte"
	import RevisionUpload from "./RevisionUpload.svelte"
	import Lock from "@lucide/svelte/icons/lock"
	import LockOpen from "@lucide/svelte/icons/lock-open"
	import User from "@lucide/svelte/icons/user"
	import Clock from "@lucide/svelte/icons/clock"
	import Eye from "@lucide/svelte/icons/eye"
	import EyeOff from "@lucide/svelte/icons/eye-off"
	import FileCode from "@lucide/svelte/icons/file-code"
	import { CATEGORY_ICONS, STAGE_COLORS, formatPrice } from "#lib/scripts"
	import { metaDescription } from "#lib/utils"
	import { page } from "$app/state"

	const { data, form: result } = $props()
	const script = $derived(data.script)
	const statusColor = { live: "var(--tn-green)", pending: "var(--tn-yellow)", discarded: "var(--tn-comment)" }
</script>

<Head title={script.title} description={metaDescription(script.description)} noindex={!script.published} />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex flex-col gap-1">
		<a href="/scripts" class="nv-dim">← scripts</a>
		<h1 class="text-2xl font-bold">{script.title}</h1>
		<p class="nv-dim">{script.description}</p>
		<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
			<span style="color: {STAGE_COLORS[script.stage]}">{script.stage}</span>
			<span
				class="flex items-center gap-1 {script.type === 'premium'
					? 'text-(--tn-yellow)'
					: 'text-(--tn-green)'}"
			>
				{#if script.type === "premium"}<Lock class="h-4" />{:else}<LockOpen class="h-4" />{/if}
				{formatPrice(script.price)}
			</span>
			{#each script.categories as category (category)}
				{@const Icon = CATEGORY_ICONS[category]}
				<span class="flex items-center gap-1 text-(--tn-purple)"><Icon class="h-4" /> {category}</span>
			{/each}
			<span class="nv-dim flex items-center gap-1"><User class="h-4" /> {script.author}</span>
			<span class="nv-dim flex items-center gap-1">
				<Clock class="h-4" /> updated {new Date(script.updatedAt).toLocaleDateString()}
			</span>
			<span class="nv-dim flex items-center gap-1">
				<FileCode class="h-4" />
				{script.revision ? `revision ${script.revision}` : "no revision yet"}
			</span>
		</div>
	</header>

	<div class="nv-float">
		<span class="nv-title">about</span>
		<p class="whitespace-pre-wrap">{script.content}</p>
	</div>

	{#if data.canEdit && data.form}
		<form
			method="POST"
			action="?/publish"
			class="nv-float flex flex-wrap items-center justify-between gap-3"
			use:enhance={() =>
				async ({ update }) =>
					update({ reset: false })}
		>
			<span class="nv-title">visibility</span>
			<p class="flex items-center gap-2">
				{#if script.published}<Eye class="h-4" /> Public{:else}<EyeOff class="h-4" /> Hidden{/if}
				<span class="nv-dim">
					{script.published
						? "Everyone allowed by its stage can see it."
						: "Only you and moderators can see it."}
				</span>
			</p>
			<input type="hidden" name="published" value={String(!script.published)} />
			<button type="submit" class="btn">{script.published ? "hide" : "publish"}</button>
			{#if page.form?.message && !page.form?.form}
				<small
					class="w-full {result?.message?.includes("can't") || result?.message?.includes('Could not')
						? 'text-error-400'
						: 'text-success-400'}">{result?.message}</small
				>
			{/if}
		</form>

		<div class="nv-float">
			<span class="nv-title">revisions</span>
			<p class="nv-dim mb-3">Uploading creates a new revision and makes it live once every file is stored.</p>
			<RevisionUpload id={script.id} />

			{#if data.versions.length}
				<ul class="mt-4 flex flex-col gap-1 text-sm">
					{#each data.versions as version (version.revision)}
						<li class="flex flex-wrap items-baseline gap-x-3">
							<span class="font-bold">#{version.revision}</span>
							<span style="color: {statusColor[version.status]}">{version.status}</span>
							<span class="nv-dim">{version.files.length} file{version.files.length === 1 ? "" : "s"}</span>
							<span class="nv-dim">{version.files.join(", ")}</span>
							<span class="nv-dim ml-auto">{new Date(version.created_at).toLocaleString()}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<ScriptForm data={data.form} action="?/update" submit="save changes" minStage={script.stage} />
	{/if}

	{#if data.canDelete}
		<form
			method="POST"
			action="?/delete"
			class="nv-float flex flex-wrap items-center gap-3"
			use:enhance={({ cancel }) => {
				if (!confirm(`Permanently delete ${page.params.url} and all of its data?`)) cancel()
				return async ({ update }) => update({ reset: false })
			}}
		>
			<span class="nv-title text-error-400">delete</span>
			<p class="nv-dim w-full">
				Permanently removes the script, every revision file and its stats. This can't be undone. Type
				<b>{page.params.url}</b> to confirm.
			</p>
			<input name="confirm" class="input" autocomplete="off" placeholder={page.params.url} />
			<button type="submit" class="btn text-error-400">delete script</button>
			{#if page.form?.message && !page.form?.form && page.form.message.includes("delete")}
				<small class="w-full text-error-400">{page.form.message}</small>
			{/if}
		</form>
	{/if}
</section>
