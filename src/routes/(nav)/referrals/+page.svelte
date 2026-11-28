<script lang="ts">
	import { enhance } from "$app/forms"
	import Head from "#lib/components/Head.svelte"
	import { clipboard } from "#lib/clipboard.svelte.js"
	import { fmt } from "#lib/format.svelte.js"
	import { SITE_NAME } from "#lib/utils"
	import Clipboard from "@lucide/svelte/icons/clipboard"
	import ClipboardCheck from "@lucide/svelte/icons/clipboard-check"

	const { data, form } = $props()
	const rules = $derived(data.rules)
	const mine = $derived(data.mine)
	const clip = clipboard()

	const hours = (minutes: number) => fmt.number(minutes / 60, { maximumFractionDigits: 1 })
	const perInvitee = $derived(
		rules
			? rules.runtimeReward * rules.runtimeScripts + rules.inviteReward * rules.invites + rules.topupReward
			: 0
	)
	const totals = $derived(
		mine
			? {
					rewarding: mine.referrals.filter((r) => r.earned > 0).length,
					earned: mine.referrals.reduce((sum, r) => sum + r.earned, 0)
				}
			: null
	)
</script>

<Head
	title="Referrals"
	description="Invite people to {SITE_NAME} and earn bonus CREDIT as they start using it."
	keywords="referral, invite, bonus, credit"
/>

