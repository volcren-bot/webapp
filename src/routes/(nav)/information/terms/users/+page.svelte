<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"

	const { data } = $props()
</script>

<Head title="User terms of service" description="The terms for using this platform." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information/terms" class="nv-dim">← terms</a>
		<h1 class="text-2xl font-bold">User terms of service</h1>
	</header>

	{#if data.user.error}
		<small class="text-error-400">{data.user.error}</small>
	{/if}
	<VersionedDocument id="terms" title="User terms of service" versions={data.user.versions} />
</section>
