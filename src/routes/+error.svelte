<script lang="ts">
	import { page } from "$app/state"
	import Head from "#lib/components/Head.svelte"
</script>

<Head title="Error {page.status}" description={page.error?.message ?? "Something went wrong."} noindex />

{#if page.error}
	<section class="nv-float nv-danger mx-auto my-24 flex w-full max-w-3xl flex-col gap-3">
		<span class="nv-title">error {page.status}</span>
		<p class="text-error-400">✗ {page.error.message}</p>
		<p><a href="/">press enter to return home</a></p>
	</section>
{/if}
