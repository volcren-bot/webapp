<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import ScriptWizard from "#lib/components/ScriptWizard.svelte"
	import { fmt } from "#lib/format.svelte.js"

	const { data } = $props()
</script>

<Head title="New script" description="Add a script." noindex />

{#if data.community && data.usage}
	<aside class="nv-float mx-auto mt-8 flex w-full max-w-3xl flex-col gap-1">
		<span class="nv-title">community script</span>
		<p>
			This will be a <b>community script</b>: only you, testers and people you share a code with can see or
			run it, it is always free, and it is not reviewed by staff.
		</p>
		<p class="nv-dim">
			You have used {fmt.number(data.usage.scripts)} of {fmt.number(data.usage.maxScripts)} scripts and
			{fmt.megabytes(data.usage.bytes)} of {fmt.megabytes(data.usage.maxBytes)} MB of storage.
		</p>
	</aside>
{/if}

<ScriptWizard
	data={data.form}
	fresh
	community={data.community}
	authorShare={data.authorShare}
	label="New script"
	heading="VOLCREN script creator"
	confirm="Create this script?"
	progress="Creating script..."
/>
