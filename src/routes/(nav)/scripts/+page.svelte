<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import ScriptBadges from "#lib/components/ScriptBadges.svelte"
	import { enhance } from "$app/forms"
	import Gift from "@lucide/svelte/icons/gift"
	import Plus from "@lucide/svelte/icons/plus"
	import Search from "@lucide/svelte/icons/search"
	import Lock from "@lucide/svelte/icons/lock"
	import LockOpen from "@lucide/svelte/icons/lock-open"
	import User from "@lucide/svelte/icons/user"
	import Clock from "@lucide/svelte/icons/clock"
	import FileCode from "@lucide/svelte/icons/file-code"
	import { goto } from "$app/navigation"
	import { listKey, useShortcuts } from "#lib/shortcuts.svelte.js"
	import { CATEGORIES, CATEGORY_ICONS, STAGE_COLORS, TYPES } from "#lib/scripts"

	const { data, form } = $props()
	const { profile } = $derived(data)
	// Anyone can write a community script once they accept the terms (the new script page asks for them)
	const canCreate = $derived(profile != null)
	const filters = $derived(data.filters)

	// Row highlighted by the arrow keys; -1 until one is pressed.
	let selected = $state(-1)
	let list = $state<HTMLElement>()
	let search = $state<HTMLInputElement>()

	$effect(() => {
		void data.scripts
		selected = -1
	})

	$effect(() => {
		if (selected >= 0) list?.children[selected]?.scrollIntoView({ block: "nearest" })
	})

	const open = (i: number) => {
		const script = data.scripts[i]
		if (script) goto(`/scripts/${script.url}`)
	}

	useShortcuts(() => {
		const keys = data.scripts.flatMap((_, i) => listKey(i) ?? [])
		return [
			{
				display: "↑ ↓",
				label: "Previous / next script",
				scope: "This page",
				keys: ["ArrowUp", "ArrowDown"],
				run: (e) => {
					const last = data.scripts.length - 1
					if (last < 0) return
					selected =
						e.key === "ArrowDown"
							? Math.min(selected + 1, last)
							: selected < 0
								? last
								: Math.max(selected - 1, 0)
				}
			},
			{
				display: "Enter",
				label: "Open the highlighted script",
				scope: "This page",
				keys: ["Enter"],
				run: () => open(selected)
			},
			{
				display: keys.length ? `${keys[0]}–${keys[keys.length - 1]}` : "0–9",
				label: "Open that script",
				scope: "This page",
				keys,
				run: (e) => open(data.scripts.findIndex((_, i) => listKey(i) === e.key))
			},
			{
				display: "/",
				label: "Focus the search box",
				scope: "This page",
				keys: ["/"],
				run: () => search?.focus()
			},
			...(canCreate
				? [
						{
							display: "n",
							label: "Create a new script",
							scope: "This page",
							keys: ["n"],
							run: () => goto("/scripts/new")
						}
					]
				: [])
		]
	})
</script>

