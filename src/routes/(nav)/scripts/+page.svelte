<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import ScriptBadges from "#lib/components/ScriptBadges.svelte"
	import Price from "#lib/components/Price.svelte"
	import { enhance } from "$app/forms"
	import Gift from "@lucide/svelte/icons/gift"
	import Plus from "@lucide/svelte/icons/plus"
	import Search from "@lucide/svelte/icons/search"
	import User from "@lucide/svelte/icons/user"
	import Clock from "@lucide/svelte/icons/clock"
	import FileCode from "@lucide/svelte/icons/file-code"
	import { goto } from "$app/navigation"
	import { useKeys } from "#lib/keys.svelte.js"
	import { CATEGORIES, CATEGORY_ICONS, STAGE_COLORS, TYPES } from "#lib/scripts"

	const { data, form } = $props()
	const { profile } = $derived(data)
	// Anyone can write a community script once they accept the terms (the new script page asks for them)
	const canCreate = $derived(profile != null)
	const filters = $derived(data.filters)

	// Row highlighted by j/k or the arrow keys; -1 until one is pressed.
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

	// Moves the highlight, stopping at either end; up with nothing highlighted starts from the bottom.
	function move(by: 1 | -1) {
		const last = data.scripts.length - 1
		if (last < 0) return
		selected = by === 1 ? Math.min(selected + 1, last) : selected < 0 ? last : Math.max(selected - 1, 0)
	}

	useKeys(() => [
		{ keys: ["j", "ArrowDown"], display: "j ↓", label: "Next script", run: () => move(1) },
		{ keys: ["k", "ArrowUp"], display: "k ↑", label: "Previous script", run: () => move(-1) },
		{ keys: ["Enter"], display: "Enter", label: "Open the highlighted script", run: () => open(selected) },
		{ keys: ["s", "/"], display: "s /", label: "Focus the search box", run: () => search?.focus() },
		...(canCreate
			? [{ keys: ["n"], display: "n", label: "Create a new script", run: () => goto("/scripts/new") }]
			: [])
	])
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
				<li class="@container">
					<a
						href="/scripts/{script.url}"
						aria-current={selected === i ? "true" : undefined}
						class="flex flex-col gap-1 rounded-md border bg-(--tn-bg-float) px-4 py-3 text-(--tn-fg) hover:border-(--tn-blue) hover:no-underline {selected ===
						i
							? 'border-(--tn-blue)'
							: 'border-(--tn-bg-hl)'}"
					>
						<div class="flex flex-col gap-2 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-3">
							<span class="flex items-center gap-2 font-bold text-(--tn-blue)">
								<FileCode class="size-4 shrink-0" />
								{script.title}
							</span>
							<span
								class="flex flex-col items-start gap-1 text-sm @2xl:shrink-0 @2xl:flex-row @2xl:items-center @2xl:gap-3"
							>
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
									<Price credits={script.price} />
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
