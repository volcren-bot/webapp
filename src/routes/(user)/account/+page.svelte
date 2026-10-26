<script lang="ts">
	import { fmt } from "#lib/format.svelte.js"
	import { profileSchema } from "#lib/schemas"
	import { zod4Client } from "sveltekit-superforms/adapters"
	import Head from "#lib/components/Head.svelte"
	import { superForm } from "sveltekit-superforms"
	import { enhance as formEnhance } from "$app/forms"
	import UUID from "#lib/components/UUID.svelte"
	import { untrack } from "svelte"
	import { creditSource } from "#lib/utils"

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

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header class="flex flex-col items-start gap-2">
		<h1 class="text-2xl font-bold">Account: {profile.username || "No username"}</h1>
		<UUID uuid={profile.id}></UUID>
	</header>

	<form class="nv-float flex flex-col gap-3" method="POST" action="?/update" use:enhance>
		<span class="nv-title">credentials</span>
		<p class="nv-dim">your email is permanent. your password is only used for API access.</p>

		{#if $errors._errors}
			{#each $errors._errors as err (err)}
				<small class="text-error-400">{err}</small>
			{/each}
		{/if}

		{#if form && "password" in form && form.password}
			<small class="text-success-400">your password has been updated.</small>
		{/if}

		<label class="label">
			<span class="label-text">email</span>
			<input class="input" value={$authForm.email ?? ""} disabled />
		</label>
		<label class="label">
			<span class="label-text">password</span>
			<input class="input" class:border-error-500={$errors.password} bind:value={$authForm.password} />
			{#if $errors.password}
				{#each $errors.password as err (err)}
					<small class="text-error-400">{err}</small>
				{/each}
			{/if}
		</label>

		<button type="submit" class="btn mt-1 self-start">update</button>
	</form>

	<section class="nv-float flex flex-col items-start gap-3">
		<span class="nv-title">balance</span>
		<p class="text-lg font-bold">{fmt.credits(data.credits)}</p>
		<a class="btn" href="/credits">add funds</a>
	</section>

	<section class="nv-float">
		<span class="nv-title">history</span>
		{#if data.ledger.length}
			<ul class="flex flex-col gap-1">
				{#each data.ledger as entry (entry.id)}
					<li class="flex justify-between gap-4">
						<span>
							<span class="nv-dim">{fmt.dateTime(entry.created_at)} ·</span>
							{creditSource(entry)}
							{#if entry.bonus}
								<span class="nv-dim">(incl. {fmt.credits(entry.bonus)} bonus)</span>
							{/if}
							{#if entry.note}<span class="nv-dim">({entry.note})</span>{/if}
						</span>
						<span
							class="shrink-0 text-right whitespace-nowrap {entry.amount < 0
								? 'text-error-400'
								: 'text-success-400'}"
						>
							{entry.amount > 0 ? "+" : ""}{fmt.number(entry.amount)}
							<span class="nv-dim">→ {fmt.number(entry.balance_after)}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="nv-dim">No transactions yet.</p>
		{/if}
	</section>

	<form class="nv-float nv-danger flex flex-col gap-3" method="POST" action="?/delete" use:formEnhance>
		<span class="nv-title">delete account</span>
		<p>
			this permanently deletes your profile, discord link and stats, and signs you out.
			<strong>
				your {fmt.credits(data.credits)} are lost.
			</strong>
			payment and usage records are kept, linked only to your account id (see the
			<a href="/information/privacy">privacy policy</a>).
		</p>

		{#if data.blockers.length}
			<ul class="flex flex-col gap-1">
				{#each data.blockers as blocker (blocker)}
					<li class="text-error-400">✗ {blocker}</li>
				{/each}
			</ul>
		{:else}
			{#if form && "deleteMessage" in form}
				<small class="text-error-400">{form.deleteMessage}</small>
			{/if}

			<label class="label">
				<span class="label-text">type <strong>{profile.username}</strong> to confirm</span>
				<input class="input" name="confirm" autocomplete="off" required />
			</label>

			<button type="submit" class="btn mt-1 self-start">delete my account</button>
		{/if}
	</form>
</section>
