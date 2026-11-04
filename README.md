# webapp-template

A SvelteKit starter with Supabase auth, Tailwind 4 UI, dark mode.

## What's included

- SvelteKit 2 / Svelte 5 with `adapter-node`
- Supabase SSR auth (OAuth login/logout, session handling in `src/hooks.server.ts`)
- A `profiles` table with a role, created automatically on sign up (schema lives in the `database` repo)
- Tailwind 4 with a fixed dark mode and a Neovim-style theme (`src/app.css`)
- Account page (`/account`) with credit balance, ledger and account deletion
- SEO `<Head>` component, security headers and a CSP in `svelte.config.js`
- mdsvex + shiki for markdown pages

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

- `src/lib/utils.ts`: `SITE_NAME`, `SITE_DESCRIPTION` and `WEBSITE_URL`
- `src/routes/Logo.svelte`, `static/favicon.svg`: branding
- `src/routes/Footer.svelte`: footer links
- `src/hooks.server.ts`: add paths that require login to `PROTECTED_PATHS`
- `svelte.config.js`: allow any extra domains your app talks to in the CSP
- `static/robots.txt`: add your sitemap

After changing the database, regenerate the types with `bun gentypes` (needs the Supabase CLI).

## Keyboard navigation

Every `+page.svelte` is found at build time (`src/lib/routes.ts`) and nested by URL into one tree, so a new page
is reachable the moment its file exists. The root layout builds the tree for the current viewer (member-only and
admin-only pages are left out, the viewer's scripts are added under `/scripts`) and the sidebar, the key
sequences and the cheat sheet all render from it.

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
