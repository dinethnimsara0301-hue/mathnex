# Limits & Continuity / Real Analysis — test suite

Needs Node 18+, `esbuild` and `playwright` (with Chromium). If they are not installed in the project, point
`NPM_TOOLS` at a folder that has them in its `node_modules`.

```
node tests/limits-analysis/lint_content.mjs      # structure of all 12 chapters (sections, exercise levels, quiz integrity)
node tests/limits-analysis/bundle_engine.mjs     # bundles src/modules/limitsEngine.ts
node tests/limits-analysis/build_site.mjs        # esbuild bundle of the whole app into .out/site
node tests/limits-analysis/test_limits.mjs       # 80 known-answer limit tests against the real MATHNEX CAS
node tests/limits-analysis/fuzz.mjs              # 470 engine results cross-checked against numerical evaluation
node tests/limits-analysis/e2e.mjs               # 225 browser checks (navigation, labs, quizzes, persistence, mobile, existing modules)
```
`fuzz.mjs` currently reports 2 "disagreements": both are floating-point cancellation in the *numerical* check
(x·(√(x²+1)−x) at x = 10⁸ and (eˣ−1−x−x²/2)/x³ at x = 10⁻⁶); the engine's exact answers (1/2 and 1/6) are correct.
The browser run also logs failed font loads — an artefact of opening the bundle through `file://`.
