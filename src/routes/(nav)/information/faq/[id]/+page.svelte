<script lang="ts">
	let { data } = $props()
</script>

<article class="flex flex-col gap-2">
	<h2 class="font-bold">{data.faq.q}</h2>
	<p>{data.faq.a}</p>
</article>
