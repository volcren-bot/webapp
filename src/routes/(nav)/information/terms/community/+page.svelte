<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import VersionedDocument from "#lib/components/VersionedDocument.svelte"

	const { data } = $props()
</script>

<Head
	title="Community scripts addendum"
	description="The terms for sharing community scripts and share codes on this platform."
/>

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information/terms" class="nv-dim">← terms</a>
		<h1 class="text-2xl font-bold">Community scripts addendum</h1>
		<p class="nv-dim">
			Applies on top of the scripter terms to anyone who publishes a script or generates share codes.
		</p>
	</header>

	{#if data.community.error}
		<small class="text-error-400">{data.community.error}</small>
	{/if}
	<VersionedDocument
		id="community-terms"
		title="Community scripts addendum"
		versions={data.community.versions}
	/>
</section>
