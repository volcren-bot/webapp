<script lang="ts">
	import { enhance } from "$app/forms"
	import { fmt } from "#lib/format.svelte.js"
	import Head from "#lib/components/Head.svelte"
	import WebhookForm from "./WebhookForm.svelte"

	const { data, form } = $props()

	const EVENT_LABELS: Record<string, string> = {
		client_release: "client release",
		script_check: "script check",
		ping: "test"
	}
	const STATUS_COLORS: Record<string, string> = {
		delivered: "var(--tn-green)",
		pending: "var(--tn-yellow)",
		failed: "var(--tn-red)"
	}

	const deliveriesOf = (id: string) => data.deliveries.filter((d) => d.endpoint_id === id).slice(0, 10)
	const saveError = (id: string | null) =>
		form && "saveError" in form && form.saveId === id ? form.saveError : null

	const verifySnippet = `expected = "sha256=" + hex(hmac_sha256(secret, timestamp + "." + body))`
</script>

<Head
	title="Webhooks"
	description="Get notified when the client updates or your scripts are re-checked."
	noindex
/>

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex flex-col gap-2">
		<h1 class="text-2xl font-bold">Webhooks</h1>
		<p class="nv-dim">
			We POST to your URL when a new client release is published, so your CI can test against the new SDK, and
			when one of your live scripts has been checked against it. Each delivery is retried for about 9 hours on
			timeouts, rate limits and server errors; 15 failed attempts in a row turn the webhook off.
		</p>
	</header>

	{#if !data.allowed}
		<p class="nv-dim">
			Webhooks are for contributors and scripters. Publish a script to become a contributor.
		</p>
	{:else}
		{#if data.error}<small class="text-error-400">{data.error}</small>{/if}
		{#if form && "actionError" in form && form.actionError}<small class="text-error-400"
				>{form.actionError}</small
			>{/if}
		{#if form && "actionMessage" in form && form.actionMessage}<small class="text-success-400"
				>{form.actionMessage}</small
			>{/if}

		{#each data.endpoints as endpoint (endpoint.id)}
			<div class="nv-float flex flex-col gap-3">
				<span class="nv-title">{endpoint.name}</span>
				<p class="flex flex-wrap items-center gap-x-3 text-sm">
					{#if endpoint.enabled}
						<span class="text-success-400">on</span>
					{:else}
						<span class="text-error-400"
							>off{endpoint.disabled_reason ? `: ${endpoint.disabled_reason}` : ""}</span
						>
					{/if}
					{#if endpoint.failures}<span class="nv-dim">{endpoint.failures} failed attempts in a row</span>{/if}
					<span class="nv-dim">added {fmt.date(endpoint.created_at)}</span>
				</p>

				{#key endpoint.updated_at}
					<WebhookForm {endpoint} error={saveError(endpoint.id)} />
				{/key}

				<details>
					<summary class="cursor-pointer">signing secret</summary>
					<div class="mt-2 flex flex-col gap-2">
						<code class="break-all select-all">{endpoint.signing_secret}</code>
						<p class="nv-dim text-sm">
							Every delivery carries <code>X-Volcren-Timestamp</code> and <code>X-Volcren-Signature</code>.
							Check it against the raw body and reject old timestamps:
						</p>
						<pre class="overflow-x-auto rounded-md bg-(--tn-bg-dark) px-3 py-2 text-sm"><code
								>{verifySnippet}</code
							></pre>
					</div>
				</details>

				<div class="flex flex-wrap gap-2">
					<form method="POST" action="?/test" use:enhance>
						<input type="hidden" name="id" value={endpoint.id} />
						<button type="submit" class="btn">send test</button>
					</form>
					<form
						method="POST"
						action="?/rotate"
						use:enhance={({ cancel }) => {
							if (!confirm(`Rotate the signing secret of ${endpoint.name}? The old one stops matching.`))
								cancel()
						}}
					>
						<input type="hidden" name="id" value={endpoint.id} />
						<button type="submit" class="btn">rotate secret</button>
					</form>
					<form
						method="POST"
						action="?/delete"
						class="ml-auto"
						use:enhance={({ cancel }) => {
							if (!confirm(`Delete ${endpoint.name}?`)) cancel()
						}}
					>
						<input type="hidden" name="id" value={endpoint.id} />
						<button type="submit" class="btn btn-danger">delete</button>
					</form>
				</div>

				{#if deliveriesOf(endpoint.id).length}
					<ul class="flex flex-col gap-1 text-sm">
						{#each deliveriesOf(endpoint.id) as delivery (delivery.id)}
							<li class="flex flex-wrap items-center gap-x-3">
								<span style:color={STATUS_COLORS[delivery.status]}>{delivery.status}</span>
								<span>{EVENT_LABELS[delivery.event]}</span>
								<span class="nv-dim">{fmt.dateTime(delivery.created_at)}</span>
								{#if delivery.response_status}<span class="nv-dim">HTTP {delivery.response_status}</span>{/if}
								{#if delivery.attempts > 1}<span class="nv-dim">{delivery.attempts} attempts</span>{/if}
								{#if delivery.error && delivery.status !== "delivered"}<span class="nv-dim"
										>{delivery.error}</span
									>{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/each}

		{#if data.endpoints.length < 5}
			<div class="nv-float flex flex-col gap-3">
				<span class="nv-title">new webhook</span>
				{#key data.endpoints.length}<WebhookForm error={saveError(null)} />{/key}
			</div>
		{/if}

		<div class="nv-float flex flex-col gap-2 text-sm">
			<span class="nv-title">formats</span>
			<p>
				<b>VOLCREN JSON</b>: <code>{"{ id, event, created_at, data }"}</code>. A release's <code>data</code>
				has its
				<code>version</code>, <code>build</code> and <code>latest_url</code>, the manifest naming the SDK zip
				and its sha256; a check's has the script, revision, whether it <code>passed</code>, the release it
				runs on and the first 10 problems.
			</p>
			<p>
				<b>GitHub repository_dispatch</b>: the same JSON as <code>client_payload</code> with
				<code>event_type</code> <code>volcren.client_release</code> or <code>volcren.script_check</code>. Use
				<code>https://api.github.com/repos/OWNER/REPO/dispatches</code> as the URL, a fine-grained token with
				contents write access as the bearer token, and trigger a workflow with
				<code>on: repository_dispatch</code>.
			</p>
			<p>
				<b>Text</b>: <code>{'{ "text": "VOLCREN client 2026.11.25-abc1234 is out." }'}</code>, for Slack-style
				and Claude routine endpoints. <b>Discord</b>: the same sentence as a Discord webhook message.
			</p>
		</div>
	{/if}
</section>
