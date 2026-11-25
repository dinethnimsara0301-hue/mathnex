# MATHNEX — accounts, monetization & deployment setup

Everything below is **optional**. With `public/config.js` left empty the site behaves exactly as before
(plus local "Save" buttons and a "My learning" strip), and no account UI is shown.

## 1. Supabase (accounts + sync)
1. Create a project at supabase.com.
2. **SQL Editor → run `supabase/migrations/001_mathnex_accounts.sql`** (tables, Row Level Security, sign-up trigger). Safe to re-run.
3. **Authentication → Providers → Email**: enable, keep *Confirm email* ON, set minimum password length to 8.
4. **Authentication → URL Configuration**: Site URL = your live URL (e.g. `https://mathnex.pages.dev`);
   add the same URL (and `http://localhost:5173` for dev) to **Redirect URLs**. Email links will not work otherwise.
5. Strongly recommended: configure a custom SMTP sender (Authentication → SMTP). Supabase's built-in mailer is heavily rate-limited.
6. **Project Settings → API**: copy the *Project URL* and the **anon public** key. Never use `service_role` in the site.
7. Put them in `public/config.js` (`supabaseUrl`, `supabaseAnonKey`) **or** set env vars `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   in your host; `npm run build` writes them into `config.js` via `scripts/gen-config.mjs` (it refuses a service_role key).

## 2. Google AdSense (only after approval)
Set `ads.adsenseClient` (`ca-pub-…`) and slot IDs `ads.slots.home` / `ads.slots.footer` (or `ADSENSE_*` env vars).
Ads load only after the visitor picks an option in the consent banner, never appear inside tools, and are hidden for premium users.
Add `ads.txt` to `public/` as AdSense instructs.

## 3. Affiliate links, sponsors, digital products
Fill `affiliates`, `sponsors`, `products` arrays in `config.js` (https URLs only). Empty arrays render nothing. Affiliate cards carry a disclosure; sponsored cards are labelled "Sponsored".

## 4. Premium (future)
`premium.enabled` is `false`, so everything is free. When you build a real payment flow, have its webhook (server-side, service role) set `public.entitlements.plan='premium'`.
Mark gated UI with `data-mx-premium` (hidden unless entitled) and an upsell with `data-mx-premium-upsell`; in code use `MXPlatform.requirePremium()`.
No payment system is included. Digital downloads: link out via `products`, or use private Supabase Storage with a policy joining `entitlements`.

## 5. Build & deploy (Cloudflare Pages / Netlify / Vercel)
`npm install && npm run build` → publish `dist/`. Env vars above are optional. `public/_headers` adds safe security headers (Cloudflare/Netlify).
Dev: `npm run dev`. Tests: `npm run test:platform` (needs playwright + esbuild).

## Not done / manual
- Fonts: Inter, Inter Display and JetBrains Mono now ship in `public/fonts/` (Latin subset, `.woff`). Space Grotesk, DM Serif Display and Noto Sans Sinhala could not be obtained offline and were removed from the CSS (see `docs/FONTS.md` to add them back).
- Account deletion itself needs a server-side step (Edge Function); users can delete their synced data, and the Settings page points to the site owner for full deletion.
- Hash-based routes (`#vector`…) are not separately indexable by Google; only `/` is in the sitemap. Per-module SEO needs path routing + prerendering (a larger change).
- `og:image` not set (no image asset exists).
