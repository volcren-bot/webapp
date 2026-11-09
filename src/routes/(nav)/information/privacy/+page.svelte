<script lang="ts">
	import DocumentPage from "#lib/components/DocumentPage.svelte"

	const { data } = $props()
</script>

<DocumentPage
	title="Privacy policy"
	description="How this platform handles your data."
	back="/information"
	id="privacy"
	document={data.document}
/>
