<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import SubRoutes from "#lib/components/SubRoutes.svelte"
	import { termsPages } from "#lib/information"
</script>

<Head title="Terms of service" description="The terms for using and publishing on this platform." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Terms of service</h1>
		<p class="nv-dim">Pick the terms that apply to you.</p>
	</header>

	<div class="nv-float">
		<span class="nv-title">terms</span>
		<SubRoutes items={termsPages} />
	</div>
</section>
