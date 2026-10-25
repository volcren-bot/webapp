# webapp-template

A SvelteKit starter with Supabase auth, Tailwind 4 UI, dark mode.

## What's included

- SvelteKit 2 / Svelte 5 with `adapter-node`
- Supabase SSR auth (OAuth login/logout, session handling in `src/hooks.server.ts`)
- A `profiles` table with a role, created automatically on sign up (`supabase/schema.sql`)
- Tailwind 4 with a fixed dark mode and a Neovim-style theme (`src/app.css`)
- Account page (`/account`) to change email/password using Superforms + Zod
- SEO `<Head>` component, security headers and a CSP in `svelte.config.js`
- mdsvex + shiki for markdown pages

## Getting started

1. Use this repository as a template and install dependencies:

   ```bash
   pnpm install
   ```

2. Create a Supabase project, run `supabase/schema.sql` in its SQL editor and enable an OAuth provider
   (`Navigation.svelte` uses Discord by default, change the `provider` there to use another one).
   Add `http://localhost:5173/auth/callback/` to the allowed redirect URLs.

3. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.

4. Start the dev server:

   ```bash
   pnpm dev
   ```

## Making it yours

- `src/lib/utils.ts`: `SITE_NAME`, `SITE_DESCRIPTION` and `WEBSITE_URL`
- `src/routes/Logo.svelte`, `static/favicon.svg`: branding
- `src/routes/Navigation.svelte`: add your pages to `routes`
- `src/routes/Footer.svelte`: footer links
- `src/hooks.server.ts`: add paths that require login to `PROTECTED_PATHS`
- `svelte.config.js`: allow any extra domains your app talks to in the CSP
- `static/robots.txt`: add your sitemap

After changing the database, regenerate the types with `pnpm gentypes` (needs the Supabase CLI).

## Scripts

| Command       | Description                   |
| ------------- | ----------------------------- |
| `pnpm dev`    | Start the dev server          |
| `pnpm build`  | Build for production          |
| `pnpm start`  | Run the production build      |
| `pnpm check`  | Type check with svelte-check  |
| `pnpm lint`   | Prettier + ESLint             |
| `pnpm format` | Format the code with Prettier |
