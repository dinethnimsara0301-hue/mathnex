import type { ChapterData } from './lesson';
import type { QuizQuestion } from './shared';

type Lv = 'Beginner' | 'Intermediate' | 'Advanced';
const mc = (id: string, level: Lv, category: string, prompt: string, options: string[], correctIndex: number, explanation: string): QuizQuestion => ({
  id, level, category, kind: 'mcq', prompt, options, correctIndex, explanation,
});

/* ═════════════════ CHAPTER 05 — CONTINUITY ═════════════════ */
const C5: ChapterData = {
  id: 'an-5',
  code: 'CHAPTER 05',
  title: 'Continuity (Formal)',
  blurb: 'ε–δ and sequential continuity, uniform continuity, and the great theorems for continuous functions on [a, b].',
  objectives: [
    'State and use the ε–δ definition of continuity at a point and on a set.',
    'Prove the equivalence of ε–δ and sequential continuity and use it to prove (dis)continuity.',
    'Define uniform continuity, show that it is stronger than continuity, and prove x ↦ 1/x is not uniformly continuous on (0, 1).',
    'State the Boundedness, Extreme Value, Intermediate Value and Heine–Cantor theorems and explain why [a, b] is essential.',
  ],
  theory: [
    {
      h: 'Continuity at a point (ε–δ)',
      body: `f : A → ℝ is continuous at c ∈ A if **∀ε > 0 ∃δ > 0 such that x ∈ A and |x − c| < δ ⇒ |f(x) − f(c)| < ε.**

This is the limit definition with one important change: x = c is allowed (then the inequality is trivially true), and f(c) replaces L. f is continuous on A if it is continuous at every c ∈ A.

*Template proof* for f(x) = x² at c: |x² − c²| = |x − c||x + c|; for |x − c| < 1 we get |x + c| < 2|c| + 1; choose δ = min(1, ε/(2|c| + 1)). Note δ depends on **both ε and c**.`,
    },
    {
      h: 'Sequential continuity',
      body: `**Theorem.** f is continuous at c ⇔ for every sequence xₙ → c in A, f(xₙ) → f(c).

*(⇒)* Given ε take δ from continuity; for n large |xₙ − c| < δ so |f(xₙ) − f(c)| < ε.
*(⇐)* Contrapositive: if f is not continuous at c there is ε > 0 such that for each n some xₙ has |xₙ − c| < 1/n but |f(xₙ) − f(c)| ≥ ε; then xₙ → c while f(xₙ) ↛ f(c). ∎

Discontinuity proof by sequences: Dirichlet's function (1 on ℚ, 0 on ℝ∖ℚ) is discontinuous everywhere, using a rational and an irrational sequence converging to c.`,
    },
    {
      h: 'Algebra of continuous functions',
      body: `Sums, products, quotients (nonzero denominators) and compositions of continuous functions are continuous. All polynomials, rational functions, √x, |x|, sin, cos, exp, ln are continuous on their domains.`,
    },
    {
      h: 'Uniform continuity',
      body: `f is **uniformly continuous** on A if **∀ε > 0 ∃δ > 0 such that ∀x, y ∈ A: |x − y| < δ ⇒ |f(x) − f(y)| < ε.**

The difference from continuity is the order of quantifiers: δ may depend on ε but **not on the point**.

- x² is uniformly continuous on [0, 2] but **not** on ℝ (δ must shrink as |x| grows).
- 1/x is continuous on (0, 1) but **not uniformly**: take xₙ = 1/n and yₙ = 1/(n+1): |xₙ − yₙ| → 0 but |f(xₙ) − f(yₙ)| = 1 for all n.
- Lipschitz functions (|f(x) − f(y)| ≤ K|x − y|) are uniformly continuous with δ = ε/K.`,
    },
    {
      h: 'Theorems on [a, b]',
      body: `Let f be continuous on the closed bounded interval [a, b]. Then:

1. **Boundedness:** f is bounded.
2. **Extreme Value Theorem:** f attains a maximum and a minimum.
3. **Intermediate Value Theorem:** f takes every value between f(a) and f(b).
4. **Heine–Cantor:** f is uniformly continuous.

*Proof of 1 (Bolzano–Weierstrass).* If f were unbounded choose xₙ with |f(xₙ)| > n; a subsequence xₙₖ → c ∈ [a, b]; continuity gives f(xₙₖ) → f(c), but |f(xₙₖ)| → ∞, contradiction. ∎

*Why closed and bounded?* On (0, 1], f(x) = 1/x is continuous and unbounded; on [0, ∞) f(x) = x is unbounded; on (0, 1), f(x) = x has no max. Compactness is the real hypothesis.`,
    },
    {
      h: 'Continuous images and inverses',
      body: `The continuous image of [a, b] is a closed bounded interval [m, M]. A continuous strictly monotone function on an interval has a continuous inverse. Example: sin on [−π/2, π/2] has the continuous inverse arcsin.`,
    },
  ],
  definitions: [
    { name: 'Continuity at c', text: '∀ε ∃δ: |x − c| < δ ⇒ |f(x) − f(c)| < ε.' },
    { name: 'Sequential continuity', text: 'xₙ → c ⇒ f(xₙ) → f(c).' },
    { name: 'Uniform continuity', text: '∀ε ∃δ ∀x, y: |x − y| < δ ⇒ |f(x) − f(y)| < ε.' },
    { name: 'Lipschitz', text: '|f(x) − f(y)| ≤ K|x − y| for all x, y.' },
    { name: 'Compact interval', text: '[a, b] — closed and bounded; continuous functions on it are bounded, attain extrema and are uniformly continuous.' },
  ],
  formulas: [
    { name: 'ε–δ at c for x²', f: 'δ = min(1, \\frac{ε}{2|c| + 1})' },
    { name: 'Uniform vs pointwise', f: 'continuity: ∀ε ∀c ∃δ(ε, c);   uniform: ∀ε ∃δ(ε) ∀c' },
    { name: 'Lipschitz ⇒ uniform', f: '|f(x) − f(y)| ≤ K|x − y|  ⇒  δ = \\frac{ε}{K}' },
    { name: 'Sequential criterion', f: 'xₙ → c ⇒ f(xₙ) → f(c)' },
  ],
  examples: [
    {
      title: 'ε–δ: f(x) = 3x² + 1 is continuous at c = 1',
      problem: 'Find δ(ε) at c = 1.',
      steps: ['|f(x) − f(1)| = 3|x² − 1| = 3|x − 1||x + 1|.', 'For |x − 1| < 1: 0 < x < 2 so |x + 1| < 3.', 'Then |f(x) − f(1)| < 9|x − 1| < ε if |x − 1| < ε/9.', 'Take δ = min(1, ε/9).'],
      answer: 'δ = min(1, ε/9).',
    },
    {
      title: '1/x is not uniformly continuous on (0, 1)',
      problem: 'Prove it.',
      steps: ['Take ε = 1/2 and suppose some δ > 0 works for all x, y ∈ (0, 1).', 'Use xₙ = 1/n and yₙ = 1/(2n), both in (0, 1) for n ≥ 2: |xₙ − yₙ| = 1/(2n) < δ once n is large.', 'But |f(xₙ) − f(yₙ)| = |n − 2n| = n ≥ 2 > ε.', 'Contradiction, so no δ works.'],
      answer: 'f is continuous but not uniformly continuous on (0, 1).',
      why: 'Near 0 the function is steeper and steeper, so a single δ cannot control it everywhere.',
    },
    {
      title: 'Discontinuity by sequences',
      problem: 'Show f(x) = 1 for x ≥ 0 and −1 for x < 0 is discontinuous at 0.',
      steps: ['xₙ = −1/n → 0 but f(xₙ) = −1 → −1 ≠ f(0) = 1.', 'By the sequential criterion f is not continuous at 0.'],
      answer: 'Discontinuous at 0 (jump).',
    },
  ],
  graphical: {
    text: `The **continuity lab** has two modes. In *pointwise mode* it shows, for a function f, point c and ε, the largest δ (numerical bisection) that keeps |f(x) − f(c)| < ε. In *uniform mode* it scans many points c on the interval and reports the **smallest** δ over all c: if that minimum stays positive as the interval shrinks to a compact set, f is behaving uniformly; if it tends to 0 (e.g. 1/x on (0, 1)), uniform continuity fails.`,
    demo: 'an-cont',
  },
  applications: [
    { h: 'Sensor and actuator tolerances', text: 'Uniform continuity says one input tolerance δ(ε) guarantees output accuracy ε for every operating point — essential when a single calibration must serve the whole range.' },
    { h: 'Existence of optimal designs', text: 'The Extreme Value Theorem guarantees that a continuous cost (weight, energy, drag) over a closed bounded design space has an optimum; without compactness an "optimum" may not exist.' },
    { h: 'Root and equilibrium finding', text: 'IVT underlies bisection and the existence of equilibrium points in circuits and mechanics.' },
  ],
  exercises: [
    { id: 'a5-b1', level: 'Beginner', q: 'Find δ for f(x) = 4x − 1 at c = 2 and ε = 0.08.', sol: '|f(x) − f(2)| = 4|x − 2| < 0.08 ⇔ |x − 2| < 0.02. **δ = 0.02**.' },
    { id: 'a5-b2', level: 'Beginner', q: 'Is f(x) = x² uniformly continuous on [0, 3]?', sol: '**Yes** — continuous on a compact interval (Heine–Cantor), or Lipschitz with K = 6.' },
    { id: 'a5-b3', level: 'Beginner', q: 'State the Extreme Value Theorem.', sol: 'A continuous function on [a, b] attains a maximum and a minimum value on [a, b].' },
    { id: 'a5-i1', level: 'Intermediate', q: 'Prove f(x) = √x is continuous at c > 0 by ε–δ.', hint: '|√x − √c| = |x − c|/(√x + √c) ≤ |x − c|/√c.', sol: '|√x − √c| = |x − c|/(√x + √c) ≤ |x − c|/√c < ε if |x − c| < ε√c. Take **δ = ε√c**. ∎' },
    { id: 'a5-i2', level: 'Intermediate', q: 'Show f(x) = sin(1/x) (x ≠ 0), f(0) = 0 is discontinuous at 0.', sol: 'xₙ = 1/(2nπ + π/2) → 0 with f(xₙ) = 1 → 1 ≠ 0 = f(0). Not sequentially continuous at 0. ∎' },
    { id: 'a5-i3', level: 'Intermediate', q: 'Show f(x) = x² is not uniformly continuous on ℝ.', hint: 'Take xₙ = n, yₙ = n + 1/n.', sol: '|xₙ − yₙ| = 1/n → 0, but |xₙ² − yₙ²| = |2 + 1/n²| ≥ 2. For ε = 1 no δ works. ∎' },
    { id: 'a5-a1', level: 'Advanced', q: 'Prove that a Lipschitz function is uniformly continuous.', sol: 'Given ε take δ = ε/K (K > 0). If |x − y| < δ then |f(x) − f(y)| ≤ K|x − y| < Kδ = ε. ∎' },
    { id: 'a5-a2', level: 'Advanced', q: 'Prove: if f is continuous on [a, b] and f(x) > 0 for every x, then f ≥ m for some m > 0.', hint: 'Use the Extreme Value Theorem.', sol: 'By EVT f attains its minimum m = f(x₀) at some x₀ ∈ [a,b]; since f(x₀) > 0, m > 0 and f(x) ≥ m for all x. ∎' },
    { id: 'a5-u1', level: 'University', q: 'Prove the Intermediate Value Theorem for a continuous f on [a, b] with f(a) < 0 < f(b) using the supremum.', sol: 'Let S = {x ∈ [a, b] : f(x) < 0}. a ∈ S, S bounded; c = sup S ∈ [a, b]. If f(c) < 0 then (c < b) continuity gives f < 0 on some (c, c + δ), contradicting c = sup S. If f(c) > 0 then f > 0 on (c − δ, c], so no point of S lies in (c − δ, c], contradicting that points of S approach c. So f(c) = 0. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'In the ε–δ definition of continuity at c, x = c is', ['excluded', 'allowed', 'required to differ', 'meaningless'], 1, 'Unlike limits, the inequality holds trivially at x = c.'),
    mc('q2', 'Beginner', 'Uniform', 'Which function is uniformly continuous on ℝ?', ['x²', '1/x', 'sin x', 'eˣ'], 2, 'sin is Lipschitz with K = 1.'),
    mc('q3', 'Intermediate', 'Sequential', 'To disprove continuity at c it suffices to find', ['one sequence xₙ → c with f(xₙ) ↛ f(c)', 'ten values', 'a limit of f', 'a derivative'], 0, 'Sequential criterion.'),
    mc('q4', 'Intermediate', 'Quantifiers', 'Uniform continuity differs from continuity in that δ', ['depends on ε only', 'depends on the point too', 'must be 1', 'is not needed'], 0, 'δ(ε) is independent of the point.'),
    mc('q5', 'Advanced', 'EVT', 'f(x)=x on (0,1) has no maximum because', ['f is discontinuous', 'the interval is not closed', 'f is not bounded', 'f is decreasing'], 1, 'Compactness needed.'),
    mc('q6', 'Advanced', 'Heine–Cantor', 'Continuous on [a, b] implies', ['Lipschitz', 'differentiable', 'uniformly continuous', 'monotone'], 2, 'Heine–Cantor theorem.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Polynomial', 'A polynomial is continuous', ['only at integers', 'everywhere', 'nowhere', 'only on [0,1]'], 1, 'Algebra of continuous functions.'),
    mc('t2', 'Beginner', 'δ', 'For f(x) = 2x, ε–δ choice is', ['δ = 2ε', 'δ = ε/2', 'δ = ε²', 'δ = 1'], 1, '|2x − 2c| = 2|x − c|.'),
    mc('t3', 'Beginner', 'IVT', 'The IVT needs f to be', ['continuous on [a,b]', 'differentiable', 'increasing', 'bounded only'], 0, 'Continuity on a closed interval.'),
    mc('t4', 'Intermediate', 'Uniform', '1/x on (0, 1) is', ['uniformly continuous', 'continuous but not uniformly', 'discontinuous', 'Lipschitz'], 1, 'Steepness blows up near 0.'),
    mc('t5', 'Intermediate', 'Bounded', 'f(x)=1/x on (0,1] is continuous but', ['bounded', 'unbounded', 'constant', 'decreasing to 0'], 1, 'Unbounded: (0,1] is not closed at 0.'),
    mc('t6', 'Intermediate', 'Sequences', 'Dirichlet function discontinuity uses', ['rational and irrational sequences', 'derivatives', 'Taylor series', 'integration'], 0, 'Density gives sequences with different images.'),
    mc('t7', 'Advanced', 'Composition', 'f, g continuous ⇒ f∘g', ['continuous', 'differentiable', 'uniformly continuous', 'monotone'], 0, 'Composition rule.'),
    mc('t8', 'Advanced', 'Image', 'The image of [a,b] under a continuous f is', ['an open interval', 'a closed bounded interval', 'unbounded', 'a finite set'], 1, 'Exactly [min f, max f].'),
  ],
};

/* ═════════════════ CHAPTER 06 — DIFFERENTIABILITY ═════════════════ */
const C6: ChapterData = {
  id: 'an-6',
  code: 'CHAPTER 06',
  title: 'Differentiability',
  blurb: 'Derivative as a limit, differentiability ⇒ continuity, Rolle, Mean Value Theorem, Taylor’s theorem and applications.',
  objectives: [
    'Define the derivative as a limit and prove basic rules from the definition.',
    'Prove that differentiability implies continuity and give a continuous non-differentiable example.',
    'State and prove Rolle’s Theorem and the Mean Value Theorem, and use them for monotonicity and inequalities.',
    'State Taylor’s Theorem with Lagrange remainder and use it to bound errors.',
  ],
  theory: [
    {
      h: 'The derivative',
      body: `f is **differentiable at c** if the limit f′(c) = lim_{h→0} [f(c + h) − f(c)]/h exists (finite). Equivalent form: lim_{x→c} [f(x) − f(c)]/(x − c).

Geometrically f′(c) is the slope of the tangent: secant slopes converge. Analytically it is the best linear approximation: f(c + h) = f(c) + f′(c)h + o(h).

*From the definition:* (x²)′ = lim (2xh + h²)/h = 2x; the product rule follows from f(x+h)g(x+h) − f(x)g(x) = f(x+h)[g(x+h) − g(x)] + g(x)[f(x+h) − f(x)] and continuity of f.`,
    },
    {
      h: 'Differentiability implies continuity',
      body: `If f is differentiable at c then f(x) − f(c) = [f(x) − f(c)]/(x − c) · (x − c) → f′(c) · 0 = 0, so f is continuous at c.

The converse is false: f(x) = |x| is continuous at 0, but the left slope is −1 and the right slope is +1, so f′(0) does not exist. (Weierstrass constructed a function continuous everywhere and differentiable nowhere.)`,
    },
    {
      h: "Rolle's Theorem",
      body: `If f is continuous on [a, b], differentiable on (a, b) and f(a) = f(b), then there is c ∈ (a, b) with f′(c) = 0.

*Proof.* By the Extreme Value Theorem f attains a max and a min. If both occur at the endpoints, f is constant and f′ = 0 everywhere. Otherwise an extremum occurs at an interior c; at an interior extremum f′(c) = 0 (Fermat's theorem: left and right difference quotients have opposite signs). ∎`,
    },
    {
      h: 'Mean Value Theorem',
      body: `If f is continuous on [a, b] and differentiable on (a, b) there exists c ∈ (a, b) with

**f(b) − f(a) = f′(c)(b − a).**

*Proof.* Apply Rolle to g(x) = f(x) − f(a) − [(f(b) − f(a))/(b − a)](x − a), which satisfies g(a) = g(b) = 0. ∎

Interpretation: some instant has the instantaneous rate equal to the average rate (a car averaging 100 km/h must hit exactly 100 km/h).

**Consequences.** f′ = 0 on an interval ⇒ f constant; f′ > 0 ⇒ f strictly increasing; |f′| ≤ K ⇒ f is K-Lipschitz (so uniformly continuous).`,
    },
    {
      h: "Cauchy MVT and L'Hôpital",
      body: `Cauchy's MVT: for f, g continuous on [a, b], differentiable on (a, b), there is c with [f(b) − f(a)]g′(c) = [g(b) − g(a)]f′(c). Applying it to f/g near a point is exactly how L'Hôpital's Rule is proved (Limits module, Lesson 2).`,
    },
    {
      h: "Taylor's Theorem",
      body: `If f has n + 1 continuous derivatives on an interval containing 0 and x, then f(x) = Pₙ(x) + Rₙ(x), where Pₙ(x) = Σ_{k=0}^n f^{(k)}(0)xᵏ/k! and the **Lagrange remainder**

Rₙ(x) = f^{(n+1)}(ξ) xⁿ⁺¹/(n + 1)!  for some ξ between 0 and x.

(About a point a: replace x by x − a.) The MVT is the case n = 0.

**Use:** error bounds. For sin x, |f^{(n+1)}| ≤ 1 so |sin x − Pₙ(x)| ≤ |x|ⁿ⁺¹/(n+1)!. With n = 3: |sin x − (x − x³/6)| ≤ x⁴/24.`,
    },
    {
      h: 'Applications',
      body: `- **Monotonicity and extrema:** sign of f′; first and second derivative tests follow from MVT/Taylor.
- **Inequalities:** eˣ ≥ 1 + x (Taylor with R₁ ≥ 0), sin x ≤ x for x ≥ 0 (MVT).
- **Newton's method** error analysis uses Taylor's theorem.
- **Small-angle approximations** and linearisation.`,
    },
  ],
  definitions: [
    { name: 'Derivative', text: "f′(c) = lim_{x→c} [f(x) − f(c)]/(x − c), if it exists." },
    { name: 'Differentiable on (a,b)', text: 'Differentiable at every point of (a, b).' },
    { name: "Rolle's Theorem", text: 'f continuous on [a,b], differentiable on (a,b), f(a) = f(b) ⇒ ∃c: f′(c) = 0.' },
    { name: 'Mean Value Theorem', text: '∃c ∈ (a,b): f(b) − f(a) = f′(c)(b − a).' },
    { name: 'Taylor polynomial', text: 'Pₙ(x) = Σ f^{(k)}(a)(x − a)ᵏ/k!' },
    { name: 'Lagrange remainder', text: 'Rₙ(x) = f^{(n+1)}(ξ)(x − a)ⁿ⁺¹/(n+1)!' },
  ],
  formulas: [
    { name: 'Derivative', f: "f′(c) = lim_{h→0} \\frac{f(c + h) − f(c)}{h}" },
    { name: 'MVT', f: "f′(c) = \\frac{f(b) − f(a)}{b − a}" },
    { name: 'Taylor with remainder', f: 'f(x) = Σ_{k=0}^{n} \\frac{f^{(k)}(a)}{k!}(x − a)ᵏ + \\frac{f^{(n+1)}(ξ)}{(n+1)!}(x − a)ⁿ⁺¹' },
    { name: 'Standard Maclaurin series', f: 'eˣ = Σ \\frac{xⁿ}{n!},  sin x = Σ \\frac{(−1)ⁿx^{2n+1}}{(2n+1)!},  cos x = Σ \\frac{(−1)ⁿx^{2n}}{(2n)!},  \\frac{1}{1−x} = Σ xⁿ' },
    { name: 'Lipschitz from derivative bound', f: '|f′| ≤ K  ⇒  |f(x) − f(y)| ≤ K|x − y|' },
  ],
  examples: [
    {
      title: 'Differentiability vs continuity',
      problem: 'Is f(x) = |x| differentiable at 0?',
      steps: ['Right difference quotient: (|h| − 0)/h = 1 for h > 0.', 'Left difference quotient: −1 for h < 0.', 'The limits differ, so f′(0) does not exist (although f is continuous).'],
      answer: 'Not differentiable at 0 — a corner.',
    },
    {
      title: 'Finding the MVT point',
      problem: 'f(x) = x³ on [0, 2]: find c.',
      steps: ['Average slope = (8 − 0)/2 = 4.', 'f′(c) = 3c² = 4 ⇒ c = 2/√3 ≈ 1.1547 ∈ (0, 2).'],
      answer: 'c = 2/√3.',
    },
    {
      title: 'Taylor error bound',
      problem: 'Estimate sin(0.5) using P₃ and bound the error.',
      steps: ['P₃(x) = x − x³/6; P₃(0.5) = 0.5 − 0.125/6 = 0.479167.', '|R₃| ≤ |x|⁴/4! = 0.0625/24 ≈ 0.0026.', 'True sin(0.5) = 0.479426: actual error 0.00026 < 0.0026.'],
      answer: 'sin 0.5 ≈ 0.4792 with guaranteed error ≤ 0.0026.',
      why: '|f⁽⁴⁾| = |sin| ≤ 1 gives a rigorous bound for Lagrange’s remainder.',
    },
  ],
  graphical: {
    text: `**MVT & Rolle finder.** Choose f and [a, b]. The lab draws the secant line and finds every point c where f′(c) equals the secant slope, using the **exact derivative** from the MATHNEX CAS and a sign-change search (reliable for the displayed interval). **Taylor lab:** choose a function and degree n; see Pₙ against f and the error curve |f − Pₙ| compared with the Lagrange bound.`,
    demo: 'an-diff',
  },
  applications: [
    { h: 'Linearisation in control and circuits', text: 'f(a + h) ≈ f(a) + f′(a)h linearises nonlinear devices (diodes, transistors) about an operating point; Taylor’s remainder tells how far the approximation can be trusted.' },
    { h: 'Speed enforcement and kinematics', text: 'The MVT proves that average-speed cameras imply an instantaneous speed equal to the average at some moment.' },
    { h: 'Numerical differentiation error', text: 'The central difference [f(x+h) − f(x−h)]/(2h) has error O(h²) by Taylor expansion — the basis for step-size choice in simulation.' },
  ],
  exercises: [
    { id: 'a6-b1', level: 'Beginner', q: 'Compute f′(2) for f(x) = x² from the definition.', sol: 'lim [(2+h)² − 4]/h = lim (4h + h²)/h = lim (4 + h) = **4**.' },
    { id: 'a6-b2', level: 'Beginner', q: 'Is every continuous function differentiable?', sol: '**No.** |x| at 0 is continuous but has a corner.' },
    { id: 'a6-b3', level: 'Beginner', q: 'Find c from Rolle for f(x) = x² − 4x on [0, 4].', sol: 'f(0) = f(4) = 0; f′(x) = 2x − 4 = 0 ⇒ **c = 2**.' },
    { id: 'a6-i1', level: 'Intermediate', q: 'Find c from the MVT for f(x) = √x on [1, 9].', sol: 'Slope = (3 − 1)/8 = 1/4. f′(c) = 1/(2√c) = 1/4 ⇒ √c = 2 ⇒ **c = 4**.' },
    { id: 'a6-i2', level: 'Intermediate', q: 'Prove |sin x − sin y| ≤ |x − y|.', sol: 'By the MVT, sin x − sin y = cos(c)(x − y) for some c; |cos c| ≤ 1. ∎' },
    { id: 'a6-i3', level: 'Intermediate', q: 'Show eˣ ≥ 1 + x for all x.', hint: 'Taylor with n = 1.', sol: 'eˣ = 1 + x + (e^ξ/2)x² ≥ 1 + x since e^ξ > 0 and x² ≥ 0. ∎' },
    { id: 'a6-a1', level: 'Advanced', q: 'Prove that if f′(x) = 0 for all x in an interval then f is constant.', sol: 'For x < y in the interval the MVT gives f(y) − f(x) = f′(c)(y − x) = 0. ∎' },
    { id: 'a6-a2', level: 'Advanced', q: 'Find the number of real roots of x³ − 3x + 1 = 0 using Rolle’s theorem and IVT.', hint: 'f′ = 3x² − 3 has zeros ±1.', sol: 'f(−2) = −1 < 0, f(−1) = 3 > 0, f(1) = −1 < 0, f(2) = 3 > 0. IVT gives a root in each of (−2,−1), (−1,1), (1,2). A cubic has at most 3 roots, so **exactly 3**.' },
    { id: 'a6-u1', level: 'University', q: 'Prove the Mean Value Theorem from Rolle’s theorem.', sol: 'Let g(x) = f(x) − f(a) − [(f(b)−f(a))/(b−a)](x−a). Then g is continuous on [a,b], differentiable on (a,b) and g(a) = 0 = g(b). By Rolle there is c with g′(c) = 0, i.e. f′(c) = (f(b) − f(a))/(b − a). ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'f′(c) is defined as', ['f(c)/c', 'lim [f(x)−f(c)]/(x−c)', 'f(c+1) − f(c)', 'the area under f'], 1, 'Limit of difference quotients.'),
    mc('q2', 'Beginner', 'Continuity', 'Differentiable at c implies', ['continuous at c', 'monotone near c', 'f′ continuous', 'f(c) = 0'], 0, 'f(x) − f(c) → 0.'),
    mc('q3', 'Intermediate', 'Rolle', 'Rolle’s theorem requires', ['f(a) = f(b)', 'f increasing', 'f′(a) = 0', 'f(a) = 0'], 0, 'Equal endpoint values (plus continuity/differentiability).'),
    mc('q4', 'Intermediate', 'MVT', 'MVT guarantees c with f′(c) equal to', ['0', 'the average slope on [a,b]', 'f(b)', 'the maximum slope'], 1, 'Secant slope.'),
    mc('q5', 'Advanced', 'Taylor', 'Lagrange remainder Rₙ involves', ['f^{(n)}', 'f^{(n+1)}(ξ)', 'f′(0) only', 'the integral of f'], 1, 'The (n+1)th derivative at an intermediate point.'),
    mc('q6', 'Advanced', 'Bound', '|f′| ≤ K on an interval implies f is', ['constant', 'K-Lipschitz', 'increasing', 'unbounded'], 1, 'MVT gives |f(x) − f(y)| ≤ K|x − y|.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Derivative', 'd/dx x³ at x = 1 from the definition equals', ['1', '2', '3', '0'], 2, '3x² at 1.'),
    mc('t2', 'Beginner', 'Corner', 'Which is not differentiable at 0?', ['x²', '|x|', 'sin x', 'eˣ'], 1, 'Corner.'),
    mc('t3', 'Beginner', 'Rolle', 'f(x) = x² − 1 on [−1, 1]: Rolle point c =', ['0', '1', '−1', '0.5'], 0, 'f′(c) = 2c = 0.'),
    mc('t4', 'Intermediate', 'MVT', 'f(x) = x² on [1, 3]: MVT point c =', ['1', '2', '3', '2.5'], 1, 'Slope 4 = 2c ⇒ c = 2.'),
    mc('t5', 'Intermediate', 'Monotone', 'f′ > 0 on (a,b) implies f is', ['strictly increasing', 'constant', 'decreasing', 'bounded'], 0, 'By the MVT.'),
    mc('t6', 'Intermediate', 'Taylor', 'The degree-2 Maclaurin polynomial of cos x is', ['1 − x²/2', '1 + x²/2', 'x − x³/6', '1 − x'], 0, 'cos x = 1 − x²/2 + …'),
    mc('t7', 'Advanced', 'Counterexample', 'A function continuous everywhere and differentiable nowhere is', ['impossible', 'the Weierstrass function', 'sin x', 'x|x|'], 1, 'Weierstrass (1872).'),
    mc('t8', 'Advanced', 'Error', 'For sin x ≈ x − x³/6 the error is at most', ['|x|³/6', '|x|⁴/24', '|x|⁵/120 exactly', 'x²'], 1, 'Lagrange remainder R₃ with |f⁽⁴⁾| ≤ 1 (even sharper bound x⁵/120 also valid).'),
  ],
};

/* ═════════════════ CHAPTER 07 — RIEMANN INTEGRATION ═════════════════ */
const C7: ChapterData = {
  id: 'an-7',
  code: 'CHAPTER 07',
  title: 'Riemann Integration',
  blurb: 'Partitions, upper and lower sums, Riemann integrability, properties of the integral and the Fundamental Theorem of Calculus.',
  objectives: [
    'Define partitions, upper sums U(f, P) and lower sums L(f, P), and the upper/lower integrals.',
    'State and apply the Riemann criterion: f is integrable ⇔ ∀ε ∃P with U − L < ε.',
    'Prove that continuous and monotone functions are integrable and that the Dirichlet function is not.',
    'State and prove both parts of the Fundamental Theorem of Calculus and use the standard properties of the integral.',
  ],
  theory: [
    {
      h: 'Partitions and Darboux sums',
      body: `Let f be bounded on [a, b]. A **partition** is P = {a = x₀ < x₁ < … < xₙ = b}. On each subinterval put mᵢ = inf f and Mᵢ = sup f over [xᵢ₋₁, xᵢ], Δxᵢ = xᵢ − xᵢ₋₁.

**Lower sum** L(f, P) = Σ mᵢΔxᵢ, **upper sum** U(f, P) = Σ MᵢΔxᵢ. Always L(f, P) ≤ U(f, P).

Refining a partition (adding points) **increases** L and **decreases** U. Hence every lower sum is ≤ every upper sum, even for different partitions.`,
    },
    {
      h: 'Upper and lower integrals; integrability',
      body: `Lower integral ∫̲f = sup_P L(f, P); upper integral ∫̄f = inf_P U(f, P). Always ∫̲f ≤ ∫̄f.

f is **Riemann integrable** if they are equal; the common value is ∫ₐᵇ f.

**Riemann criterion.** f is integrable ⇔ for every ε > 0 there is a partition P with U(f, P) − L(f, P) < ε.

Idea: the "area" is squeezed between lower and upper sums; integrability means the squeeze can be made arbitrarily tight.`,
    },
    {
      h: 'Which functions are integrable?',
      body: `- **Continuous** functions on [a, b] (uniform continuity: choose |x − y| < δ ⇒ |f(x) − f(y)| < ε/(b − a); then U − L < ε).
- **Monotone** functions on [a, b] (U − L telescopes: ≤ (f(b) − f(a))·max Δxᵢ).
- Bounded functions with finitely many discontinuities.
- **Not integrable:** Dirichlet's function (1 on ℚ, 0 on ℝ∖ℚ) on [0, 1]: every subinterval has m = 0 and M = 1, so L = 0 and U = 1 for every partition.

(Lebesgue's criterion: a bounded f is Riemann integrable iff its discontinuity set has measure zero.)`,
    },
    {
      h: 'Properties of the integral',
      body: `For integrable f, g:
- Linearity: ∫(αf + βg) = α∫f + β∫g.
- Additivity: ∫ₐᵇ f = ∫ₐᶜ f + ∫꜀ᵇ f.
- Monotonicity: f ≤ g ⇒ ∫f ≤ ∫g.
- |∫f| ≤ ∫|f| (and |f| is integrable).
- If m ≤ f ≤ M then m(b − a) ≤ ∫f ≤ M(b − a).
- **Mean Value Theorem for integrals:** f continuous ⇒ ∃c with ∫ₐᵇ f = f(c)(b − a).`,
    },
    {
      h: 'Fundamental Theorem of Calculus',
      body: `**FTC I.** If f is continuous on [a, b] then F(x) = ∫ₐˣ f(t)dt is differentiable and F′(x) = f(x).
*Proof.* [F(x + h) − F(x)]/h = (1/h)∫ₓ^{x+h} f(t)dt, which lies between min and max of f on that small interval; by continuity both → f(x). ∎

**FTC II.** If f is integrable and G′ = f on [a, b] (G continuous), then ∫ₐᵇ f = G(b) − G(a).
*Proof.* For any partition, the MVT gives points tᵢ with G(xᵢ) − G(xᵢ₋₁) = f(tᵢ)Δxᵢ; summing, G(b) − G(a) = Σ f(tᵢ)Δxᵢ, which lies between L(f, P) and U(f, P) for every P. Hence equals the integral. ∎

Differentiation and integration are inverse operations — that is why antiderivatives compute areas.`,
    },
    {
      h: 'Riemann sums and numerical integration',
      body: `A Riemann sum Σ f(tᵢ)Δxᵢ with tᵢ ∈ [xᵢ₋₁, xᵢ] lies between L and U. For continuous f, left, right, midpoint and trapezoid sums all converge to ∫f as the mesh → 0. The midpoint and trapezoid rules have error O(h²); Simpson's rule O(h⁴) — all provable with Taylor's theorem.`,
    },
  ],
  definitions: [
    { name: 'Partition', text: 'P = {a = x₀ < x₁ < … < xₙ = b}.' },
    { name: 'Lower / upper sum', text: 'L(f,P) = Σ mᵢΔxᵢ,  U(f,P) = Σ MᵢΔxᵢ with mᵢ = inf, Mᵢ = sup on each piece.' },
    { name: 'Riemann integrable', text: 'sup_P L(f,P) = inf_P U(f,P); equivalently ∀ε ∃P: U − L < ε.' },
    { name: 'Refinement', text: 'P* ⊇ P; then L(f,P) ≤ L(f,P*) ≤ U(f,P*) ≤ U(f,P).' },
    { name: 'Antiderivative', text: 'G with G′ = f.' },
  ],
  formulas: [
    { name: 'Riemann criterion', f: '∀ε>0 ∃P: U(f,P) − L(f,P) < ε' },
    { name: 'FTC I', f: '\\frac{d}{dx} ∫ₐˣ f(t)dt = f(x)' },
    { name: 'FTC II', f: '∫ₐᵇ f(x)dx = G(b) − G(a),   G′ = f' },
    { name: 'Estimate', f: 'm(b − a) ≤ ∫ₐᵇ f ≤ M(b − a)' },
    { name: 'Uniform-partition sums', f: 'Δx = \\frac{b − a}{n},   xᵢ = a + iΔx' },
    { name: 'Chain rule form', f: '\\frac{d}{dx} ∫_{a}^{g(x)} f(t)dt = f(g(x))·g′(x)' },
  ],
  examples: [
    {
      title: 'Upper and lower sums for f(x) = x on [0, 1]',
      problem: 'Compute L(f, Pₙ), U(f, Pₙ) for the uniform partition and the integral.',
      steps: ['xᵢ = i/n, Δx = 1/n. f increasing: mᵢ = (i−1)/n, Mᵢ = i/n.', 'L = Σ_{i=1}^n (i−1)/n · 1/n = (n−1)/(2n); U = Σ i/n · 1/n = (n+1)/(2n).', 'U − L = 1/n → 0 and both → 1/2.'],
      answer: '∫₀¹ x dx = 1/2.',
      why: 'Both bounds converge to the same number, so the squeeze closes.',
    },
    {
      title: 'FTC II',
      problem: 'Compute ∫₀^π sin x dx.',
      steps: ['An antiderivative is G(x) = −cos x.', 'G(π) − G(0) = −cos π + cos 0 = 1 + 1 = 2.'],
      answer: '2',
    },
    {
      title: 'FTC I with the chain rule',
      problem: 'Find d/dx ∫₀^{x²} e^{−t²} dt.',
      steps: ['Let F(u) = ∫₀ᵘ e^{−t²}dt so F′(u) = e^{−u²} (FTC I).', 'The expression is F(x²); by the chain rule its derivative is F′(x²)·2x.'],
      answer: '2x e^{−x⁴}',
    },
  ],
  graphical: {
    text: `The **Riemann sum lab** draws rectangles for left, right, midpoint, **lower (inf)** and **upper (sup)** sums on a uniform partition into n pieces, and shows U − L. As n grows the gap closes for continuous f. Lower/upper sums use fine sampling of each sub-interval for the inf and sup (numerical). The FTC panel compares F(x) = ∫ₐˣ f (numerical) with an antiderivative for preset functions.`,
    demo: 'an-riemann',
  },
  applications: [
    { h: 'Work, charge and energy', text: 'W = ∫F dx, Q = ∫i dt and E = ∫P dt are Riemann integrals of measured data approximated by sums.' },
    { h: 'Numerical quadrature in simulation', text: 'Trapezoid and Simpson rules are Riemann-sum refinements; the lower/upper-sum bracket gives rigorous error bars for monotone integrands.' },
    { h: 'Average and RMS values', text: 'The average value (1/(b−a))∫f and RMS √((1/T)∫f²) of a waveform are defined through the integral; the mean value theorem for integrals guarantees an instant where f equals its average.' },
  ],
  exercises: [
    { id: 'a7-b1', level: 'Beginner', q: 'Compute ∫₀² x² dx using FTC.', sol: '[x³/3]₀² = **8/3**.' },
    { id: 'a7-b2', level: 'Beginner', q: 'For P = {0, 1, 2} and f(x) = x on [0, 2] find L and U.', sol: 'm = 0, 1 and M = 1, 2: L = 0·1 + 1·1 = 1, U = 1 + 2 = 3. (integral = 2 lies between.)' },
    { id: 'a7-b3', level: 'Beginner', q: 'Is the Dirichlet function integrable on [0,1]?', sol: '**No**: L(f,P) = 0 and U(f,P) = 1 for every P.' },
    { id: 'a7-i1', level: 'Intermediate', q: 'Compute lim_{n→∞} Σ_{i=1}^n (1/n) · (i/n)².', sol: 'This is the right Riemann sum of x² on [0,1]: the limit is ∫₀¹ x² = **1/3**.' },
    { id: 'a7-i2', level: 'Intermediate', q: 'Find d/dx ∫₁ˣ ln(t²+1) dt.', sol: 'FTC I: **ln(x² + 1)**.' },
    { id: 'a7-i3', level: 'Intermediate', q: 'Estimate ∫₀¹ e^{−x²}dx using m(b−a) ≤ ∫ ≤ M(b−a).', sol: 'On [0,1]: e^{−1} ≤ e^{−x²} ≤ 1, so 0.368 ≤ ∫ ≤ 1 (a crude bracket; finer partitions improve it; true value ≈ 0.7468).' },
    { id: 'a7-a1', level: 'Advanced', q: 'Prove that if f is monotone increasing on [a, b] then f is integrable.', hint: 'U − L = Σ (f(xᵢ) − f(xᵢ₋₁))Δxᵢ.', sol: 'With uniform Δx = (b − a)/n, U − L = Δx Σ[f(xᵢ) − f(xᵢ₋₁)] = Δx (f(b) − f(a)) = (b−a)(f(b)−f(a))/n < ε for large n. ∎' },
    { id: 'a7-a2', level: 'Advanced', q: 'Show that |∫f| ≤ ∫|f| for integrable f.', sol: '−|f| ≤ f ≤ |f| so by monotonicity −∫|f| ≤ ∫f ≤ ∫|f|, i.e. |∫f| ≤ ∫|f|. ∎' },
    { id: 'a7-u1', level: 'University', q: 'Prove FTC II: if G′ = f on [a, b] with f integrable, then ∫ₐᵇ f = G(b) − G(a).', sol: 'Given a partition P apply the MVT to G on each [xᵢ₋₁, xᵢ]: G(xᵢ) − G(xᵢ₋₁) = f(tᵢ)Δxᵢ with tᵢ in the piece. Summing gives G(b) − G(a) = Σ f(tᵢ)Δxᵢ ∈ [L(f,P), U(f,P)]. Since L ≤ ∫f ≤ U for all P and U − L can be made < ε, both G(b) − G(a) and ∫f lie in an interval of length < ε for every ε, so they are equal. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Sums', 'For any partition, L(f,P) is', ['≥ U(f,P)', '≤ U(f,P)', '= U(f,P)', 'unrelated'], 1, 'inf ≤ sup on each piece.'),
    mc('q2', 'Beginner', 'Refinement', 'Refining a partition makes the upper sum', ['larger', 'smaller or equal', 'unchanged always', 'negative'], 1, 'U decreases (or stays).'),
    mc('q3', 'Intermediate', 'Criterion', 'f is Riemann integrable iff ∀ε ∃P with', ['U + L < ε', 'U − L < ε', 'U = 0', 'L = ε'], 1, 'Darboux/Riemann criterion.'),
    mc('q4', 'Intermediate', 'Classes', 'Which is always Riemann integrable on [a,b]?', ['any function', 'continuous functions', 'Dirichlet function', 'unbounded functions'], 1, 'Continuous ⇒ integrable.'),
    mc('q5', 'Advanced', 'FTC', 'FTC I says d/dx ∫ₐˣ f = f(x) when', ['f is integrable', 'f is continuous', 'f is monotone', 'always'], 1, 'Continuity of f at x is needed.'),
    mc('q6', 'Advanced', 'FTC II', '∫ₐᵇ f = G(b) − G(a) requires', ['G continuous with G′ = f', 'G = f', 'G(a) = 0', 'f > 0'], 0, 'G an antiderivative.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Value', '∫₀¹ x dx =', ['1', '1/2', '2', '0'], 1, 'x²/2 from 0 to 1.'),
    mc('t2', 'Beginner', 'Sum', 'Δx for n pieces on [0, 6] is', ['6n', '6/n', 'n/6', '1'], 1, '(b−a)/n.'),
    mc('t3', 'Beginner', 'Bound', 'If 1 ≤ f ≤ 3 on [0,2], then ∫f lies in', ['[1, 3]', '[2, 6]', '[0, 2]', '[3, 9]'], 1, 'm(b−a) = 2, M(b−a) = 6.'),
    mc('t4', 'Intermediate', 'FTC', 'd/dx ∫₀ˣ sin(t²) dt =', ['cos(x²)', 'sin(x²)', '2x sin(x²)', 'sin x'], 1, 'FTC I.'),
    mc('t5', 'Intermediate', 'Chain', 'd/dx ∫₀^{x²} cos t dt =', ['cos x²', '2x cos x²', 'sin x²', '−2x sin x²'], 1, 'cos(x²)·2x.'),
    mc('t6', 'Intermediate', 'Sum limit', 'lim Σ (1/n)(i/n) as n→∞ =', ['1', '1/2', '0', '2'], 1, '∫₀¹ x dx.'),
    mc('t7', 'Advanced', 'Dirichlet', 'For Dirichlet’s function L(f,P) and U(f,P) are', ['0 and 1', '1 and 1', '0 and 0', 'both 1/2'], 0, 'Every interval contains rationals and irrationals.'),
    mc('t8', 'Advanced', 'Monotone', 'A bounded monotone function on [a,b] is', ['integrable', 'not integrable', 'continuous', 'differentiable'], 0, 'U − L telescopes.'),
  ],
};

/* ═════════════════ CHAPTER 08 — MATHEMATICAL PROOFS ═════════════════ */
const C8: ChapterData = {
  id: 'an-8',
  code: 'CHAPTER 08',
  title: 'Mathematical Proofs',
  blurb: 'Logic, quantifiers, direct proof, contradiction, contrapositive, induction, ε–δ proofs and how to use theorems and lemmas.',
  objectives: [
    'Translate statements into logic with ∀, ∃, ⇒, ⇔ and negate them correctly.',
    'Write direct proofs, proofs by contradiction, by contrapositive and by induction.',
    'Structure an ε–δ / ε–N proof (scratch work, then clean proof).',
    'Use named theorems and lemmas with their hypotheses checked, and recognise common proof errors.',
  ],
  theory: [
    {
      h: 'Statements, quantifiers and negation',
      body: `A **statement** is true or false. P ⇒ Q (implication) is false only when P is true and Q is false. Its **contrapositive** ¬Q ⇒ ¬P is logically equivalent; its **converse** Q ⇒ P is not.

Quantifiers: ∀ (for all), ∃ (there exists). **Negation rules:** ¬(∀x P) ≡ ∃x ¬P and ¬(∃x P) ≡ ∀x ¬P. Order matters: ∀ε ∃δ is very different from ∃δ ∀ε.

Example: negate "f is continuous at c": ∃ε > 0 ∀δ > 0 ∃x with |x − c| < δ and |f(x) − f(c)| ≥ ε.`,
    },
    {
      h: 'Direct proof',
      body: `Assume the hypothesis and derive the conclusion through a chain of valid steps.

*Example.* If n is odd then n² is odd. Let n = 2k + 1. Then n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1, which is odd. ∎

Typical analysis pattern: start from the quantity you must make small, use algebra and the triangle inequality, and bound it step by step.`,
    },
    {
      h: 'Proof by contradiction',
      body: `To prove P, assume ¬P and derive a contradiction (a statement that is both true and false).

*Example 1.* √2 is irrational (Chapter 1).

*Example 2.* There are infinitely many primes. Suppose p₁, …, pₙ are all of them. N = p₁⋯pₙ + 1 is not divisible by any pᵢ (remainder 1), so N has a prime factor not in the list — contradiction. ∎

Use contradiction when the negation gives you a concrete object to work with.`,
    },
    {
      h: 'Proof by contrapositive',
      body: `To prove P ⇒ Q prove ¬Q ⇒ ¬P.

*Example.* If n² is even then n is even. Contrapositive: if n is odd then n² is odd — the direct proof above. ∎

Contrapositive is often simpler than direct proof when the conclusion is a "not" or when ¬Q is easier to use (e.g. proving continuity via sequences: if f(xₙ) ↛ f(c) then not continuous).`,
    },
    {
      h: 'Mathematical induction',
      body: `To prove P(n) for all n ≥ n₀: (1) **Base case** P(n₀). (2) **Inductive step:** assume P(k) (the induction hypothesis) and prove P(k + 1). Then P(n) holds for all n ≥ n₀.

*Example.* 1 + 2 + … + n = n(n+1)/2. Base n = 1: 1 = 1. Step: assume true for k; then Σ_{i≤k+1} i = k(k+1)/2 + (k+1) = (k+1)(k+2)/2. ∎

*Why it works:* ℕ is well-ordered — a least counterexample would force a smaller counterexample. **Strong induction** assumes P(m) for all m ≤ k.

Common uses: inequalities (Bernoulli), formulas for sums, properties of recursively defined sequences (aₙ < 2 for all n).`,
    },
    {
      h: 'ε–δ and ε–N proofs',
      body: `Every limit/continuity proof has the same shape:

1. **Scratch work (backwards):** from the target inequality |f(x) − L| < ε, find a sufficient condition |x − a| < δ(ε). Bound extra factors (restrict δ ≤ 1).
2. **Proof (forwards):** "Let ε > 0. Choose δ = …. Suppose |x − a| < δ. Then … < ε."

Always state the choice of δ (or N) **before** using it, and make sure it works for the arbitrary ε. Never assume what you are proving.`,
    },
    {
      h: 'Theorems, lemmas, corollaries — and common errors',
      body: `A **theorem** is a major result, a **lemma** a helper result, a **corollary** an immediate consequence. When applying a theorem, **check every hypothesis**: IVT needs continuity on a closed interval; MVT needs continuity on [a, b] and differentiability on (a, b); the ratio test is silent when L = 1.

**Common errors:** proving a statement by examples; circular reasoning; swapping quantifiers; dividing by zero; assuming f′ continuous; applying L'Hôpital when the form is not 0/0 or ∞/∞; concluding "f(a) = L" from a limit; treating ∞ as a real number.`,
    },
  ],
  definitions: [
    { name: 'Contrapositive', text: '¬Q ⇒ ¬P, logically equivalent to P ⇒ Q.' },
    { name: 'Converse', text: 'Q ⇒ P — not equivalent to P ⇒ Q.' },
    { name: 'Induction', text: 'Base case + (P(k) ⇒ P(k+1)) proves P(n) for all n ≥ n₀.' },
    { name: 'Lemma', text: 'A proved auxiliary statement used to prove a theorem.' },
    { name: 'Negation of ∀ε∃δ', text: '∃ε ∀δ ∃x: the condition fails.' },
  ],
  formulas: [
    { name: 'De Morgan for quantifiers', f: '¬(∀x P(x)) ≡ ∃x ¬P(x),    ¬(∃x P(x)) ≡ ∀x ¬P(x)' },
    { name: 'Contrapositive', f: '(P ⇒ Q) ≡ (¬Q ⇒ ¬P)' },
    { name: 'Gauss sum', f: 'Σ_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
    { name: 'Sum of squares', f: 'Σ_{i=1}^{n} i² = \\frac{n(n+1)(2n+1)}{6}' },
    { name: 'Geometric sum', f: 'Σ_{i=0}^{n} rⁱ = \\frac{rⁿ⁺¹ − 1}{r − 1}' },
    { name: 'Bernoulli', f: '(1 + x)ⁿ ≥ 1 + nx  (x ≥ −1)' },
  ],
  examples: [
    {
      title: 'Induction: sum of squares',
      problem: 'Prove Σ_{i=1}^n i² = n(n+1)(2n+1)/6.',
      steps: ['Base n = 1: 1 = 1·2·3/6 = 1 ✓.', 'Assume true for k.', 'Then Σ_{i≤k+1} i² = k(k+1)(2k+1)/6 + (k+1)² = (k+1)[k(2k+1) + 6(k+1)]/6 = (k+1)(2k² + 7k + 6)/6 = (k+1)(k+2)(2k+3)/6.', 'This is the formula with n = k + 1. ∎'],
      answer: 'The formula holds for all n ≥ 1.',
    },
    {
      title: 'Contradiction: no smallest positive real',
      problem: 'Prove there is no smallest positive real number.',
      steps: ['Suppose m > 0 is the smallest positive real.', 'Then m/2 is positive and m/2 < m.', 'This contradicts minimality of m.'],
      answer: 'No smallest positive real exists.',
    },
    {
      title: 'ε–N proof (clean form)',
      problem: 'Prove 1/(n + 1) → 0.',
      steps: ['Scratch: need 1/(n+1) < ε; suffices n > 1/ε.', 'Proof: let ε > 0; choose N > 1/ε (Archimedean property).', 'For n ≥ N: |1/(n+1) − 0| < 1/n ≤ 1/N < ε. ∎'],
      answer: 'Limit 0 with N = ⌈1/ε⌉ + 1.',
    },
  ],
  graphical: {
    text: `The **proof studio** has three tools. (1) **Induction checker:** enter the left and right sides of a formula in n; the tool verifies the statement for n = 1…200 with **exact rational arithmetic** (evidence, not a proof) and prints the induction scaffold. (2) **ε–δ builder:** for linear/quadratic f it writes the formal proof. (3) **Step-by-step proof gallery:** reveal classical proofs one logical step at a time.`,
    demo: 'an-proof',
  },
  applications: [
    { h: 'Verifying algorithms: loop invariants', text: 'Loop correctness is proved by induction on iterations — the invariant is P(k), initialisation is the base case, and maintenance is the inductive step.' },
    { h: 'Safety-critical specifications', text: 'Contrapositive and contradiction are used to prove that unsafe states are unreachable; ε–δ style bounds certify that tolerances propagate through a controller.' },
    { h: 'Reading engineering literature', text: 'Understanding hypotheses of theorems (continuity, differentiability, boundedness) prevents misusing results such as the IVT, Taylor linearisation or stability criteria.' },
  ],
  exercises: [
    { id: 'a8-b1', level: 'Beginner', q: 'State the contrapositive of "if n² is divisible by 3 then n is divisible by 3".', sol: '"If n is not divisible by 3 then n² is not divisible by 3."' },
    { id: 'a8-b2', level: 'Beginner', q: 'Negate: "for every x there is y with y > x".', sol: '"There exists x such that for every y, y ≤ x" (i.e. a largest element exists).' },
    { id: 'a8-b3', level: 'Beginner', q: 'Prove by direct proof: the sum of two even integers is even.', sol: 'Let a = 2m, b = 2n. Then a + b = 2(m + n), even. ∎' },
    { id: 'a8-i1', level: 'Intermediate', q: 'Prove by induction that 2ⁿ > n for all n ≥ 1.', sol: 'Base: 2 > 1. Step: assume 2ᵏ > k. Then 2ᵏ⁺¹ = 2·2ᵏ > 2k ≥ k + 1 (since k ≥ 1). ∎' },
    { id: 'a8-i2', level: 'Intermediate', q: 'Prove by contradiction that √2 + 1 is irrational.', sol: 'If √2 + 1 = r rational then √2 = r − 1 is rational, contradicting the irrationality of √2. ∎' },
    { id: 'a8-i3', level: 'Intermediate', q: 'Prove by contrapositive: if the product ab is irrational then a or b is irrational.', sol: 'Contrapositive: if a and b are both rational then ab is rational — true because a = p/q, b = r/s ⇒ ab = pr/(qs). ∎' },
    { id: 'a8-a1', level: 'Advanced', q: 'Prove Bernoulli’s inequality (1 + x)ⁿ ≥ 1 + nx for x ≥ −1 by induction.', sol: 'Base n = 1: equality. Step: (1+x)ᵏ⁺¹ = (1+x)(1+x)ᵏ ≥ (1+x)(1 + kx) (since 1 + x ≥ 0) = 1 + (k+1)x + kx² ≥ 1 + (k+1)x. ∎' },
    { id: 'a8-a2', level: 'Advanced', q: 'Find the flaw: "Let aₙ = 1/n. Then aₙ → 0 because a₁₀₀ = 0.01, a₁₀₀₀ = 0.001, …".', sol: 'Examples do not prove a limit. One must show ∀ε ∃N with |aₙ| < ε for all n ≥ N (ε–N proof).' },
    { id: 'a8-u1', level: 'University', q: 'Prove using strong induction that every integer n ≥ 2 is a product of primes.', sol: 'Assume true for all 2 ≤ m < n. If n is prime we are done. Otherwise n = ab with 2 ≤ a, b < n; by hypothesis a and b are products of primes, hence so is n. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Logic', 'The contrapositive of P ⇒ Q is', ['Q ⇒ P', '¬P ⇒ ¬Q', '¬Q ⇒ ¬P', 'P ⇒ ¬Q'], 2, 'Logically equivalent to the original.'),
    mc('q2', 'Beginner', 'Induction', 'An induction proof needs', ['only the base case', 'base case and inductive step', 'only the inductive step', 'two counterexamples'], 1, 'Both parts.'),
    mc('q3', 'Intermediate', 'Negation', 'The negation of ∀x ∃y P(x, y) is', ['∃x ∀y ¬P', '∀x ∃y ¬P', '∃x ∃y ¬P', '∀x ∀y ¬P'], 0, 'Flip each quantifier.'),
    mc('q4', 'Intermediate', 'Method', 'To prove "if n² even then n even" the simplest method is', ['contrapositive', 'induction', 'ε–δ', 'integration'], 0, 'Prove "n odd ⇒ n² odd" directly.'),
    mc('q5', 'Advanced', 'Errors', 'Which is NOT a valid proof technique?', ['contradiction', 'checking many examples', 'induction', 'contrapositive'], 1, 'Examples cannot prove a universal claim.'),
    mc('q6', 'Advanced', 'Hypotheses', 'The MVT needs f to be', ['continuous on [a,b], differentiable on (a,b)', 'differentiable at a only', 'integrable', 'monotone'], 0, 'Both hypotheses must be checked.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Quantifiers', '"∃x such that x² = 4" is', ['true in ℝ', 'false in ℝ', 'undefined', 'true only for x > 5'], 0, 'x = 2 works.'),
    mc('t2', 'Beginner', 'Induction', 'In induction, the base case proves', ['P(1) (or P(n₀))', 'P(k + 1)', 'P(n) for all n', 'the contrapositive'], 0, 'The starting statement.'),
    mc('t3', 'Beginner', 'Converse', 'The converse of "if x > 2 then x² > 4" is', ['if x² > 4 then x > 2', 'if x ≤ 2 then x² ≤ 4', 'if x² ≤ 4 then x ≤ 2', 'x > 2'], 0, 'Swap hypothesis and conclusion (and it is false: x = −3).'),
    mc('t4', 'Intermediate', 'Σ', 'Σ_{i=1}^{10} i =', ['45', '55', '100', '65'], 1, '10·11/2.'),
    mc('t5', 'Intermediate', 'Contradiction', 'In a proof by contradiction one assumes', ['the conclusion', 'the negation of the claim', 'the converse', 'a counterexample is impossible'], 1, 'Assume ¬P and derive a contradiction.'),
    mc('t6', 'Intermediate', 'Primes', 'Euclid’s proof that primes are infinite is by', ['induction', 'contradiction', 'ε–δ', 'contrapositive of nothing'], 1, 'Assume finitely many.'),
    mc('t7', 'Advanced', 'ε–δ', 'In an ε–δ proof the choice of δ must be made', ['before using it for arbitrary ε', 'after assuming |f(x) − L| ≥ ε', 'independently of ε always', 'never'], 0, 'δ is defined in terms of the arbitrary ε.'),
    mc('t8', 'Advanced', 'Strong induction', 'Strong induction assumes', ['P(k) only', 'P(m) for all m ≤ k', 'P(k + 1)', 'nothing'], 1, 'All earlier cases.'),
  ],
};

export const ANALYSIS_CHAPTERS_2: ChapterData[] = [C5, C6, C7, C8];
