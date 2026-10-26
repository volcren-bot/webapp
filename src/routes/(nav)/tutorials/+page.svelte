<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import { DOCS_URL, newTutorialUrl } from "#lib/github"
	import { tutorials } from "#lib/tutorials"
</script>

<Head title="Tutorials" description="Step-by-step guides to get started." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold">Tutorials</h1>
			<p class="nv-dim">Step-by-step guides to get started.</p>
		</div>
		<a href={DOCS_URL} target="_blank" rel="noopener noreferrer" class="btn">Documentation</a>
	</header>

	<div class="nv-float flex flex-col gap-3">
		<span class="nv-title">guides</span>
		{#if tutorials.length === 0}
			<p class="nv-dim">No tutorials yet.</p>
		{:else}
			<ul class="flex flex-col gap-3">
				{#each tutorials as tutorial (tutorial.id)}
					<li class="flex flex-col">
						<a href="/tutorials/{tutorial.id}" class="font-bold">{tutorial.title}</a>
						<span class="nv-dim">{tutorial.description}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<small class="nv-dim">
		Missing a tutorial?
		<a href={newTutorialUrl()} target="_blank" rel="noopener noreferrer">Add one on GitHub</a>.
	</small>
</section>
