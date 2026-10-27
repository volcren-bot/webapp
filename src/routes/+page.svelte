<script lang="ts">
	import { onMount } from "svelte"
	import Head from "#lib/components/Head.svelte"
	import { SITE_NAME, SITE_DESCRIPTION } from "#lib/utils"
	import { cheatSheet } from "#lib/shortcuts.svelte.js"

	const { data } = $props()
	const { profile } = $derived(data)

	const nl = "\n"

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
	const jitter = (i: number, j: number) => {
		const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
		return (x - Math.floor(x)) * 2 - 1
	}
	// Color bands bleed into each other: the position is skewed so red creeps up the left side,
	// and each character's bias (-1 = toward yellow, 1 = toward red) dithers the boundaries
	const logoColor = (i: number, j: number, bias: number) => {
		const skew = (0.5 - j / logoWidth) * 0.25
		const t = (i + 0.5) / logo.length + skew + bias * 0.07
		return logoColors[Math.max(0, Math.min(2, Math.floor(t * 3)))]
	}
	// The inner flame warms to light yellow along its left and bottom edges, stronger further down
	const innerEdge = logo.map((line, i) =>
		[...line].map((_, j) => {
			let d = 0
			while (logo[i][j - d - 1] === "@") d++
			if (logo[i + 1]?.[j] !== "@") d = 0
			return Math.max(0, 1 - d / 4)
		})
	)
	const innerColor = (i: number, j: number, bias: number) => {
		const amount = ((i + 0.5) / logo.length - 0.25) * 1.6 * innerEdge[i][j] + bias * 0.3
		const pct = Math.round(Math.max(0, Math.min(0.9, amount)) * 5) * 20
		return pct ? `color-mix(in srgb, var(--tn-yellow) ${pct}%, var(--tn-fg))` : "var(--tn-fg)"
	}
	const charColor = (i: number, j: number, bias: number) =>
		logo[i][j] === "@" ? innerColor(i, j, bias) : logoColor(i, j, bias)

	// Only characters whose color can actually change are worth toggling
	const outerCells: [number, number][] = []
	const innerCells: [number, number][] = []
	logo.forEach((line, i) => {
		for (let j = 0; j < line.length; j++) {
			if (line[j] === " ") continue
			if (charColor(i, j, -1) === charColor(i, j, 1)) continue
			;(line[j] === "@" ? innerCells : outerCells).push([i, j])
		}
	})

	let bias = $state(logo.map((line, i) => [...line].map((_, j) => jitter(i, j))))

	const logoRuns = (line: string, i: number) => {
		const runs: { text: string; color: string }[] = []
		for (let j = 0; j < line.length; j++) {
			const color = charColor(i, j, bias[i][j])
			const last = runs[runs.length - 1]
			if (last?.color === color) last.text += line[j]
			else runs.push({ text: line[j], color })
		}
		return runs
	}

	// Each tick flips a single character toward red and another toward yellow, plus a few inner
	// flame characters, so the bleed shimmers gently instead of re-rolling all at once
	const pick = (cells: [number, number][]) => cells[Math.floor(Math.random() * cells.length)]
	// Writing the same color back would still re-render the whole row, so skip those
	const setBias = ([i, j]: [number, number], value: number) => {
		if (charColor(i, j, bias[i][j]) !== charColor(i, j, value)) bias[i][j] = value
	}
	onMount(() => {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
		const timer = setInterval(() => {
			setBias(pick(outerCells), 1)
			setBias(pick(outerCells), -1)
			for (let n = 0; n < 3; n++) setBias(pick(innerCells), Math.random() < 0.5 ? -1 : 1)
		}, 30)
		return () => clearInterval(timer)
	})
</script>

<Head title={SITE_NAME} description={SITE_DESCRIPTION} />

<section class="mx-auto my-4 flex h-fit w-full max-w-3xl grow flex-col items-center justify-center gap-3">
	<div class="flex flex-col items-center gap-2 text-[0.4375rem] md:text-[0.5rem] xl:text-[0.5625rem]">
		<pre
			class="text-[0.85em] leading-none"
			aria-hidden="true">{#each logo as line, i (i)}{#each logoRuns(line, i) as run, j (j)}<span
						style="color: {run.color}">{run.text}</span
					>{/each}{nl}{/each}
			</pre>
		<!-- prettier-ignore -->
		<pre class="leading-tight" style="font-size: max(calc(1em - 1pt), 0.85em)" aria-label={SITE_NAME}>
<span style="color: var(--tn-blue)">██╗   ██╗ ██████╗ ██╗      ██████╗██████╗ ███████╗███╗   ██╗</span>
<span style="color: var(--tn-blue)">██║   ██║██╔═══██╗██║     ██╔════╝██╔══██╗██╔════╝████╗  ██║</span>
<span style="color: var(--tn-cyan)">██║   ██║██║   ██║██║     ██║     ██████╔╝█████╗  ██╔██╗ ██║</span>
<span style="color: var(--tn-cyan)">╚██╗ ██╔╝██║   ██║██║     ██║     ██╔══██╗██╔══╝  ██║╚██╗██║</span>
<span style="color: var(--tn-purple)"> ╚████╔╝ ╚██████╔╝███████╗╚██████╗██║  ██║███████╗██║ ╚████║</span>
<span style="color: var(--tn-purple)">  ╚═══╝   ╚═════╝ ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝</span>
		</pre>
	</div>

	<p class="nv-dim text-center">{SITE_DESCRIPTION}</p>

	<p class="nv-dim">
		{#if profile}
			welcome back, <span style="color: var(--tn-green)">{profile.username || "friend"}</span>
		{:else}
			open the user panel to log in
		{/if}<span class="nv-cursor"></span>
	</p>

	<div class="my-6 flex flex-col items-center gap-2">
		<p class="nv-dim max-w-md text-center">This is a keyboard centric website.</p>
		<p class="nv-dim max-w-md text-center">
			You can navigate with your mouse, but almost everything has a shortcut.
		</p>

		<button
			type="button"
			onclick={() => (cheatSheet.open = true)}
			class="flex cursor-pointer items-center gap-2 rounded border border-(--tn-blue) p-2 px-[1.5ch] hover:bg-(--tn-bg-hl) hover:text-(--tn-blue)"
		>
			<span class="nv-key">K</span>
			<span>Cheat sheet</span>
		</button>
	</div>
</section>
