<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument, { type DocumentVersion } from "#lib/components/VersionedDocument.svelte"

	// Placeholder data until versions are loaded from the database.
	const versions: DocumentVersion[] = [
		{ version: "v2", publishedAt: "2026-10-01", content: "Privacy policy, version 2." },
		{ version: "v1", publishedAt: "2026-01-01", content: "Privacy policy, version 1." }
	]
</script>

<Head title="Privacy policy" description="How this platform handles your data." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Privacy policy</h1>
	</header>

	<VersionedDocument id="privacy" title="Privacy policy" {versions} />
</section>
