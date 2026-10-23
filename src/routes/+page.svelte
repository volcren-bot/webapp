<script lang="ts">
	import { onMount } from "svelte"
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
	const logoWidth = Math.max(...logo.map((line) => line.length))
	// Deterministic pseudo-random value in [-1, 1) so the render is stable across SSR and hydration
	const jitter = (i: number, j: number, frame: number) => {
		const x = Math.sin(i * 12.9898 + j * 78.233 + frame * 37.719) * 43758.5453
		return (x - Math.floor(x)) * 2 - 1
	}
	// Color bands bleed into each other: the position is skewed so red creeps up the left side,
	// and noise dithers the boundaries instead of leaving straight lines
	const logoColor = (i: number, j: number, frame: number) => {
		// The skew slowly breathes so the red creeps up and recedes
		const breath = 1 + Math.sin(frame * 0.12) * 0.35
		const skew = (0.5 - j / logoWidth) * 0.25 * breath
		const t = (i + 0.5) / logo.length + skew + jitter(i, j, frame) * 0.07
		return logoColors[Math.max(0, Math.min(2, Math.floor(t * 3)))]
	}
	// The inner flame warms to light yellow along its left and bottom edges, stronger further down
	const innerColor = (i: number, j: number, frame: number) => {
		let d = 0
		while (logo[i][j - d - 1] === "@") d++
		if (logo[i + 1]?.[j] !== "@") d = 0
		const edge = Math.max(0, 1 - d / 4)
		const amount = ((i + 0.5) / logo.length - 0.25) * 1.6 * edge + jitter(j, i, frame) * 0.15
		const pct = Math.round(Math.max(0, Math.min(0.9, amount)) * 5) * 20
		return pct ? `color-mix(in srgb, var(--tn-yellow) ${pct}%, var(--tn-fg))` : "var(--tn-fg)"
	}
	const logoRuns = (line: string, i: number, frame: number) => {
		const runs: { text: string; color: string }[] = []
		for (let j = 0; j < line.length; j++) {
			const color = line[j] === "@" ? innerColor(i, j, frame) : logoColor(i, j, frame)
			const last = runs[runs.length - 1]
			if (last?.color === color) last.text += line[j]
			else runs.push({ text: line[j], color })
		}
		return runs
	}

	// Re-roll the bleed a few times a second, unless the user prefers reduced motion
	let frame = $state(0)
	onMount(() => {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
		const timer = setInterval(() => frame++, 300)
		return () => clearInterval(timer)
	})

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
		style="font-size: clamp(3px, 0.7vw, 12px)"
		aria-hidden="true">{#each logo as line, i (i)}{#each logoRuns(line, i, frame) as run, j (j)}<span
					style="color: {run.color}">{run.text}</span
				>{/each}{"\n"}{/each}</pre>

	<pre
		class="leading-tight select-none"
		style="font-size: clamp(3px, 0.7vw, 12px)"
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
