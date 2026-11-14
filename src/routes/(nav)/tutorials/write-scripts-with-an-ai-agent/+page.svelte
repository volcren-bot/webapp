<script lang="ts" module>
	export const title = "Write scripts with an AI agent"
	export const description =
		"Let an AI coding agent such as Claude Code or Codex look at your game, run code on it and write scripts for you."
	export const order = 1
</script>

<script lang="ts">
	import TutorialPage from "#lib/components/TutorialPage.svelte"
</script>

<TutorialPage {title} {description}>
	<p>
		The loader comes with an MCP server: a connection that lets an AI coding agent see your game client, read
		the script library's documentation, check scripts for mistakes and run them. The agent never clicks for
		you. It acts by writing small scripts against the library, so it moves the mouse and times its actions
		like a person would.
	</p>

	<h2 class="mt-2 font-bold">Before you start</h2>
	<ul class="flex list-disc flex-col gap-2 pl-6">
		<li><a href="/install">Install the loader</a> and sign in with Discord.</li>
		<li>Open your game client.</li>
		<li>
			Install an AI coding agent that supports MCP servers, such as Claude Code or Codex, and sign in to it.
		</li>
	</ul>

	<h2 class="mt-2 font-bold">Steps</h2>
	<ol class="flex list-decimal flex-col gap-3 pl-6">
		<li>
			Open the loader's <em>terminal</em> tab. It starts in the loader's agent workspace, a folder that already
			connects agents to the loader.
		</li>
		<li>
			Start your agent there, for example with <code>claude</code> or <code>codex</code>. If it asks whether
			to use the <code>volcren</code> server, allow it.
		</li>
		<li>
			Ask it to look around first: "List my game clients and show me my inventory." It loads the agent into
			your client if it needs to.
		</li>
		<li>Give it something small to do: "Walk to the nearest bank and deposit my inventory."</li>
		<li>
			Ask for a whole script: "Write a script that chops oak logs and banks them, check it, and test it on my
			client." It looks up the library functions it needs, fixes what the check reports and shows you what the
			script printed.
		</li>
		<li>Stop the run when you're done, or just close the agent: everything it started stops with it.</li>
	</ol>

	<h2 class="mt-2 font-bold">Good to know</h2>
	<ul class="flex list-disc flex-col gap-2 pl-6">
		<li>
			The agent plays on your real account. It should ask before spending coins, trading or dropping valuable
			items. If you're not sure what it's about to do, say no.
		</li>
		<li>
			One script runs on a client at a time. Stop a script that is running in the loader before the agent uses
			that client.
		</li>
		<li>Runs the agent starts are free. It can't run scripts from the store.</li>
		<li>
			To use the agent from another terminal, register the loader as an MCP server whose command is the
			loader's path followed by <code>mcp</code>.
		</li>
		<li>
			On Windows, checking scripts needs the Microsoft Visual C++ Redistributable. If the check says
			<code>VCRUNTIME140.dll</code> is missing, install it.
		</li>
	</ul>
</TutorialPage>
