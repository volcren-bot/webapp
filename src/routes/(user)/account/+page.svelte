<script lang="ts">
	import { profileSchema } from "#lib/schemas"
	import { zod4Client } from "sveltekit-superforms/adapters"
	import Head from "#lib/components/Head.svelte"
	import { superForm } from "sveltekit-superforms"
	import UUID from "#lib/components/UUID.svelte"
	import { untrack } from "svelte"
	import { formatCredits } from "#lib/utils"

	const { data, form } = $props()
	const profile = $derived(data.profile!)

	const {
		form: authForm,
		errors,
		enhance
	} = superForm(
		untrack(() => data.form),
		{
			multipleSubmits: "prevent",
			clearOnSubmit: "errors",
			taintedMessage: null,
			dataType: "json",
			validators: zod4Client(profileSchema)
		}
	)
</script>

<Head title="Account" description="Manage your account." noindex />

<main class="mx-auto my-6 flex w-full max-w-3xl flex-col">
	<header class="my-8 flex flex-col">
		<h1 class="text-2xl font-bold">Account: {profile.username || "No username"}</h1>
		<UUID uuid={profile.id}></UUID>
	</header>

	<form class="nv-float flex w-full flex-col" method="POST" use:enhance>
		<span class="nv-title">credentials</span>
		<p class="nv-dim">Your email is permanent. Your password is only used for API access.</p>

		{#if $errors._errors}
			{#each $errors._errors as err (err)}
				<small class="flex text-error-400">{err}</small>
			{/each}
		{/if}

		{#if form?.password}
			<small class="text-success-400">Your password has been updated.</small>
		{/if}

		<label class="label my-3">
			<span class="label-text">email</span>
			<input class="input" value={$authForm.email ?? ""} disabled />
		</label>
		<label class="label my-3">
			<span class="label-text">password</span>
			<input class="input" class:border-error-500={$errors.password} bind:value={$authForm.password} />
			{#if $errors.password}
				{#each $errors.password as err (err)}
					<small class="text-error-400">{err}</small>
				{/each}
			{/if}
		</label>

		<button type="submit" class="btn my-2 mr-auto"> update </button>
	</form>

	<section class="nv-float mt-6 flex w-full flex-col">
		<span class="nv-title">balance</span>
		<p class="my-2 text-lg font-bold">{formatCredits(data.credits)}</p>
		<a class="btn my-2 mr-auto" href="/credits">add funds</a>

		<span class="nv-title mt-4">history</span>
		{#if data.ledger.length}
			<ul class="my-3 flex flex-col gap-1">
				{#each data.ledger as entry (entry.id)}
					<li class="flex justify-between gap-4">
						<span>
							{new Date(entry.created_at).toLocaleString()} · {entry.kind}
							{#if entry.note}<span class="nv-dim">({entry.note})</span>{/if}
						</span>
						<span class={entry.amount < 0 ? "text-error-400" : "text-success-400"}>
							{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString("en-US")}
							<span class="nv-dim">→ {entry.balance_after.toLocaleString("en-US")}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="nv-dim">No transactions yet.</p>
		{/if}
	</section>
</main>
