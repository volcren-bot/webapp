<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"

	const { data } = $props()
</script>

<Head title="Privacy policy" description="How this platform handles your data." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Privacy policy</h1>
	</header>

	{#if data.privacy.error}
		<small class="text-error-400">{data.privacy.error}</small>
	{/if}
	<VersionedDocument id="privacy" title="Privacy policy" versions={data.privacy.versions} />
</section>
