<script lang="ts">
	import Head from "#lib/components/Head.svelte"
	import ScriptWizard from "#lib/components/ScriptWizard.svelte"

	const { data } = $props()
</script>

<Head title="New script" description="Add a script." noindex />

<ScriptWizard
	data={data.form}
	fresh
	label="New script"
	heading="VOLCREN script creator"
	confirm="Create this script?"
	progress="Creating script..."
/>
