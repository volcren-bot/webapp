<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import { REPO_URL } from "#lib/github"
</script>

<Head title="Security" description="What keeps you safe here, and what doesn't." />

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<a href="/information" class="nv-dim">← information</a>
		<h1 class="text-2xl font-bold">Security</h1>
		<p class="nv-dim">What keeps you safe here, and what doesn't.</p>
	</header>

	<article class="flex flex-col gap-6">
		<div class="flex flex-col gap-2">
			<h2 class="font-bold">Your game accounts</h2>
			<p>
				The only data VOLCREN needs from your accounts to work is their bank pins. That information stays on
				your computer and is locked so that a copy of the file is useless anywhere else. When a script needs
				your bank pin, the VOLCREN client takes over so the script never gets a chance to see the numbers.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="font-bold">What a script can do</h2>
			<p>
				A script can look at the game and click and type in it and that's about it. They run in a sandbox with
				very limited access. It can't open your files, run other programs or reach anything else on your
				computer. It also has very limited internet access, only able to access what's in your client settings
				whitelist. These limits are part of the client itself, so it applies to every script, whoever wrote
				it.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="font-bold">Community scripts</h2>
			<p>
				Scripts shared by the community are not checked by anyone before you run them.
				<a href="#no-software-is-perfect" id="theoretically">Theoretically</a> they can't harm your computer, but
				they do control your game account while they run, so a badly written or ill-meant one could still waste
				your time or your items. Only run community scripts from people you trust.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="font-bold">What we can't protect you from</h2>
			<p>
				Using a script can and eventually will get your game account banned if used enough, and nothing here
				changes that.
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<h2 class="font-bold">Checking for yourself</h2>
			<p id="no-software-is-perfect">
				<a href="#theoretically">No software is free of mistakes either, including ours.</a>
			</p>
			<p>
				All of the <a
					href="https://github.com/orgs/volcren-bot/repositories"
					target="_blank"
					rel="noopener noreferrer">code</a
				>
				is public, so you, or someone you trust, can see what it really does instead of taking our word for it.
				If you find a problem, hellp everyone and please report it as an issue in the respectice repository .
			</p>
		</div>
	</article>
</section>
