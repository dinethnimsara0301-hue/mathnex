# MATHNEX testing report (after Nebula redesign)

Executed 2026-11-24T03:02:17.365Z.

| Suite | Result |
|---|---|

| Platform E2E (`tests/platform/e2e.mjs`: auth, dashboard, sync, monetization, responsive) | 113/113 |

| Redesign sweep (`tests/platform/redesign.mjs`: 14 modules x 2 viewports x 2 themes, 9 themes x 2 viewports, discovery, tab bar, console, fonts) | 220/220 |

| Existing limits engine known-answer tests | 80/80 |
| Existing browser E2E (`tests/limits-analysis/e2e.mjs`) | 225/225, no JS errors |


## Caveats
- Auth/database tests run against an in-memory **mock** of Supabase, not a live project; the SQL/RLS migration and real e-mail delivery are untested. Do a manual smoke test after setup.
- `npm run build` could not be run (no npm network in the sandbox; vite is not installed). An esbuild bundle of the same sources was tested instead. Run `npm install && npm run build` before deploying.
- Pyodide (Python module) loads from a CDN, which the sandbox blocks; the Programming module's UI opens but Python execution was not exercised here (it is unchanged code).
- Chromium only; no Safari/Firefox/physical-device testing. Contrast checked for key tokens in all 9 themes (text >= 7:1, muted >= 4.5:1, button text >= 4.5:1).
- Reference-image items not implemented because they would be invented data: "50K+ learners", "4.9 rating", "92% average", and a Premium Plan upsell card (no payment system exists).


## Platform E2E detail


### Guest mode (Supabase not configured)

- PASS — no account button when unconfigured
- PASS — home still renders hero + 14 module cards
- PASS — workspace opens vector module
- PASS — Save button injected in module header
- PASS — Save toggles to pressed
- PASS — matrix module has its own Save button
- PASS — home shows "My learning" with Vector saved + recent
- PASS — saved chip opens the module
- PASS — saved state persists after reload
- PASS — no CTA / account UI shown to guests when unconfigured

### Registration, verification, login

- PASS — Sign in button visible when configured
- PASS — home CTA visible for guests
- PASS — auth modal opens with dialog semantics
- PASS — focus moved into modal
- PASS — empty submit shows validation errors
- PASS — invalid email message
- PASS — password visibility toggle reveals text
- PASS — and hides again
- PASS — short password rejected (min 8)
- PASS — mismatched confirmation rejected
- PASS — strength meter reflects strong password
- PASS — signup shows "check your inbox" (no session before verification)
- PASS — password is never persisted by the app
- PASS — unverified login blocked with clear message
- PASS — resend verification email calls API
- PASS — Escape closes modal
- PASS — email-verification link signs the user in
- PASS — tokens stripped from the URL
- PASS — header shows signed-in avatar + name
- PASS — logout clears session + calls API
- PASS — wrong password message
- PASS — login with correct password works
- PASS — refresh-token session persisted
- PASS — session survives reload

### Dashboard and Supabase sync

- PASS — saved module synced to database
- PASS — visit activity synced
- PASS — quiz result synced
- PASS — topic progress synced
- PASS — no request ever wrote another user_id
- PASS — overview greets by profile name
- PASS — overview lists recent + saved Limits & Continuity
- PASS — Saved tab lists the module
- PASS — Progress tab shows quiz history 4 / 5 (80%)
- PASS — Plan tab honestly says everything is free
- PASS — profile saved to database
- PASS — password change calls PUT /user
- PASS — data export contains saved + progress
- PASS — Escape closes dashboard
- PASS — second device receives saved modules
- PASS — second device receives quiz result in the app's own progress store
- PASS — un-saving removes the row remotely
- PASS — "Delete my synced data" empties user tables

### Forgot / reset password

- PASS — reset request sent, generic confirmation shown
- PASS — recovery link opens "choose a new password" (cannot be dismissed accidentally)
- PASS — new password accepted and modal closes
- PASS — can sign in with the reset password
- PASS — expired email link shows a helpful error

### Security

- PASS — service_role key in config disables accounts
- PASS — …and logs a clear console error
- PASS — shipped config.js has no keys (placeholders only)
- PASS — no innerHTML with dynamic data in platform JS (only 3 static-SVG sites with numeric values)
- PASS — anonymous visitors get no table access (mock mirrors RLS)

### Monetization & premium architecture

- PASS — affiliate card rendered with rel=sponsored + disclosure
- PASS — non-https / javascript: URLs dropped
- PASS — sponsored items clearly labelled
- PASS — digital product card present
- PASS — NO ad request before the visitor chooses
- PASS — consent banner shown
- PASS — after choice, AdSense loads with 2 non-intrusive slots (home + footer)
- PASS — ads labelled "Advertisement"
- PASS — non-personalised flag set for "Basic only"
- PASS — no ad inside the tool workspace
- PASS — premium-gated element hidden for free users when premium enabled
- PASS — requirePremium() false for free user
- PASS — premium entitlement from database unlocks features

### Responsive layout (no horizontal overflow)

- PASS — 360px home: no horizontal overflow
- PASS — 360px dashboard: content fits
- PASS — 360px dashboard progress tab fits
- PASS — 360px auth modal: no overflow
- PASS — 360px auth modal: submit button reachable
- PASS — 390px home: no horizontal overflow
- PASS — 390px dashboard: content fits
- PASS — 390px dashboard progress tab fits
- PASS — 390px auth modal: no overflow
- PASS — 390px auth modal: submit button reachable
- PASS — 430px home: no horizontal overflow
- PASS — 430px dashboard: content fits
- PASS — 430px dashboard progress tab fits
- PASS — 430px auth modal: no overflow
- PASS — 430px auth modal: submit button reachable
- PASS — 768px home: no horizontal overflow
- PASS — 768px dashboard: content fits
- PASS — 768px dashboard progress tab fits
- PASS — 768px auth modal: no overflow
- PASS — 768px auth modal: submit button reachable
- PASS — 1024px home: no horizontal overflow
- PASS — 1024px dashboard: content fits
- PASS — 1024px dashboard progress tab fits
- PASS — 1024px auth modal: no overflow
- PASS — 1024px auth modal: submit button reachable
- PASS — 1440px home: no horizontal overflow
- PASS — 1440px dashboard: content fits
- PASS — 1440px dashboard progress tab fits
- PASS — 1440px auth modal: no overflow
- PASS — 1440px auth modal: submit button reachable
- PASS — 1920px home: no horizontal overflow
- PASS — 1920px dashboard: content fits
- PASS — 1920px dashboard progress tab fits
- PASS — 1920px auth modal: no overflow
- PASS — 1920px auth modal: submit button reachable

### Console health & accessibility

- PASS — no JavaScript page errors / console errors in any run
- PASS — reduced-motion: aurora animation disabled
- PASS — normal motion: aurora animates
