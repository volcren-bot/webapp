<script lang="ts">
	import { goto } from "$app/navigation"
	import Head from "#lib/components/Head.svelte"
	import { NAV_ROUTES, SITE_NAME, SITE_DESCRIPTION, routeHref } from "#lib/utils"

	const { data } = $props()
	const { profile } = $derived(data)

	const header = [
		"██╗   ██╗ ██████╗ ██╗      ██████╗██████╗ ███████╗███╗   ██╗",
		"██║   ██║██╔═══██╗██║     ██╔════╝██╔══██╗██╔════╝████╗  ██║",
		"██║   ██║██║   ██║██║     ██║     ██████╔╝█████╗  ██╔██╗ ██║",
		"╚██╗ ██╔╝██║   ██║██║     ██║     ██╔══██╗██╔══╝  ██║╚██╗██║",
		" ╚████╔╝ ╚██████╔╝███████╗╚██████╗██║  ██║███████╗██║ ╚████║",
		"  ╚═══╝   ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝"
	]
	const logo = [
		"                      .=-",
		"                    .+%@",
		"                   =%#@@",
		"                 .*###@@",
		"                 *####@@",
		"                =#####@@",
		"                ######@@@",
		"               .%#####@@@@",
		"               .######@@@@@",
		"           .    *######@@@@@.",
		"          .*#+-.:%#######@@@@@",
		"           =###%+*########@@@@@",
		"           -###############@@@@@",
		"           *################@@@@@   ..",
		"          +#################@@@@@   :#+:",
		"        .*##################@@@@@@  .##%+.",
		"       -###################@@@@@@@   #####.",
		"     .+###################@@@@@@@   .%#####.",
		"    :###################@@@@@@@@    =######+",
		"   =%################@@@@@@@@@@    :%######%",
		"  +################@@@@@@@@@@    .+%#######%",
		" +##############@@@@@@@@@@@   .-*%#########+",
		"-##############@@@@@@@@@@  :=*%############.",
		"##############@@@@@@@@@  -*##############%-",
		"%#############@@@@@@@@  .-+@############%-",
		"%#############@@@@@@@      @@@##########:",
		"*#############@@@@@@@@.    @@@#######%=",
		":##############@@@@@@@@@@@@@@@######*:",
		" -%#############@@@@@@@@@@@@######*:",
		"  :#################@@@@#######%+:",
		"    =#########################+.",
		"     .-*%#####################=.",
		"        .-+*%##################=",
		"            .:=+*##%####%%#*+-."
	]
	// Outer flame fades from yellow at the tip to red at the base, the inner flame ("@") stays bright
	const logoColors = ["var(--tn-yellow)", "var(--tn-orange)", "var(--tn-red)"]
	const logoColor = (i: number) => logoColors[Math.min(2, Math.floor((i / logo.length) * 3))]
	const logoRuns = (line: string) => line.split(/(@+)/).filter(Boolean)

	// Gradient across the header rows, like the LazyVim dashboard
	const colors = [
		"var(--tn-blue)",
		"var(--tn-blue)",
		"var(--tn-cyan)",
		"var(--tn-cyan)",
		"var(--tn-purple)",
		"var(--tn-purple)"
	]

	const keys: Record<string, string> = {
		Home: "h",
		Scripts: "s",
		Stats: "d",
		Information: "i",
		Tutorials: "t"
	}

	const items = $derived([
		...NAV_ROUTES.map((route) => ({ key: keys[route], label: route, href: routeHref(route) })),
		...(profile ? [{ key: "a", label: "Account", href: "/account" }] : [])
	])

	function onkeydown(e: KeyboardEvent) {
		if (e.ctrlKey || e.metaKey || e.altKey) return
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
		const item = items.find((i) => i.key === e.key)
		if (item) goto(item.href)
	}
</script>

<svelte:window {onkeydown} />

<Head title={SITE_NAME} description={SITE_DESCRIPTION} />

<section class="mx-auto my-12 flex w-full max-w-3xl grow flex-col items-center justify-center gap-8">
	<pre
		class="leading-none select-none"
		style="font-size: clamp(5px, 1.9vw, 14px)"
		aria-hidden="true">{#each logo as line, i (i)}{#each logoRuns(line) as run, j (j)}<span
					style="color: {run[0] === '@' ? 'var(--tn-fg)' : logoColor(i)}">{run}</span
				>{/each}{"\n"}{/each}</pre>

	<pre
		class="leading-tight select-none"
		style="font-size: clamp(5px, 1.9vw, 14px)"
		aria-label={SITE_NAME}>{#each header as line, i (i)}<span style="color: {colors[i]}">{line}</span
			>{"\n"}{/each}</pre>

	<p class="nv-dim">{SITE_DESCRIPTION}</p>

	<nav class="nv-menu w-full max-w-xs" aria-label="Dashboard">
		{#each items as item (item.key)}
			<a href={item.href}>
				<span class="nv-key">{item.key}</span>
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>

	<p class="nv-dim">
		{#if profile}
			welcome back, <span style="color: var(--tn-green)">{profile.username || "friend"}</span>
		{:else}
			open the user panel to log in
		{/if}<span class="nv-cursor"></span>
	</p>
</section>
