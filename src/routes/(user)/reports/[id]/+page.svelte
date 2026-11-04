<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import UUID from "#lib/components/UUID.svelte"
	import { enhance } from "$app/forms"
	import { attachmentText, REPORT_STATUSES, STATUS_COLORS, STATUS_LABELS } from "#lib/feedback"

	const { data, form } = $props()
	const report = $derived(data.report)
	const failed = $derived(
		form?.message &&
			!form.message.endsWith("saved.") &&
			!form.message.endsWith("assigned.") &&
			!form.message.endsWith("removed.")
	)
</script>

<Head title="Bug report: {report.scriptTitle}" description="A bug report sent from the loader." noindex />

<section class="mx-auto my-8 flex w-full max-w-5xl flex-col gap-6">
	<header class="flex flex-col gap-1">
		<a href="/reports" class="nv-dim self-start">← reports</a>
		<h1 class="text-2xl font-bold">
			{#if report.scriptUrl}<a href="/scripts/{report.scriptUrl}">{report.scriptTitle}</a
				>{:else}{report.scriptTitle}{/if}
			<span class="nv-dim text-base font-normal">revision #{report.revision}</span>
		</h1>
		<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
			<span style="color: {STATUS_COLORS[report.status]}">{STATUS_LABELS[report.status]}</span>
			<span>by <b>{report.username}</b></span>
			<span class="nv-dim">{fmt.dateTime(report.created_at)}</span>
			{#if report.assignee}<span class="nv-dim"
					>assigned to <b class="text-(--tn-fg)">{report.assignee}</b></span
				>{/if}
			<UUID uuid={report.id} />
		</div>
	</header>

	<div class="nv-float flex flex-col gap-2">
		<span class="nv-title">description</span>
		<p class="whitespace-pre-wrap">{report.description || "No description."}</p>
	</div>

	{#if data.canManage || data.canDelete}
		<div class="nv-float flex flex-wrap items-end gap-4">
			<span class="nv-title">manage</span>
			{#if data.canManage}
				<form method="POST" action="?/status" class="flex items-end gap-2" use:enhance>
					<label class="label">
						<span class="label-text">status</span>
						<select class="input" name="status">
							{#each REPORT_STATUSES as status (status)}
								<option value={status} selected={status === report.status}>{STATUS_LABELS[status]}</option>
							{/each}
						</select>
					</label>
					<button type="submit" class="btn">save</button>
				</form>
			{/if}
			{#if data.canAssign}
				<form method="POST" action="?/assign" class="flex items-end gap-2" use:enhance>
					<label class="label">
						<span class="label-text">assigned tester</span>
						<select class="input" name="user">
							<option value="" selected={!report.assigned_to}>nobody</option>
							{#each data.testers as tester (tester.id)}
								<option value={tester.id} selected={tester.id === report.assigned_to}
									>{tester.username} ({tester.role})</option
								>
							{/each}
						</select>
					</label>
					<button type="submit" class="btn">assign</button>
				</form>
			{/if}
			{#if data.canDelete}
				<form
					method="POST"
					action="?/delete"
					class="ml-auto"
					use:enhance={({ cancel }) => {
						if (!confirm("Delete this report and its attachments?")) cancel()
					}}
				>
					<button type="submit" class="btn btn-danger">delete</button>
				</form>
			{/if}
			{#if form?.message}
				<small class="w-full {failed ? 'text-error-400' : 'text-success-400'}">{form.message}</small>
			{/if}
		</div>
	{/if}

	<div class="nv-float flex flex-col gap-2">
		<span class="nv-title">diagnostics</span>
		{#if report.diagnostics && typeof report.diagnostics === "object" && !Array.isArray(report.diagnostics)}
			<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
				{#each Object.entries(report.diagnostics) as [key, value] (key)}
					<dt class="nv-dim">{key}</dt>
					<dd class="break-all">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
				{/each}
			</dl>
		{:else}
			<p class="nv-dim">None.</p>
		{/if}
	</div>

	<div class="nv-float flex flex-col gap-2">
		<span class="nv-title">game state</span>
		{#if report.snapshot}
			<pre class="max-h-[30rem] overflow-auto rounded-md bg-(--tn-bg-dark) px-3 py-2 text-sm"><code
					>{attachmentText(report.snapshot)}</code
				></pre>
		{:else}
			<p class="nv-dim">None.</p>
		{/if}
	</div>

	<div class="nv-float flex flex-col gap-2">
		<span class="nv-title">script log</span>
		{#if report.log}
			<pre class="max-h-[40rem] overflow-auto rounded-md bg-(--tn-bg-dark) px-3 py-2 text-sm"><code
					>{report.log}</code
				></pre>
		{:else}
			<p class="nv-dim">None.</p>
		{/if}
	</div>
</section>
