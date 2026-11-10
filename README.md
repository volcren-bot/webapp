# webapp-template

A SvelteKit starter with Supabase auth, Tailwind 4 UI, dark mode.

## What's included

- SvelteKit 2 / Svelte 5 with `adapter-node`
- Supabase SSR auth (OAuth login/logout, session handling in `src/hooks.server.ts`)
- A `profiles` table with a role, created automatically on sign up (schema lives in the `database` repo)
- Tailwind 4 with a fixed dark mode and a Neovim-style theme (`src/app.css`)
- Account page (`/account`) with credit balance, ledger and account deletion
- SEO `<Head>` component, security headers (`src/routes/+layout.server.ts`) and a CSP (`vite.config.ts`)
- Legal documents stored as markdown and rendered on the server by comrak, with raw HTML escaped (`src/lib/server/documents.server.ts`)

## Getting started

1. Use this repository as a template and install dependencies:

   ```bash
   bun install
   ```

2. Create a Supabase project, apply the migrations from the `database` repo and enable an OAuth provider
   (`Navigation.svelte` uses Discord by default, change the `provider` there to use another one).
   Add `http://localhost:5173/auth/callback/` to the allowed redirect URLs.

3. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.

4. Start the dev server:

   ```bash
   bun dev
   ```

## Making it yours

- `src/lib/utils.ts`: `SITE_NAME` and `SITE_DESCRIPTION`
- `src/routes/Logo.svelte`, `static/favicon.svg`: branding
- `src/routes/Footer.svelte`: footer links
- `src/lib/server/supabase.server.ts`: add paths that require login to `PROTECTED_PATHS`
- `vite.config.ts`: allow any extra domains your app talks to in the CSP
- `static/robots.txt`: add your sitemap

After changing the database, regenerate the types with `bun gentypes` (needs the Supabase CLI).

## Feedback

`/reports` lists the bug reports the viewer may see, straight from `feedback.list_reports` under row level security: their own, those on their scripts, those assigned to them, and all of them for moderators. `/reports/[id]` shows one with its attachments (diagnostics, game state, script log) and lets the author, assignee or a moderator change its status, the author or a moderator assign a tester, and the reporter or a moderator delete it. The script page's feedback section gives authors the score distribution (`feedback.score_summary`) and the count of open reports. Scores and reports are sent by the loader through the API; the webapp only reads and triages them.

## Extra-session fees

Every script running at once on an account past the oldest pays `payments.config.extra_session_fee` microcredits per 30 days on top of its price (see the database notes). `extraSessionFee()` in `src/lib/server/payments.server.ts` reads it with a minute's cache for the credits page, the script page's price line and the FAQ entry; the account page shows the fee and bonus parts of each ledger row, lists the running sessions with a Stop button (`payments.stop_session`; the loader stops the script at its next heartbeat) and the last ten ended ones. Amounts are stored in microcredits (1,000,000 = 1 CREDIT = €1, `MICROCREDITS_PER_CREDIT`) and displayed as CREDIT (`formatCreditAmount`) with up to six decimals, account balances with all six (`full`). The unit is written "CREDIT" in user-facing text, like a currency code and never plural (`formatCredits`); the shop (`/credits`) writes euros as "EUR" to match (`formatEur(…, code)`). Prices are shown stacked per month, per hour and per minute (`Price.svelte`), the monthly and hourly ones rounded to at most two decimals (`formatRateAmount`, as is the shop's average monthly cost and the editor's 30-day figure), with the extra-session fee linked to the FAQ beneath on the script page. Prices are microcredits per hour. The script editor (`ScriptWizard.svelte`) asks for the hourly price as typed CREDIT, prefilled with `0,` in the viewer's locale (`formatPriceInput`), and reads it with either decimal separator into microcredits (`parsePrice`: above 0, at most six decimals and `MAX_PRICE`, 0.1344 CREDIT). As the author types, it shows what buyers pay per day and per 30 days of nonstop use and the author's share from `payments.config.platform_fee_bps` (`authorShare()`, cached with `extraSessionFee()`).

## Crypto checkout

Credits are bought in EUR through Bitcart (`src/lib/server/bitcart.server.ts`); the payment page (`/credits/[id]`) lists the invoice's methods except lightning and shows each amount in the method's `symbol`, since a token's `currency` is its chain ("eth" for DAI). DAI comes first and is selected on load (`DEFAULT_SYMBOL`), because a stablecoin doesn't move in value between invoice and payment. Which coins are offered is the store's wallets in the Bitcart admin.

Bitcart matches ETH and token payments only by the sender, so for those methods (`wallet.sender_address_required`) the page hides the pay-to address until the customer sets theirs: the `sender` action checks the payment is theirs and pending, then registers the address once with `PATCH /invoices/{id}/details`. The "pay with browser wallet" button uses an EIP-1193 wallet (`window.ethereum`: MetaMask, Rabby and the like): it connects, registers the account as the sender if none is set (or refuses a different account), switches to the invoice's chain and sends the transaction the load built server-side, a plain transfer of `due` for ETH or an ERC-20 `transfer` for a token.

## Keyboard navigation

Every `+page.svelte` is found at build time (`src/lib/routes.ts`) and nested by URL into one tree, so a new page
is reachable the moment its file exists. The root layout builds the tree for the current viewer (member-only and
admin-only pages are left out, the viewer's scripts are added under `/scripts`) and the sidebar, the key
sequences and the cheat sheet all render from it. Siblings are sorted by name, except `/scripts/new`, which always
comes first under `/scripts`, and the FAQ entries, which follow their order in `src/lib/faqs.ts`.

Pages are reached with sequences: `g`, then one key per level, e.g. `g s` for `/scripts` and `g i f` for
`/information/faq`. Each key is the first letter of the page's folder name that no sibling took, so keys are
unique within a level and sequences never collide. A node with children opens and keeps the panel up for the
next key; a leaf closes it. The sidebar shows each row's key, sub-page menus show the full sequence.

Keys the layout owns and no page may use: `g` (go), `h` (cheat sheet), `Backspace` (parent page, or close a
dialog) and `Esc`. A page registers its own keys with `useKeys` from `src/lib/keys.svelte.ts` for as long as
it is mounted; in development a key that is reserved or already in use logs an error. Lists use `j`/`k` or
the arrows and `Enter`. All keys work without modifiers.

## Scripts

| Command      | Description                   |
| ------------ | ----------------------------- |
| `bun dev`    | Start the dev server          |
| `bun build`  | Build for production          |
| `bun start`  | Run the production build      |
| `bun check`  | Type check with svelte-check  |
| `bun lint`   | Prettier + ESLint             |
| `bun format` | Format the code with Prettier |
