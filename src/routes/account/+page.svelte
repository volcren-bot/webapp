<script lang="ts">
	import { profileSchema } from "#lib/schemas"
	import { zod4Client } from "sveltekit-superforms/adapters"
	import Head from "#lib/components/Head.svelte"
	import { superForm } from "sveltekit-superforms"
	import UUID from "#lib/components/UUID.svelte"
	import { untrack } from "svelte"

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
		<p class="nv-dim">Change your email or password.</p>

		{#if $errors._errors}
			{#each $errors._errors as err (err)}
				<small class="flex text-error-400">{err}</small>
			{/each}
		{/if}

		{#if form?.email}
			<small class="text-success-400">
				You've received a link on both emails. Open them both to confirm the change.
			</small>
		{/if}
		{#if form?.password}
			<small class="text-success-400">Your password has been updated.</small>
		{/if}

		<label class="label my-3">
			<span class="label-text">email</span>
			<input class="input" class:border-error-500={$errors.email} bind:value={$authForm.email} />
			{#if $errors.email}
				{#each $errors.email as err (err)}
					<small class="text-error-400">{err}</small>
				{/each}
			{/if}
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
</main>
