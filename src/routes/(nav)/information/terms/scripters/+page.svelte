<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"

	const { data } = $props()
</script>

<Head title="Scripter terms of service" description="The terms for publishing scripts on this platform." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information/terms" class="nv-dim">← terms</a>
		<h1 class="text-2xl font-bold">Scripter terms of service</h1>
	</header>

	{#if data.scripter.error}
		<small class="text-error-400">{data.scripter.error}</small>
	{/if}
	<VersionedDocument
		id="scripter-terms"
		title="Scripter terms of service"
		versions={data.scripter.versions}
	/>
</section>
