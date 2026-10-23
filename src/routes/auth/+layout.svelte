<script lang="ts">
	import Head from "#lib/components/Head.svelte"

	const { children } = $props()
</script>

<Head title="Authentication" description="Log in to your account." noindex />

{@render children()}
