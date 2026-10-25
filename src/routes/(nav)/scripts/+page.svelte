<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import Plus from "@lucide/svelte/icons/plus"
	import Search from "@lucide/svelte/icons/search"
	import Lock from "@lucide/svelte/icons/lock"
	import LockOpen from "@lucide/svelte/icons/lock-open"
	import User from "@lucide/svelte/icons/user"
	import Clock from "@lucide/svelte/icons/clock"
	import FileCode from "@lucide/svelte/icons/file-code"
	import { CATEGORIES, CATEGORY_ICONS, STAGE_COLORS, TYPES, formatPrice } from "#lib/scripts"

	const { data } = $props()
	const { profile } = $derived(data)
	const canCreate = $derived(
		profile != null && ["scripter", "moderator", "administrator"].includes(profile.role)
	)
	const filters = $derived(data.filters)
</script>

<Head title="Scripts" description="Browse and manage available scripts." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Scripts</h1>
			<p class="nv-dim">Browse and manage available scripts.</p>
		</div>
		{#if canCreate}
			<a href="/scripts/new" class="btn flex items-center gap-1 hover:no-underline"
				><Plus class="h-4" /> new script</a
			>
		{/if}
	</header>

	<form method="GET" class="nv-float flex flex-wrap items-end gap-3" role="search">
		<span class="nv-title">filter</span>
		<label class="label grow">
			<span class="label-text">search</span>
			<input
				class="input"
				name="q"
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
			<label class="flex items-center gap-2 pb-1">
				<input type="checkbox" name="mine" value="1" checked={filters.mine} />
				<span>mine</span>
			</label>
		{/if}
		<button type="submit" class="btn flex items-center gap-1"><Search class="h-4" /> search</button>
	</form>

	{#if data.error}
		<small class="text-error-400">{data.error}</small>
	{:else if !data.scripts.length}
		<div class="nv-float">
			<span class="nv-title">scripts</span>
			<p class="nv-dim">No scripts found.</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.scripts as script (script.url)}
				<li>
					<a
						href="/scripts/{script.url}"
						class="flex flex-col gap-1 rounded-md border border-(--tn-bg-hl) bg-(--tn-bg-float) px-4 py-3 text-(--tn-fg) hover:border-(--tn-blue) hover:no-underline"
					>
						<div class="flex items-center justify-between gap-3">
							<span class="flex items-center gap-2 font-bold text-(--tn-blue)">
								<FileCode class="h-4 shrink-0" />
								{script.title}
							</span>
							<span class="flex shrink-0 items-center gap-3 text-sm">
								{#if !script.published || !script.live}
									<span class="text-(--tn-orange)">{script.published ? "no revision" : "draft"}</span>
								{/if}
								<span style="color: {STAGE_COLORS[script.stage]}">{script.stage}</span>
								<span
									class="flex items-center gap-1 {script.type === 'premium'
										? 'text-(--tn-yellow)'
										: 'text-(--tn-green)'}"
								>
									{#if script.type === "premium"}<Lock class="h-4" />{:else}<LockOpen class="h-4" />{/if}
									{formatPrice(script.price)}
								</span>
							</span>
						</div>
						<p class="nv-dim">{script.description}</p>
						<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
							{#each script.categories as category (category)}
								{@const Icon = CATEGORY_ICONS[category]}
								<span class="flex items-center gap-1 text-(--tn-purple)"><Icon class="h-4" /> {category}</span
								>
							{/each}
							<span class="nv-dim ml-auto flex items-center gap-1"><User class="h-4" /> {script.author}</span>
							<span class="nv-dim flex items-center gap-1">
								<Clock class="h-4" />
								{new Date(script.updatedAt).toLocaleDateString()}
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
