<script lang="ts">
	import DocumentPage from "#lib/components/DocumentPage.svelte"

	const { data } = $props()
</script>

<DocumentPage
	title="User terms of service"
	description="The terms for using this platform."
	back="/information/terms"
	id="terms"
	document={data.document}
/>
