<script lang="ts">
	import { enhance } from "$app/forms"
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"
	import Check from "@lucide/svelte/icons/check"

	const { data, form } = $props()
	const allAccepted = $derived(data.documents.every((d) => d.accepted))
	const missing = $derived(data.documents.some((d) => !d.current))
</script>

<Head
	title="Creator terms"
	description="Accept the terms for publishing scripts and generating share codes."
	noindex
/>

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Terms for creators</h1>
		<p class="nv-dim">
			You need to accept the current version of both documents before you can create scripts, upload revisions
			or generate share codes. Your existing scripts keep running meanwhile. When either document changes
			you'll be asked again.
		</p>
	</header>

	{#if data.error}<small class="text-error-400">{data.error}</small>{/if}

	{#each data.documents as doc (doc.kind)}
		<div class="flex flex-col gap-2">
			{#if doc.current}
				<p class="flex items-center gap-2">
					<b>{doc.label}</b>
					<span class="nv-dim">{doc.current.version} · {doc.current.publishedAt}</span>
					{#if doc.accepted}<span class="flex items-center gap-1 text-success-400"
							><Check class="size-4 shrink-0" /> accepted</span
						>{/if}
				</p>
				<VersionedDocument id={doc.kind} title={doc.label} versions={[doc.current]} />
			{:else}
				<p class="nv-dim"><b>{doc.label}</b>: not published yet.</p>
			{/if}
		</div>
	{/each}

	{#if allAccepted}
		<div class="nv-float flex flex-col items-start gap-3">
			<span class="nv-title">accepted</span>
			<p>You have accepted the current terms.</p>
			<a class="btn" href={data.next}>continue</a>
		</div>
	{:else if missing}
		<p class="nv-dim">The terms aren't fully published yet, so nobody can accept them. Check back later.</p>
	{:else}
		<form
			class="nv-float flex flex-col gap-3"
			method="POST"
			action="?/accept&next={encodeURIComponent(data.next)}"
			use:enhance
		>
			<span class="nv-title">accept</span>
			{#each data.documents as doc (doc.kind)}
				<input type="hidden" name={doc.kind} value={doc.current?.number} />
			{/each}
			{#if form?.message}<small class="text-error-400">{form.message}</small>{/if}
			<label class="flex cursor-pointer items-center gap-2">
				<input type="checkbox" name="agree" required />
				<span>I have read and accept the documents above.</span>
			</label>
			<button type="submit" class="btn self-start">accept</button>
		</form>
	{/if}
</section>
