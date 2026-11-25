# Added in this upgrade (all existing modules, themes and data untouched)
- Optional Supabase accounts: register, confirm password, e-mail verification, login, forgot/reset password, logout, session refresh, multi-tab session sync (no third-party library, anon key only).
- Branded auth modal (animated, reduced-motion aware, password toggle + strength meter, validation, loading/error/success states, focus trap, mobile layout).
- Personal dashboard: overview, saved modules, progress + quiz history (from the app's real quiz data), plan, settings (profile, password, data export, delete synced data, ad preference, sign out).
- Save button in every module header (works for guests locally); "My learning" strip on Home; visit tracking.
- Two-way merge sync of saved modules, activity, quiz bests and topic progress (never overwrites; works offline, retries).
- Database migration with Row Level Security on all six tables; entitlements read-only for clients.
- Monetization integration points: consent-gated AdSense slots, affiliate / sponsored / product cards with disclosures, premium entitlement gating API. Nothing renders until configured; no fake ads or links.
- SEO/PWA: canonical, robots meta, robots.txt, sitemap.xml, favicon, web manifest, corrected og:url, security headers; privacy notice updated.

# Nebula redesign (second pass)
- New default theme "Nebula Blue" (navy / electric blue / cyan / violet); the other 8 presets are unchanged. Intro animation, favicon, manifest and meta theme-color recoloured.
- Cinematic hero (star field, horizon glow, gradient headline, gradient CTA), real-data stats strip (modules, themes, operations counted from the app), premium footer, page-enter transitions.
- Module discovery: search + category/Saved/Recent filters, 14 per-module colour identities, saved markers on cards.
- Mobile: floating app-style tab bar, single-column cards, repositioned Save button.
- Dashboard: module-exploration progress ring computed from the user's own activity.
- Fonts fixed (no more 404s); hero module count corrected to 14.
