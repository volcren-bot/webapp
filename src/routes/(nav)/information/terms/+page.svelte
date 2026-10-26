<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"

	const { data } = $props()
</script>

<Head title="Terms of service" description="The terms for using this platform." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Terms of service</h1>
	</header>

	{#each [data.user.error, data.scripter.error] as err}
		{#if err}<small class="text-error-400">{err}</small>{/if}
	{/each}
	<VersionedDocument id="terms" title="Terms of service" versions={data.user.versions} />
	<VersionedDocument id="scripter-terms" title="Scripter terms of service" versions={data.scripter.versions} />
</section>
