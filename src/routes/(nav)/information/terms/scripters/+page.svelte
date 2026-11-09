<script lang="ts">
	import DocumentPage from "#lib/components/DocumentPage.svelte"

	const { data } = $props()
</script>

<DocumentPage
	title="Scripter terms of service"
	description="The terms for publishing scripts on this platform."
	back="/information/terms"
	id="scripter-terms"
	document={data.document}
/>
