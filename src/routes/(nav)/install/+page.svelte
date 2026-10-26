<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import { SITE_NAME } from "#lib/utils"

	let { data } = $props()

	const { os, release } = $derived(data)
	const download = $derived(release?.[os] ?? null)

	const linuxCommands = $derived(
		download
			? [
					"mkdir -p ~/volcren && cd ~/volcren",
					`curl -fSL -O ${download.url}`,
					`echo "${download.sha256}  ${download.name}" | sha256sum -c`,
					`tar -xzf ${download.name}`,
					"./volcren/loader"
				].join("\n")
			: ""
	)
</script>

<Head
	title="Install"
	description="Download the {SITE_NAME} loader for Windows or Linux and get it running."
	keywords="download, install, loader, windows, linux"
/>

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Install</h1>
		<p class="nv-dim">
			The loader signs you in, lists your scripts and runs them on your game client.
			{#if release}Latest version: <code>{release.version}</code>.{/if}
		</p>
	</header>

	<nav class="nv-bufferline" aria-label="Operating system">
		<a
			href="?os=windows"
			class="nv-tab"
			class:active={os === "windows"}
			aria-current={os === "windows" ? "page" : undefined}>Windows</a
		>
		<a
			href="?os=linux"
			class="nv-tab"
			class:active={os === "linux"}
			aria-current={os === "linux" ? "page" : undefined}>Linux</a
		>
	</nav>

	{#if !release || !download}
		<div class="nv-float flex flex-col gap-2">
			<span class="nv-title">no download</span>
			<p>
				{#if !release}
					There is no published release to download yet, or it can't be reached right now. Try again in a
					minute.
				{:else}
					This release has no {os === "windows" ? "Windows" : "Linux"} build.
				{/if}
			</p>
		</div>
	{:else if os === "windows"}
		<div class="nv-float flex flex-col gap-3">
			<span class="nv-title">windows</span>
			<ol class="flex list-decimal flex-col gap-3 pl-6">
				<li>
					<a href={download.url} class="btn" download>Download {download.name}</a>
				</li>
				<li>
					Extract the whole zip into a folder of your choice. Keep <code>loader.exe</code>,
					<code>injector.exe</code> and <code>agent.dll</code> together, since the loader looks for the other two
					next to itself.
				</li>
				<li>
					Run <code>loader.exe</code>. Windows may warn that the app is unrecognized because the loader isn't
					code-signed yet: choose <em>More info</em>, then <em>Run anyway</em>.
				</li>
				<li>
					Sign in with Discord when the loader asks, start your game client, and pick a script from the Store
					tab.
				</li>
			</ol>
			<small class="nv-dim">
				To check the download, its SHA-256 is <code class="break-all">{download.sha256}</code> (in PowerShell:
				<code>Get-FileHash {download.name}</code>).
			</small>
		</div>
	{:else}
		<div class="nv-float flex flex-col gap-3">
			<span class="nv-title">linux</span>
			<p>
				The game client runs under Wine, for example inside Bolt's prefix (<code
					>~/.local/share/bolt-launcher/</code
				>), so Wine has to be installed. Paste this into a terminal:
			</p>
			<pre class="overflow-x-auto bg-(--tn-bg-dark) p-3 text-sm"><code>{linuxCommands}</code></pre>
			<ul class="flex list-disc flex-col gap-2 pl-6">
				<li>
					The archive holds <code>loader</code>, <code>injector</code>, <code>injector.exe</code> and
					<code>agent.dll</code>. Keep them together; the loader finds the others next to itself.
				</li>
				<li>
					To update, run the same commands again. The loader tells you when a newer version exists but doesn't
					replace itself.
				</li>
				<li>
					Sign-in keeps its token in your system keyring, so a keyring service such as gnome-keyring or
					KWallet has to be running.
				</li>
			</ul>
		</div>
	{/if}

	<small class="nv-dim">
		Need help? Have a look at the <a href="/information/faq">FAQ</a> or the
		<a href="/tutorials">tutorials</a>.
	</small>
</section>
