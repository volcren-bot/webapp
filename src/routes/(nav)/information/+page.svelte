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

	<div class="nv-float flex flex-col gap-2">
		<span class="nv-title">about</span>

		<p>VOLCREN is a botting platform made to automate repetitive tasks in video games.</p>
		<div class="nv-dim flex flex-col gap-2">
			<p>
				We are not affiliated with or endorsed by any game developer or publisher. Using our products may
				violate EULAs you've agreed to, which we do not condone.
			</p>
			<p>
				Everything is provided as is, with no guarantees of any kind. Using our products may get your account
				banned in the games you use them on, and you do so at your own risk.
			</p>
			<p>
				We do not collect any information about our users. Everything is open source, so you can review the <a
					href="https://github.com/volcren-bot"
					target="_blank"
					rel="noopener noreferrer">code</a
				> yourself and verify our claims.
			</p>
		</div>
	</div>

	<div class="nv-float">
		<span class="nv-title">pages</span>
		<SubRoutes items={informationPages} />
	</div>
</section>
