<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import { REPORT_STATUSES, STATUS_COLORS, STATUS_LABELS } from "#lib/feedback"
	import { page } from "$app/state"
	import { SvelteURLSearchParams } from "svelte/reactivity"

	const { data } = $props()

	// Filters are query parameters, so they work without JavaScript and can be linked
	const statusHref = (status: string | null) => {
		const params = new SvelteURLSearchParams(page.url.search)
		if (status) params.set("status", status)
		else params.delete("status")
		const query = params.toString()
		return query ? `?${query}` : page.url.pathname
	}
</script>

<Head title="Bug reports" description="Bug reports on scripts, sent from the loader." noindex />

<section class="mx-auto my-8 flex w-full max-w-5xl flex-col gap-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-bold">Bug reports</h1>
		<p class="nv-dim">
			Reports users sent from the loader: yours, those on your scripts and those assigned to you.
			{#if data.filter.script}
				Showing <b class="text-(--tn-fg)">{data.scriptTitle ?? "one script"}</b> only,
				<a href={statusHref(data.filter.status).replace(/[?&]script=[^&]*/, "") || "/reports"}>show all</a>.
			{/if}
		</p>
	</header>

	<nav class="flex flex-wrap gap-2 text-sm" aria-label="Status filter">
		<a href={statusHref(null)} class="nv-pill" class:font-bold={!data.filter.status}>all</a>
		{#each REPORT_STATUSES as status (status)}
			<a
				href={statusHref(status)}
				class="nv-pill"
				class:font-bold={data.filter.status === status}
				style="color: {STATUS_COLORS[status]}">{STATUS_LABELS[status]}</a
			>
		{/each}
	</nav>

	{#if data.reports.length}
		<ul class="flex flex-col gap-2">
			{#each data.reports as report (report.id)}
				<li class="nv-float mt-0 flex flex-col gap-1 py-3 text-sm">
					<div class="flex flex-wrap items-baseline gap-x-3">
						<a href="/reports/{report.id}" class="font-bold">{report.script_title}</a>
						<span class="nv-dim">#{report.revision}</span>
						<span style="color: {STATUS_COLORS[report.status]}">{STATUS_LABELS[report.status]}</span>
						<span class="nv-dim">by {report.username}</span>
						{#if report.assignee}<span class="nv-dim">→ {report.assignee}</span>{/if}
						<span class="nv-dim ml-auto">{fmt.dateTime(report.created_at)}</span>
					</div>
					<p class="truncate">
						{report.description || "No description."}
					</p>
					<p class="nv-dim">
						{[
							report.has_log && "log",
							report.has_snapshot && "snapshot",
							report.has_diagnostics && "diagnostics"
						]
							.filter(Boolean)
							.join(", ") || "no attachments"}
					</p>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="nv-dim">No reports{data.filter.status ? ` ${STATUS_LABELS[data.filter.status]}` : ""}.</p>
	{/if}
</section>
