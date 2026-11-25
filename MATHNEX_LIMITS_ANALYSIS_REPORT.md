# MATHNEX — Limits & Continuity and Real Analysis (Modules 13 and 14)

## What was added
| Module | Where | Contents |
|---|---|---|
| **Limits & Continuity** (13) | `src/modules/limits.ts`, `limitsEngine.ts`, `limitsData.ts` | 4 lessons · limit calculator with full working · graph lab · ε–δ lab · continuity analyzer · IVT bisection lab |
| **Real Analysis** (14) | `src/modules/analysis.ts`, `analysisData1.ts`, `analysisData2.ts`, `analysisDemos.ts` | 8 chapters · sequence / sup-inf / series / continuity / MVT-Taylor / Riemann labs · proof studio |
| Shared | `lesson.ts`, `gview.ts`, `mxrich.ts`, `mathpro.css` | 12-part chapter renderer, interactive canvas graph, offline math typography, theme-aware styles |

Integration changes (everything else in the project is untouched): `index.html` (sidebar entries, dashboard cards,
two `<section>` shells, `VALID_MODS`, `MOD_TITLES`, backup `KEYS`, command-palette entries, module counts 12 → 14),
`src/main.tsx` (lazy init hooks), `src/modules/shared.ts` (two `Window` typings + optional `CAS` on `MnxBus`).
Only 10 pre-existing lines of `index.html` were edited (the list/map/count lines above); the rest is additive.

## Limits & Continuity — implemented
* **Lessons** (each with objectives, theory, definitions, formulas, 3 worked examples, graphical explanation, engineering
  applications, 9 exercises Beginner→University with hints and worked solutions, 6-question quiz, 8-question assessment):
  1 Fundamentals · 2 Calculation techniques · 3 ε–δ, limit laws, squeeze, sequences, asymptotics · 4 Continuity & IVT.
* **Calculator** (`lim(x→2) (x²−4)/(x−2)`, `lim_{x→0+}`, `x->∞`, ±∞, π, fractions): exact working using direct
  substitution/limit laws, factorize & cancel, rationalization, common denominator, highest-power division, trig/exp/log
  limits and all seven indeterminate forms through L'Hôpital (exact CAS derivatives), logarithm rewriting and reciprocal
  substitution, squeeze theorem, one-sided analysis (absolute values, poles, domain edges), oscillation (two-sequence proof).
* **Honesty rules**: results are labelled *symbolic · proved*; anything outside the supported class is shown as **NOT SOLVED**
  (no invented answer); numerical tables are always labelled *evidence*; numerical sampling is used only to decide signs.
* **Graph lab**: zoom/pan/pinch, draggable gold approach marker, animated left/right approach, open/closed points,
  asymptotes, f(a) vs limit, evidence tables. **ε–δ lab**: ε-band/δ-window, numerical largest δ, exact formal proofs
  (constant, linear, quadratic), sequential-characterisation tables. **Continuity analyzer** (removable / jump / infinite /
  essential / one-sided) and **IVT bisection** with discontinuity warning.

## Real Analysis — implemented chapters
01 Real numbers · 02 Supremum & infimum · 03 Sequences · 04 Series · 05 Continuity (ε–δ, sequential, uniform) ·
06 Differentiability (Rolle, MVT, Taylor) · 07 Riemann integration (Darboux sums, FTC) · 08 Mathematical proofs.
Every chapter has the same 12-part structure as above (108 exercises and 168 quiz/assessment questions in total), plus labs:
set explorer, sup/inf tester, sequence explorer (symbolic limit + N(ε)), series lab (symbolic ratio/root/n-th term tests,
geometric sums, alternating test), uniform-continuity scan, Rolle/MVT finder with exact derivative, Taylor + Lagrange bound,
Riemann sums with lower/upper sums and an FTC check, induction checker in exact rational arithmetic, ε–δ proof builder and a
step-by-step proof gallery.

## Persistence
Chapter completion (auto when the assessment ≥ 70 %, or manually), exercises solved and best quiz/assessment scores are stored
through the existing `mathnexEduProgress` store; module/tab state in `mathnexLimitsState` / `mathnexAnalysisState`;
limit calculations in the existing unified history (restorable). New keys are included in settings backup/restore.
No existing key or setting was changed.

## Testing results (run in this environment)
| Check | Result |
|---|---|
| `tsc --strict` on the new modules (stubbed CSS typings) | 0 errors |
| Known-answer limit tests against the real CAS | 80 / 80 |
| Engine vs. numerical cross-check (470 limits) | 468 agree; 2 flagged by *float cancellation in the check itself* (engine is correct) |
| Content lint (12 chapters, 168 questions, 108 exercises) | 0 problems |
| Browser end-to-end (Chromium, desktop + 390 px mobile) | 225 / 225 |
| JS errors during e2e | none (only font-file 404s caused by `file://` loading) |

The e2e suite opens every chapter of both modules, answers each quiz/assessment correctly and checks the saved scores and
completion, exercises every calculator example, graph preset, ε–δ / continuity / IVT / sequence / series / Riemann / proof tool,
reloads to confirm persistence, opens all 12 pre-existing modules, and checks mobile layout (no horizontal overflow).

**Limitations, stated plainly**
* `vite build` / `npm run lint` could **not** be run here (no network, no `node_modules`). The app was bundled with esbuild
  (same entry, `?raw` handling) and type-checked with `tsc --strict`; please run `npm install --legacy-peer-deps && npm run build`
  once on your machine.
* The existing Python-Studio (Pyodide) tests were not re-run (they need the Pyodide CDN); that module's files are unmodified.
* Quiz/solution mathematics was written and checked by hand; the automated checks verify structure, the engine and the UI,
  not every sentence of the teaching text. Report any mistake you spot.
* Engine scope: single-variable real limits built from polynomials, roots, powers, exp/ln/log, trig/inverse trig, hyperbolic
  and |·|. Not supported (reported as such): factorials, piecewise definitions, series/integral limits, log-law-dependent
  forms such as lim (|xˣ|)^{1/x}, and sums of an oscillating and an unbounded term (e.g. (x + sin x)/x).

## Run
```
npm install --legacy-peer-deps
npm run dev        # http://127.0.0.1:4173/  → sidebar: "Limits & Continuity", "Real Analysis"
npm run build
node tests/limits-analysis/e2e.mjs    # optional; see tests/limits-analysis/README.md
```
