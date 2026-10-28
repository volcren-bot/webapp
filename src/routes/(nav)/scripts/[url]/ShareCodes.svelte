<script lang="ts">
	import { enhance } from "$app/forms"
	import { page } from "$app/state"
	import { fmt } from "#lib/format.svelte.js"
	import Copy from "@lucide/svelte/icons/copy"
	import Check from "@lucide/svelte/icons/check"
	import Ticket from "@lucide/svelte/icons/ticket"

	type Result = {
		code?: string
		codeExpires?: string
		codeError?: string
		codeMessage?: string
		grantError?: string
		grantMessage?: string
	} | null

	let {
		codes,
		grantees,
		result,
		accepted
	}: {
		codes: { id: string; created_at: string; expires_at: string }[]
		grantees: { userId: string; username: string; grantedAt: string }[]
		result: Result | undefined
		accepted: boolean
	} = $props()

	// The days a code stays valid; the database caps it at 30
	const EXPIRIES = [1, 3, 7, 14, 30]

	let copied = $state(false)

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text)
			copied = true
			setTimeout(() => (copied = false), 2000)
		} catch {
			// Clipboard access can be refused; the code is selectable on click as well
		}
	}
</script>

<div class="nv-float flex flex-col gap-3">
	<span class="nv-title">share codes</span>
	<p class="nv-dim">
		Give someone private access to this script. Each code works once, for one person, and expires on its own.
		Whoever redeems it can run the script even when it is hidden or archived, and premium scripts are free for
		them. A script can have 20 open codes at a time.
	</p>

	{#if !accepted}
		<p class="text-(--tn-orange)">
			Accept the current <a href="/account/terms?next={encodeURIComponent(page.url.pathname)}"
				>creator terms</a
			> to generate share codes.
		</p>
	{:else}
		{#if result?.code}
			<div class="flex flex-col gap-1">
				<p class="text-success-400">
					Code created, valid until {fmt.dateTime(result.codeExpires ?? "")}. Copy it now, it won't be shown
					again:
				</p>
				<div class="flex flex-wrap items-center gap-2">
					<code class="break-all select-all">{result.code}</code>
					<button type="button" class="btn" onclick={() => copy(result.code ?? "")}>
						{#if copied}<Check class="size-4 shrink-0" /> copied{:else}<Copy class="size-4 shrink-0" /> copy{/if}
					</button>
				</div>
			</div>
		{/if}

		<form method="POST" action="?/createCode" class="flex flex-wrap items-end gap-2" use:enhance>
			<label class="label">
				<span class="label-text">expires after</span>
				<select class="input" name="days">
					{#each EXPIRIES as days (days)}
						<option value={days} selected={days === 7}>{days} day{days === 1 ? "" : "s"}</option>
					{/each}
				</select>
			</label>
			<button type="submit" class="btn"><Ticket class="size-4 shrink-0" /> generate code</button>
		</form>
	{/if}

	{#if result?.codeError}<small class="text-error-400">{result.codeError}</small>{/if}
	{#if result?.codeMessage}<small class="text-success-400">{result.codeMessage}</small>{/if}

	{#if codes.length}
		<p class="nv-dim">Open codes (the codes themselves can't be shown again):</p>
		<ul class="flex flex-col gap-1 text-sm">
			{#each codes as code (code.id)}
				<li class="flex flex-wrap items-center gap-x-3">
					<span class="nv-dim">created {fmt.date(code.created_at)}</span>
					<span>expires {fmt.dateTime(code.expires_at)}</span>
					<form
						method="POST"
						action="?/revokeCode"
						class="ml-auto"
						use:enhance={({ cancel }) => {
							if (!confirm("Revoke this code? Whoever has it can no longer use it.")) cancel()
						}}
					>
						<input type="hidden" name="id" value={code.id} />
						<button type="submit" class="btn btn-danger">revoke</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Not a direct child of .nv-float, which would pin this title to the window border over "share codes" -->
	<div class="mt-2 flex flex-col gap-3">
		<span class="nv-title self-start">people with access</span>
		{#if grantees.length}
			<ul class="flex flex-col gap-1 text-sm">
				{#each grantees as grantee (grantee.userId)}
					<li class="flex flex-wrap items-center gap-x-3">
						<span class="font-bold">{grantee.username}</span>
						<span class="nv-dim">since {fmt.date(grantee.grantedAt)}</span>
						<form
							method="POST"
							action="?/revokeGrant"
							class="ml-auto"
							use:enhance={({ cancel }) => {
								if (!confirm(`Take ${grantee.username}'s access away? Their code stays used.`)) cancel()
							}}
						>
							<input type="hidden" name="user" value={grantee.userId} />
							<button type="submit" class="btn btn-danger">remove access</button>
						</form>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="nv-dim">Nobody has redeemed a code for this script yet.</p>
		{/if}
		{#if result?.grantError}<small class="text-error-400">{result.grantError}</small>{/if}
		{#if result?.grantMessage}<small class="text-success-400">{result.grantMessage}</small>{/if}
	</div>
</div>
