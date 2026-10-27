<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import ScriptWizard from "#lib/components/ScriptWizard.svelte"
	import { megabytes } from "#lib/scripts"

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
			You have used {data.usage.scripts} of {data.usage.maxScripts} scripts and {megabytes(data.usage.bytes)} of
			{megabytes(data.usage.maxBytes)} MB of storage.
		</p>
	</aside>
{/if}

<ScriptWizard
	data={data.form}
	fresh
	community={data.community}
	label="New script"
	heading="VOLCREN script creator"
	confirm="Create this script?"
	progress="Creating script..."
/>