<section class="mx-auto my-8 flex w-full max-w-3xl flex-col gap-6">
	<header>
		<h1 class="text-2xl font-bold">Referrals</h1>
		<p class="nv-dim">
			Invite people to {SITE_NAME} with your link. You earn bonus CREDIT as they start using it{#if rules}, up
				to {fmt.credits(perInvitee)} for each person{/if}, and they get a welcome gift.
		</p>
	</header>

	{#if data.loadError}
		<p class="text-error-400">{data.loadError}</p>
	{/if}

	{#if data.invite && !data.signedIn}
		<form method="POST" class="nv-float flex flex-col items-start gap-3" use:enhance>
			<span class="nv-title">you're invited</span>
			<p>
				Log in with Discord to accept the invite.{#if rules?.gift}
					You'll get {fmt.credits(rules.gift)} the first time you sign in to the loader.{/if}
			</p>
			<button class="btn" formaction="/auth?/login&provider=discord&path=%2Freferrals"
				>login with discord</button
			>
		</form>
	{:else if data.invite && mine && !mine.own}
		<form method="POST" action="?/claim" class="nv-float flex flex-col items-start gap-3" use:enhance>
			<span class="nv-title">you're invited</span>
			<p>
				Accept the invite to join through it. Only new accounts can, before they run a script or buy CREDIT.
			</p>
			<input type="hidden" name="code" value={data.invite} />
			<button class="btn">accept the invite</button>
			{#if form?.claimMessage}<p class="nv-dim">{form.claimMessage}</p>{/if}
		</form>
	{/if}

	{#if mine?.own}
		{@const own = mine.own}
		<section class="nv-float flex flex-col gap-2">
			<span class="nv-title">your invite</span>
			<p>You joined through an invite on {fmt.date(own.created_at)}.</p>
			{#if !own.eligible}
				<p class="nv-dim">
					Your Discord account was too new when you joined, so this invite earns neither of you anything.
				</p>
			{:else if own.gift_at}
				<p class="nv-dim">You got your welcome gift on {fmt.date(own.gift_at)}.</p>
			{:else if rules?.gift}
				<p class="nv-dim">
					You'll get {fmt.credits(rules.gift)} the first time you sign in to the
					<a href="/install">loader</a>.
				</p>
			{/if}
		</section>
	{/if}

	{#if mine && totals}
		<section class="nv-float flex flex-col gap-3">
			<span class="nv-title">your link</span>
			<div class="flex flex-wrap items-center gap-2">
				<code class="overflow-x-auto bg-(--tn-bg-dark) px-2 py-1">{mine.link}</code>
				<button class="btn text-sm" type="button" onclick={() => clip.copy(mine.link)}>
					{#if clip.copied === mine.link}
						Copied <ClipboardCheck class="size-3.5 shrink-0" />
					{:else}
						Copy <Clipboard class="size-3.5 shrink-0" />
					{/if}
				</button>
			</div>
			<p>
				<b>{fmt.number(mine.referrals.length)}</b> invited ·
				<b>{fmt.number(totals.rewarding)}</b> earned you a reward ·
				<b>{fmt.credits(totals.earned)}</b> earned in all
			</p>
		</section>

		<section class="nv-float flex flex-col gap-3">
			<span class="nv-title">your invitees</span>
			{#if mine.referrals.length}
				<div class="overflow-x-auto">
					<table class="w-full border-collapse text-left text-sm">
						<thead class="nv-dim">
							<tr>
								<th class="py-1 pr-4 font-normal">Invitee</th>
								<th class="py-1 pr-4 font-normal">Joined</th>
								<th class="py-1 pr-4 font-normal">Scripts</th>
								<th class="py-1 pr-4 font-normal">Their invitees</th>
								<th class="py-1 pr-4 font-normal">Topped up</th>
								<th class="py-1 pr-4 font-normal">Earned</th>
								<th class="py-1 font-normal"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-(--tn-bg-hl)">
							{#each mine.referrals as referral (referral.id)}
								<tr>
									<td class="py-1 pr-4" title={referral.id}><code>{referral.id.split("-")[0]}</code></td>
									<td class="py-1 pr-4 whitespace-nowrap">{fmt.date(referral.created_at)}</td>
									<td class="py-1 pr-4">{referral.runtime_scripts} / {rules?.runtimeScripts ?? "?"}</td>
									<td class="py-1 pr-4">{referral.invites} / {rules?.invites ?? "?"}</td>
									<td class="py-1 pr-4">{referral.topped_up ? "yes" : "no"}</td>
									<td class="py-1 pr-4 whitespace-nowrap">{fmt.credits(referral.earned)}</td>
									<td class="nv-dim py-1">
										{#if !referral.eligible}Discord account too new{:else if referral.banned}banned{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="nv-dim">Nobody has joined through your link yet.</p>
			{/if}
		</section>
	{:else if !data.signedIn && !data.invite}
		<p class="nv-dim">Log in to get your invite link and see how your invitees are doing.</p>
	{/if}

	{#if rules}
		<section class="nv-float flex flex-col gap-3">
			<span class="nv-title">rules</span>
			<p>
				Anyone who signs up through your link is your invitee. Each invitee can earn you up to {fmt.credits(
					perInvitee
				)}:
			</p>
			<ul class="flex list-disc flex-col gap-1 pl-5">
				<li>
					{fmt.credits(rules.runtimeReward)} for each different script they run for {hours(
						rules.runtimeMinutes
					)}
					hours in total, over at least {rules.runtimeDays} different days, up to {rules.runtimeScripts} scripts
					({fmt.credits(rules.runtimeReward * rules.runtimeScripts)}). Scripts they wrote themselves don't
					count.
				</li>
				<li>
					{fmt.credits(rules.inviteReward)} for each person they invite who earns them a reward for running scripts
					or topping up, up to {rules.invites} people ({fmt.credits(rules.inviteReward * rules.invites)}).
				</li>
				<li>{fmt.credits(rules.topupReward)} when they first top up CREDIT.</li>
			</ul>
			<p>Your invitee gets {fmt.credits(rules.gift)} the first time they sign in to the loader.</p>
			<ul class="nv-dim flex list-disc flex-col gap-1 pl-5">
				<li>
					Rewards and the gift are bonus CREDIT. It runs scripts like any other CREDIT, but a script's author
					isn't paid for the part of a run you pay with it.
				</li>
				<li>
					Only new accounts can join through a link, before they run a script or buy CREDIT. Each Discord
					account can join through an invite once, even if it deletes its {SITE_NAME} account and signs up again.
				</li>
				<li>
					The invitee's Discord account must be at least {rules.minDiscordDays} days old when they join, or the
					invite earns neither of you anything.
				</li>
				<li>Nothing is paid while you or your invitee is banned. Days are counted in UTC.</li>
			</ul>
		</section>
	{/if}
</section>
