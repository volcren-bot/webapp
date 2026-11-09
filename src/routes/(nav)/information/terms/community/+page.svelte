<script lang="ts">
	import DocumentPage from "#lib/components/DocumentPage.svelte"

	const { data } = $props()
</script>

<DocumentPage
	title="Community scripts addendum"
	description="The terms for sharing community scripts and share codes on this platform."
	intro="Applies on top of the scripter terms to anyone who publishes a script or generates share codes."
	back="/information/terms"
	id="community-terms"
	document={data.document}
/>