<Head title="Scripts" description="Browse and manage available scripts." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Scripts</h1>
			<p class="nv-dim">Browse and manage available scripts.</p>
		</div>
		{#if canCreate}
			<a href="/scripts/new" class="btn"><Plus class="size-4 shrink-0" /> new script</a>
		{/if}
	</header>

	<form method="GET" class="nv-float flex flex-wrap items-end gap-3" role="search">
		<span class="nv-title">filter</span>
		<label class="label grow">
			<span class="label-text">search</span>
			<input
				class="input"
				name="q"
				bind:this={search}
				type="search"
				value={filters.q ?? ""}
				placeholder="title or description"
			/>
		</label>
		<label class="label">
			<span class="label-text">category</span>
			<select class="input" name="category">
				<option value="">any</option>
				{#each CATEGORIES as category (category)}
					<option value={category} selected={filters.category === category}>{category}</option>
				{/each}
			</select>
		</label>
		<label class="label">
			<span class="label-text">type</span>
			<select class="input" name="type">
				<option value="">any</option>
				{#each TYPES as type (type)}
					<option value={type} selected={filters.type === type}>{type}</option>
				{/each}
			</select>
		</label>
		{#if profile}
			<label class="flex h-[2.25em] cursor-pointer items-center gap-2">
				<input type="checkbox" name="mine" value="1" checked={filters.mine} />
				<span>mine</span>
			</label>
		{/if}
		{#if data.canBrowseCommunity}
			<label
				class="flex h-[2.25em] cursor-pointer items-center gap-2"
				title="Community scripts are left out of the list unless they are yours or shared with you"
			>
				<input type="checkbox" name="community" value="1" checked={filters.community} />
				<span>community</span>
			</label>
		{/if}
		<button type="submit" class="btn"><Search class="size-4 shrink-0" /> search</button>
	</form>

	{#if profile}
		<form method="POST" action="?/redeem" class="nv-float flex flex-wrap items-end gap-3" use:enhance>
			<span class="nv-title">redeem a share code</span>
			<label class="label grow">
				<span class="label-text">code</span>
				<input
					class="input font-mono"
					name="code"
					required
					minlength="64"
					maxlength="128"
					autocomplete="off"
					spellcheck="false"
					placeholder="paste the code you were given"
				/>
			</label>
			<button type="submit" class="btn"><Gift class="size-4 shrink-0" /> redeem</button>
			{#if form?.redeemError}<small class="w-full text-error-400">{form.redeemError}</small>{/if}
		</form>
	{/if}

	{#if data.error}
		<small class="text-error-400">{data.error}</small>
	{:else if !data.scripts.length}
		<div class="nv-float">
			<span class="nv-title">scripts</span>
			<p class="nv-dim">No scripts found.</p>
		</div>
	{:else}
		<ul bind:this={list} class="flex flex-col gap-3">
			{#each data.scripts as script, i (script.url)}
				<li>
					<a
						href="/scripts/{script.url}"
						aria-current={selected === i ? "true" : undefined}
						class="flex flex-col gap-1 rounded-md border bg-(--tn-bg-float) px-4 py-3 text-(--tn-fg) hover:border-(--tn-blue) hover:no-underline {selected ===
						i
							? 'border-(--tn-blue)'
							: 'border-(--tn-bg-hl)'}"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="flex items-center gap-2 font-bold text-(--tn-blue)">
								{#if listKey(i)}<span class="nv-key">{listKey(i)}</span>{/if}
								<FileCode class="size-4 shrink-0" />
								{script.title}
							</span>
							<span class="flex shrink-0 items-center gap-3 text-sm">
								<ScriptBadges
									community={script.community}
									granted={script.granted}
									authorBanned={script.authorBanned}
								/>
								{#if !script.community && (!script.published || !script.live)}
									<span class="text-(--tn-orange)">{script.published ? "no revision" : "draft"}</span>
								{/if}
								<span style="color: {STAGE_COLORS[script.stage]}">{script.stage}</span>
								<span
									class="flex items-center gap-1 {script.type === 'premium'
										? 'text-(--tn-yellow)'
										: 'text-(--tn-green)'}"
								>
									{#if script.type === "premium"}<Lock class="size-4 shrink-0" />{:else}<LockOpen
											class="size-4 shrink-0"
										/>{/if}
									{fmt.price(script.price)}
								</span>
							</span>
						</div>
						<p class="nv-dim">{script.description}</p>
						<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
							{#each script.categories as category (category)}
								{@const Icon = CATEGORY_ICONS[category]}
								<span class="flex items-center gap-1 text-(--tn-purple)"
									><Icon class="size-4 shrink-0" /> {category}</span
								>
							{/each}
							<span class="nv-dim ml-auto flex items-center gap-1"
								><User class="size-4 shrink-0" /> {script.author}</span
							>
							<span class="nv-dim flex items-center gap-1">
								<Clock class="size-4 shrink-0" />
								{fmt.date(script.updatedAt)}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
