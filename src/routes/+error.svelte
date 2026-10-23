<script lang="ts">
	import { page } from "$app/state"
	import Head from "#lib/components/Head.svelte"
</script>

<Head title="Error {page.status}" description={page.error?.message ?? "Something went wrong."} noindex />

{#if page.error}
	<section class="nv-float mx-auto my-24 w-full max-w-2xl" style="border-color: var(--tn-red)">
		<span class="nv-title" style="background: var(--tn-red)">error {page.status}</span>
		<p style="color: var(--tn-red)">✗ {page.error.message}</p>
		<p class="mt-4"><a href="/">press enter to return home</a></p>
	</section>
{/if}
