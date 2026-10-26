<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import { enhance } from "$app/forms"
	import Head from "#lib/components/Head.svelte"
	import UUID from "#lib/components/UUID.svelte"
	import RevisionUpload from "./RevisionUpload.svelte"
	import Lock from "@lucide/svelte/icons/lock"
	import LockOpen from "@lucide/svelte/icons/lock-open"
	import User from "@lucide/svelte/icons/user"
	import Clock from "@lucide/svelte/icons/clock"
	import Eye from "@lucide/svelte/icons/eye"
	import EyeOff from "@lucide/svelte/icons/eye-off"
	import FileCode from "@lucide/svelte/icons/file-code"
	import { CATEGORY_ICONS, STAGE_COLORS, } from "#lib/scripts"
	import { metaDescription } from "#lib/utils"
	import { page } from "$app/state"

	const { data, form: result } = $props()
	const script = $derived(data.script)
	const statusColor = { live: "var(--tn-green)", pending: "var(--tn-yellow)", discarded: "var(--tn-comment)" }

	// The Origin header gets the multipart upload past SvelteKit's CSRF check; the token is the auth
	const deployCommand = $derived(
		`curl --fail-with-body -sS \\
  -H "Authorization: Bearer $VOLCREN_TOKEN" \\
  -H "Origin: ${page.url.origin}" \\
  -F files=@main.luau -F files=@lib.luau \\
  ${page.url.origin}/api/scripts/${script.id}/revisions`
	)
</script>

<Head title={script.title} description={metaDescription(script.description)} noindex={!script.published} />

<section class="mx-auto my-8 flex w-full max-w-5xl flex-col gap-6">
	<a href="/scripts" class="nv-dim">← scripts</a>

	<header class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold">{script.title}</h1>
		<p class="nv-dim">{script.description}</p>
		<div class="mt-1 flex flex-wrap items-center gap-2 text-sm">
			<span class="nv-pill" style="color: {STAGE_COLORS[script.stage]}">{script.stage}</span>
			{#each script.categories as category (category)}
				{@const Icon = CATEGORY_ICONS[category]}
				<span class="nv-pill flex items-center gap-1 text-(--tn-purple)">
					<Icon class="h-4" />
					{category}
				</span>
			{/each}
			{#if !script.published}
				<span class="nv-pill nv-dim flex items-center gap-1"><EyeOff class="h-4" /> hidden</span>
			{/if}
		</div>
	</header>

	<div class="flex flex-col gap-6 md:flex-row">
		<aside class="nv-float w-full shrink-0 md:w-64">
			<span class="nv-title">info</span>
			<dl class="flex flex-col gap-3 text-sm">
				<div>
					<dt class="nv-dim">id</dt>
					<dd><UUID uuid={script.id} /></dd>
				</div>
				<div>
					<dt class="nv-dim">price</dt>
					<dd
						class="flex items-center gap-1 text-lg font-bold {script.type === 'premium'
							? 'text-(--tn-yellow)'
							: 'text-(--tn-green)'}"
					>
						{#if script.type === "premium"}<Lock class="h-4" />{:else}<LockOpen class="h-4" />{/if}
						{fmt.price(script.price)}
					</dd>
				</div>
				<div>
					<dt class="nv-dim flex items-center gap-1"><User class="h-4" /> author</dt>
					<dd>{script.author}</dd>
				</div>
				<div>
					<dt class="nv-dim flex items-center gap-1"><FileCode class="h-4" /> revision</dt>
					<dd>{script.revision ? `#${script.revision}` : "none yet"}</dd>
				</div>
				<div>
					<dt class="nv-dim flex items-center gap-1"><Clock class="h-4" /> updated</dt>
					<dd>{fmt.date(script.updatedAt)}</dd>
				</div>
			</dl>
		</aside>

		<div class="nv-float min-h-96 min-w-0 grow">
			<span class="nv-title">about</span>
			<p class="whitespace-pre-wrap">{script.content}</p>
		</div>
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
							<span class="nv-dim ml-auto">{fmt.dateTime(version.created_at)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div class="nv-float flex flex-col gap-3">
			<span class="nv-title">deploy tokens</span>
			<p class="nv-dim">
				Let CI (e.g. a GitHub Actions secret) upload revisions of this script without logging in. A token only
				works for this script and is shown once.
			</p>

			{#if result?.token}
				<div class="flex flex-col gap-1">
					<p class="text-success-400">
						Token <b>{result.tokenName}</b> created. Copy it now, it won't be shown again:
					</p>
					<code class="break-all select-all">{result.token}</code>
				</div>
			{/if}

			<form method="POST" action="?/createToken" class="flex flex-wrap items-center gap-2" use:enhance>
				<input
					name="name"
					class="input"
					placeholder="github actions"
					maxlength="64"
					required
					autocomplete="off"
				/>
				<button type="submit" class="btn">create token</button>
			</form>
			{#if result?.tokenError}<small class="text-error-400">{result.tokenError}</small>{/if}
			{#if result?.tokenMessage}<small class="text-success-400">{result.tokenMessage}</small>{/if}

			{#if data.tokens.length}
				<ul class="flex flex-col gap-1 text-sm">
					{#each data.tokens as token (token.id)}
						<li class="flex flex-wrap items-center gap-x-3">
							<span class="font-bold">{token.name}</span>
							<span class="nv-dim">created {fmt.date(token.created_at)}</span>
							<span class="nv-dim">
								{token.last_used_at
									? `last used ${fmt.dateTime(token.last_used_at)}`
									: "never used"}
							</span>
							<form
								method="POST"
								action="?/revokeToken"
								class="ml-auto"
								use:enhance={({ cancel }) => {
									if (!confirm(`Revoke ${token.name}? Anything using it stops working.`)) cancel()
								}}
							>
								<input type="hidden" name="id" value={token.id} />
								<button type="submit" class="btn text-error-400">revoke</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<p class="nv-dim">Upload a revision with it (one <code>-F</code> per file):</p>
			<pre class="overflow-x-auto text-xs"><code>{deployCommand}</code></pre>
		</div>

		<!-- Loaded only for editors, so visitors don't download the form and validation code -->
		{#await import("#lib/components/ScriptWizard.svelte") then { default: ScriptWizard }}
			<ScriptWizard
				data={data.form}
				action="?/update"
				boxed
				label="Edit script"
				heading="VOLCREN script editor"
				confirm="Save these changes?"
				progress="Saving changes..."
				minStage={script.stage}
			/>
		{/await}
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
