<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument, { type DocumentVersion } from "#lib/components/VersionedDocument.svelte"

	// Placeholder data until versions are loaded from the database.
	const versions: DocumentVersion[] = [
		{ version: "v2", publishedAt: "2026-10-01", content: "Terms of service, version 2." },
		{ version: "v1", publishedAt: "2026-01-01", content: "Terms of service, version 1." }
	]
</script>

<Head title="Terms of service" description="The terms for using this platform." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Terms of service</h1>
	</header>

	<VersionedDocument id="terms" title="Terms of service" {versions} />
</section>
