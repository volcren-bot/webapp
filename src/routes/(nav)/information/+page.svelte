<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import SubRoutes from "#lib/components/SubRoutes.svelte"
	import { informationPages } from "#lib/information"
</script>

<Head title="Information" description="What this platform is and how it works." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Information</h1>
		<p class="nv-dim">What this platform is and how it works.</p>
	</header>

	<div class="nv-float">
		<span class="nv-title">about</span>

		<p>Volcren is a botting platform made to automate repetitive tasks in video games.</p>
		<p>We are not affiliated with or endorsed by any game developer or publisher.</p>
		<p>Using our products may violate EULAs you've agreed to, which we do not condone.</p>
	</div>

	<SubRoutes items={informationPages} />
</section>
