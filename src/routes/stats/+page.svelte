<script lang="ts">
	import Head from "#lib/components/Head.svelte"
</script>

<Head title="Stats" description="Usage and performance numbers." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Stats</h1>
		<p class="nv-dim">Usage and performance numbers.</p>
	</header>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		{#each ["users", "scripts", "runs"] as label (label)}
			<div class="nv-float">
				<span class="nv-title">{label}</span>
				<p class="text-2xl font-bold" style="color: var(--tn-green)">—</p>
			</div>
		{/each}
	</div>
</section>
