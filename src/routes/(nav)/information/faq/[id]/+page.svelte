<script lang="ts">
	let { data } = $props()
</script>

<article class="nv-float flex flex-col gap-2">
	<span class="nv-title">answer</span>
	<h2 class="font-bold">{data.faq.q}</h2>
	<p>{data.faq.a}</p>
</article>
