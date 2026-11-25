import type { ChapterData } from './lesson';
import type { QuizQuestion } from './shared';

type Lv = 'Beginner' | 'Intermediate' | 'Advanced';
const mc = (id: string, level: Lv, category: string, prompt: string, options: string[], correctIndex: number, explanation: string): QuizQuestion => ({
  id, level, category, kind: 'mcq', prompt, options, correctIndex, explanation,
});

/* ════════════════════════ L1 — FUNDAMENTALS ════════════════════════ */
const L1: ChapterData = {
  id: 'lim-1',
  code: 'LIMITS 01',
  title: 'Fundamentals: Meaning of a Limit',
  blurb: 'Intuition, notation, one-sided and two-sided limits, and when a limit fails to exist.',
  objectives: [
    'Explain in words and symbols what lim_{x→a} f(x) = L means, and why the value f(a) is irrelevant.',
    'Read and write limit notation, including left-hand (a⁻), right-hand (a⁺) and infinite limits.',
    'Decide from a graph or table whether a limit exists, and name the reason when it does not.',
    'State the theorem: the two-sided limit exists ⇔ both one-sided limits exist and are equal.',
    'Distinguish "the limit is ∞" (a description of unbounded behaviour) from "the limit exists" (a real number).',
  ],
  theory: [
    {
      h: 'Why limits exist: instantaneous change needs a limiting process',
      body: `Speed at an instant is "distance ÷ time" with a time interval of length 0 — the formula 0/0 has no meaning. The way out is to study average speeds over shorter and shorter intervals and ask whether they **settle** on one number. That settling-down is a limit.

A limit describes what f(x) is **approaching** as x approaches a, never what happens **at** x = a. This is why a limit can exist even when f(a) is undefined, such as \\frac{x^{2}-4}{x-2} at x = 2.`,
    },
    {
      h: 'The informal meaning',
      body: `We write lim_{x→a} f(x) = L if f(x) can be made as close to L as we like by taking x sufficiently close to a (on both sides), x ≠ a.

Two points are essential. First, "close" is measured by a distance: |f(x) − L| small when |x − a| small. Second, x is never allowed to equal a. The precise version of this sentence is the ε–δ definition of Lesson 3.`,
    },
    {
      h: 'One-sided limits',
      body: `lim_{x→a⁻} f(x) = L means x approaches a through values **less** than a (from the left). lim_{x→a⁺} f(x) = L means values **greater** than a (from the right).

Theorem. lim_{x→a} f(x) = L ⇔ lim_{x→a⁻} f(x) = L **and** lim_{x→a⁺} f(x) = L.

So a two-sided limit fails whenever the sides disagree, for example |x|/x at 0 (left −1, right +1).`,
    },
    {
      h: 'When does a limit fail to exist?',
      body: `There are exactly three common reasons:

- **Jump:** the one-sided limits exist but differ (|x|/x at 0).
- **Unbounded behaviour:** f(x) grows without bound (1/x² → +∞ at 0; 1/x has opposite infinities on the two sides). We say the limit is ±∞ only as a description — no real number L is approached.
- **Oscillation:** f keeps swinging between values without settling, like sin(1/x) at 0.

A limit of +∞ is *not* a number. "The limit equals ∞" means "f(x) exceeds every bound once x is close enough to a".`,
    },
    {
      h: 'Tables and graphs: evidence, not proof',
      body: `A table of values f(a ± 0.1), f(a ± 0.01), … suggests a limit but cannot prove one: a function can behave regularly for 10 steps and then change. The calculator in this module therefore proves limits symbolically (factor/cancel, L'Hôpital, squeeze …) and shows tables only as **evidence**.`,
    },
  ],
  definitions: [
    { name: 'Limit (informal)', text: 'lim_{x→a} f(x) = L: f(x) is as close to L as desired for all x ≠ a sufficiently close to a.' },
    { name: 'Left-hand limit', text: 'lim_{x→a⁻} f(x) = L: the same statement using only x < a.' },
    { name: 'Right-hand limit', text: 'lim_{x→a⁺} f(x) = L: the same statement using only x > a.' },
    { name: 'Infinite limit', text: 'lim_{x→a} f(x) = +∞ means: for every M there is a neighbourhood of a (x ≠ a) in which f(x) > M. The limit does **not** exist as a real number.' },
    { name: 'Vertical asymptote', text: 'The line x = a is a vertical asymptote if at least one one-sided limit of f at a is +∞ or −∞.' },
  ],
  formulas: [
    { name: 'Existence criterion', f: 'lim_{x→a} f(x) = L  ⇔  lim_{x→a⁻} f(x) = lim_{x→a⁺} f(x) = L' },
    { name: 'Average rate of change → derivative', f: 'f′(a) = lim_{h→0} \\frac{f(a+h) − f(a)}{h}' },
    { name: 'Absolute value split', f: '|x| = x (x>0),  −x (x<0)  ⇒  |x|/x → +1 (x→0⁺), −1 (x→0⁻)' },
    { name: 'Reciprocal behaviour', f: '\\frac{1}{x^{n}} → +∞ (n even), and → ±∞ with sign of x (n odd) as x → 0' },
  ],
  examples: [
    {
      title: 'A limit where f(a) is undefined',
      problem: 'Find lim_{x→2} (x² − 4)/(x − 2) and compare with f(2).',
      steps: [
        'At x = 2 the quotient is 0/0, so f(2) is undefined. Substitution gives no information.',
        'For x ≠ 2, factor: x² − 4 = (x − 2)(x + 2), so f(x) = x + 2.',
        'Because a limit ignores x = 2, lim f(x) = lim (x + 2) = 4.',
      ],
      answer: 'The limit is 4, although f(2) does not exist (a "hole" at (2, 4)).',
      why: 'f(x) and x + 2 agree at every point except x = 2, and limits depend only on values near, not at, the point.',
    },
    {
      title: 'Different one-sided limits',
      problem: 'Find lim_{x→0} |x|/x.',
      steps: ['For x > 0, |x| = x so |x|/x = 1; hence the right-hand limit is 1.', 'For x < 0, |x| = −x so |x|/x = −1; the left-hand limit is −1.', 'The sides disagree.'],
      answer: 'The two-sided limit does not exist (jump from −1 to +1).',
    },
    {
      title: 'An infinite limit',
      problem: 'Describe lim_{x→0} 1/x² and lim_{x→0} 1/x.',
      steps: [
        'As x → 0, x² is a tiny positive number whichever side we come from, so 1/x² is huge and positive: the limit is +∞.',
        'For 1/x: x → 0⁺ gives +∞, x → 0⁻ gives −∞.',
      ],
      answer: 'lim 1/x² = +∞ (vertical asymptote, both sides up). lim 1/x does not exist (sides give +∞ and −∞).',
    },
  ],
  graphical: {
    text: `Use the interactive graph below. **Drag the gold marker** (or use the slider) to move the approach point a. The table shows f(a ± 10⁻ᵏ) for k = 1…8 so you can watch the left and right values close in. Try the presets: a hole, a jump, a vertical asymptote and sin(1/x). Pan by dragging the graph, zoom with the wheel or pinch.`,
    demo: 'lim-approach',
  },
  applications: [
    { h: 'Instantaneous velocity and acceleration', text: 'v(t₀) = lim_{h→0} [s(t₀+h) − s(t₀)]/h. Vehicle dynamics, robotics motion planning and encoder differentiation all rest on this limit.' },
    { h: 'Signal processing: switching circuits', text: 'An ideal switch produces a step whose left and right limits at the switching instant differ — a jump discontinuity. Engineers record both one-sided values (e.g. v(0⁻) and v(0⁺) for capacitor/inductor initial conditions).' },
    { h: 'Structural mechanics: stress concentration', text: 'Idealised point loads or sharp notches give models whose stress tends to infinity near a point; recognising an infinite limit tells you the model has broken down there and a finite-size correction is needed.' },
  ],
  exercises: [
    { id: 'l1-b1', level: 'Beginner', q: 'Evaluate lim_{x→3} (2x + 1).', hint: 'The function is a polynomial.', sol: 'Polynomials are continuous, so substitute: 2(3)+1 = **7**.' },
    { id: 'l1-b2', level: 'Beginner', q: 'Evaluate lim_{x→1} (x² − 1)/(x − 1).', hint: 'Factor the numerator.', sol: '(x²−1) = (x−1)(x+1). For x ≠ 1 the quotient is x+1, so the limit is **2**.' },
    { id: 'l1-b3', level: 'Beginner', q: 'True or false: if f(a) is undefined then lim_{x→a} f(x) cannot exist.', sol: '**False.** The limit only depends on values near a; (x²−4)/(x−2) has limit 4 at 2 while f(2) is undefined.' },
    { id: 'l1-i1', level: 'Intermediate', q: 'Find the left and right limits of f(x) = (x − 3)/|x − 3| at 3.', hint: 'Split the absolute value.', sol: 'For x>3: |x−3| = x−3 so f = 1. For x<3: f = −1. Left = **−1**, right = **+1**; the two-sided limit does not exist.' },
    { id: 'l1-i2', level: 'Intermediate', q: 'Describe the behaviour of 1/(x − 1) as x → 1⁻ and x → 1⁺.', sol: 'x−1 is a small negative number from the left → 1/(x−1) → **−∞**; from the right it is small positive → **+∞**. The line x = 1 is a vertical asymptote.' },
    { id: 'l1-i3', level: 'Intermediate', q: 'A piecewise function is x² for x < 1, 3 for x = 1 and 2x − 1 for x > 1. Does lim_{x→1} f(x) exist? What is it?', sol: 'Left: 1² = 1. Right: 2(1)−1 = 1. Both equal 1, so the limit is **1**, even though f(1) = 3.' },
    { id: 'l1-a1', level: 'Advanced', q: 'Explain why lim_{x→0} sin(1/x) does not exist, using two sequences.', hint: 'Use xₙ = 1/(nπ) and yₙ = 1/(2nπ + π/2).', sol: 'sin(1/xₙ) = sin(nπ) = 0 for every n, so f(xₙ) → 0. sin(1/yₙ) = sin(2nπ + π/2) = 1, so f(yₙ) → 1. Both sequences → 0 but the images have different limits, so no single limit L can exist.' },
    { id: 'l1-a2', level: 'Advanced', q: 'Show that "lim f = +∞" does not mean "the limit exists" by finding a function with an infinite limit where |f(x) − L| is never small for any real L.', sol: 'Take f(x) = 1/x² near 0. For any real L, once |x| < 1/√(|L|+1) we have f(x) > |L| + 1, hence |f(x) − L| > 1. So no real number is approached; +∞ only describes unboundedness.' },
    { id: 'l1-u1', level: 'University', q: 'Let f(x) = x·sin(1/x) for x ≠ 0. Prove lim_{x→0} f(x) exists and find it, using only the definition of boundedness.', hint: 'Compare with ±|x|.', sol: 'Since |sin(1/x)| ≤ 1, we get −|x| ≤ f(x) ≤ |x|. Both bounds → 0, so f(x) → **0** (Squeeze Theorem, Lesson 3). Contrast with sin(1/x) alone: the factor x damps the oscillation.' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Meaning', 'lim_{x→a} f(x) = L describes…', ['the value f(a)', 'what f(x) approaches as x approaches a', 'the maximum of f near a', 'the slope of f at a'], 1, 'A limit is about the values f(x) approaches, not the value at a.'),
    mc('q2', 'Beginner', 'Existence', 'If lim_{x→a⁻} f = 2 and lim_{x→a⁺} f = 5, then lim_{x→a} f is…', ['2', '5', '3.5', 'does not exist'], 3, 'Unequal one-sided limits ⇒ no two-sided limit.'),
    mc('q3', 'Beginner', 'Calculation', 'lim_{x→2} (x² − 4)/(x − 2) equals', ['0', '2', '4', 'undefined'], 2, 'Cancel (x−2): the limit is x+2 → 4.'),
    mc('q4', 'Intermediate', 'Infinite limit', 'lim_{x→0} 1/x² is', ['0', '+∞', '−∞', 'does not exist and is not infinite'], 1, 'x² is small and positive from both sides, so 1/x² → +∞.'),
    mc('q5', 'Intermediate', 'Oscillation', 'Why does lim_{x→0} sin(1/x) fail to exist?', ['it tends to ∞', 'the one-sided limits differ', 'it oscillates between −1 and 1 without settling', 'sin is undefined at 0'], 2, 'Oscillation with no damping; two sequences give different limits.'),
    mc('q6', 'Advanced', 'Rigour', 'A table showing f(0.1), f(0.01), f(0.001) all near 3 is…', ['a proof that the limit is 3', 'evidence only', 'a proof the function is continuous', 'a proof that f(0)=3'], 1, 'Finitely many samples never prove a limit; you need an argument valid for all x near a.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Definition', 'In a limit x ≠ a is required because…', ['f(a) is always undefined', 'the limit concerns behaviour near a, not at a', 'a is always irrational', 'it makes algebra easier'], 1, 'Limits ignore the value at a.'),
    mc('t2', 'Beginner', 'Calculation', 'lim_{x→4} (x + 3) =', ['4', '7', '12', 'does not exist'], 1, 'Polynomial: substitute.'),
    mc('t3', 'Beginner', 'Notation', 'lim_{x→0⁺} means x approaches 0 through…', ['negative values', 'positive values', 'both', 'integers only'], 1, 'The plus sign is the right-hand side.'),
    mc('t4', 'Intermediate', 'Piecewise', 'f(x)=x+1 for x<2, f(x)=7−x for x≥2. lim_{x→2} f(x) is', ['3', '5', '2', 'does not exist'], 3, 'Left: 2+1 = 3, right: 7−2 = 5; unequal ⇒ the limit does not exist.'),
    mc('t5', 'Intermediate', 'Asymptote', 'lim_{x→3⁺} 1/(x−3) =', ['−∞', '0', '+∞', '3'], 2, 'x−3 is small positive.'),
    mc('t6', 'Intermediate', 'Abs value', 'lim_{x→0⁻} |x|/x =', ['1', '−1', '0', 'does not exist'], 1, 'For x<0, |x| = −x.'),
    mc('t7', 'Advanced', 'Sequences', 'Two sequences both tend to a but f takes limiting values 0 and 1 along them. Then', ['lim f(x) = 0.5', 'lim f(x) = 0', 'lim f(x) does not exist', 'f is continuous'], 2, 'The sequential criterion: a limit must be the same along every sequence.'),
    mc('t8', 'Advanced', 'Rigour', 'Which statement is TRUE?', ['lim = ∞ means the limit exists', 'lim_{x→a} f = L implies f(a) = L', 'Equal one-sided limits ⇔ the two-sided limit exists', 'A limit can have two different values'], 2, 'That is the existence criterion. Limits are unique.'),
  ],
};

/* ════════════════════════ L2 — TECHNIQUES ════════════════════════ */
const L2: ChapterData = {
  id: 'lim-2',
  code: 'LIMITS 02',
  title: 'Calculation Techniques',
  blurb: 'Substitution, factorization, rationalization, common denominators, trigonometric/exponential/logarithmic limits, limits at ∞, indeterminate forms and L’Hôpital.',
  objectives: [
    'Choose a technique by recognising the form: direct substitution, factor/cancel, rationalise, common denominator, divide by the highest power.',
    'Use the fundamental limits sin x/x, (1−cos x)/x², (eˣ−1)/x and ln(1+x)/x.',
    'Identify the seven indeterminate forms 0/0, ∞/∞, 0·∞, ∞−∞, 1^∞, 0⁰, ∞⁰ and convert each to 0/0 or ∞/∞.',
    "State the hypotheses of L'Hôpital's Rule and apply it (repeatedly) without misusing it.",
    'Compute limits at ±∞ and horizontal asymptotes of rational and algebraic functions.',
  ],
  theory: [
    {
      h: 'Step 0 — always try direct substitution first',
      body: `If f is built from polynomials, rational functions (denominator ≠ 0), roots, sin, cos, eˣ, ln (inside their domains), then lim_{x→a} f(x) = f(a). This works because those functions are **continuous** (Lesson 4).

If substitution gives a finite number, you are done. If it gives c/0 (c ≠ 0) the limit is infinite or does not exist (check the signs from each side). If it gives 0/0 (or another indeterminate form) algebra is needed.`,
    },
    {
      h: 'Factorise and cancel (0/0 with polynomials)',
      body: `If N(a) = D(a) = 0 for polynomials, then (x − a) divides both. Cancel it. This is legitimate because limits ignore x = a, and for x ≠ a the quotient is unchanged.

Example: (x³ − 8)/(x − 2) = (x−2)(x²+2x+4)/(x−2) = x² + 2x + 4 → 12.`,
    },
    {
      h: 'Rationalise (square roots)',
      body: `Multiply top and bottom by the conjugate. For √(x+1) − 1: (√(x+1) − 1)(√(x+1) + 1) = (x+1) − 1 = x. The troublesome zero is now an explicit factor x that cancels:

(√(x+1) − 1)/x = 1/(√(x+1) + 1) → 1/2.

**Why it works:** (p − q)(p + q) = p² − q² removes the root and exposes the common factor.`,
    },
    {
      h: 'Common denominator (∞ − ∞ and fractions)',
      body: `1/(x−1) − 2/(x²−1) is ∞ − ∞ at x = 1. Combine: [(x+1) − 2]/(x²−1) = (x−1)/(x²−1) = 1/(x+1) → 1/2.`,
    },
    {
      h: 'Fundamental limits and where they come from',
      body: `- lim_{x→0} sin x / x = 1 (geometric squeeze: cos x < sin x/x < 1 for small x > 0).
- lim_{x→0} (1 − cos x)/x² = 1/2 (multiply by 1 + cos x, use sin²x = 1 − cos²x).
- lim_{x→0} (eˣ − 1)/x = 1 and lim_{x→0} ln(1 + x)/x = 1 (they are derivatives of eˣ and ln(1+x) at 0).
- lim_{x→∞} (1 + 1/x)ˣ = e.

With a constant k: sin(kx)/x → k, because sin(kx)/x = k · sin(kx)/(kx).`,
    },
    {
      h: 'Limits at infinity',
      body: `For a rational function, divide numerator and denominator by the highest power of x in the denominator. Then deg N < deg D ⇒ 0; deg N = deg D ⇒ ratio of leading coefficients; deg N > deg D ⇒ ±∞.

For √(x² + x) − x (∞ − ∞) rationalise: x/(√(x²+x) + x) = 1/(√(1 + 1/x) + 1) → 1/2.

Exponentials beat polynomials, polynomials beat logarithms: eˣ/xⁿ → ∞, xⁿ/ln x → ∞.`,
    },
    {
      h: "Indeterminate forms and L'Hôpital's Rule",
      body: `0/0 and ∞/∞ are called indeterminate because the **same form** can have limit 0, a nonzero number, or ∞ depending on the functions.

**L'Hôpital.** Let f, g be differentiable near a (except possibly at a), g′ ≠ 0 near a, and f/g of the form 0/0 or ∞/∞. If lim f′/g′ exists (finite or ±∞) then lim f/g = lim f′/g′.

Differentiate numerator and denominator **separately** — it is not the quotient rule. If lim f′/g′ does not exist, the rule says nothing (example: (x + sin x)/x at ∞).

Other forms: 0·∞ → write u·v as u/(1/v). ∞ − ∞ → common denominator or conjugate. 1^∞, 0⁰, ∞⁰ → y = u^v, take ln y = v ln u (a 0·∞ form), then y = e^{lim ln y}.`,
    },
  ],
  definitions: [
    { name: 'Indeterminate form', text: 'An expression whose limit cannot be decided from the limits of its parts alone: 0/0, ∞/∞, 0·∞, ∞−∞, 1^∞, 0⁰, ∞⁰.' },
    { name: 'Conjugate', text: 'For p ± q the conjugate is p ∓ q; their product is p² − q².' },
    { name: 'Horizontal asymptote', text: 'y = L is a horizontal asymptote if lim_{x→+∞} f = L or lim_{x→−∞} f = L.' },
    { name: "L'Hôpital's Rule", text: 'If f/g is 0/0 or ∞/∞ at a and lim f′/g′ exists (finite or infinite), then lim f/g = lim f′/g′.' },
    { name: 'Growth hierarchy', text: 'As x → ∞: ln x ≪ xᵖ (p>0) ≪ aˣ (a>1) ≪ x! — "≪" meaning the ratio tends to 0.' },
  ],
  formulas: [
    { name: 'Sine limit', f: 'lim_{x→0} \\frac{sin kx}{x} = k,   lim_{x→0} \\frac{tan x}{x} = 1' },
    { name: 'Cosine limit', f: 'lim_{x→0} \\frac{1 − cos x}{x^{2}} = \\frac{1}{2}' },
    { name: 'Exponential & logarithmic', f: 'lim_{x→0} \\frac{e^{x} − 1}{x} = 1,   lim_{x→0} \\frac{ln(1+x)}{x} = 1,   lim_{x→0} \\frac{a^{x} − 1}{x} = ln a' },
    { name: 'Euler’s number', f: 'lim_{x→∞} (1 + \\frac{1}{x})^{x} = e,   lim_{x→0} (1 + x)^{1/x} = e' },
    { name: 'Rational functions at ∞', f: '\\frac{a_{n}x^{n}+…}{b_{m}x^{m}+…} → 0 (n<m),  \\frac{a_{n}}{b_{m}} (n=m),  ±∞ (n>m)' },
    { name: 'Power-form indeterminates', f: 'y = u^{v}  ⇒  ln y = v·ln u,   lim y = e^{lim v ln u}' },
  ],
  examples: [
    {
      title: 'Rationalisation',
      problem: 'Find lim_{x→0} (√(x+4) − 2)/x.',
      steps: ['Substitution gives 0/0.', 'Multiply by the conjugate √(x+4)+2: numerator becomes (x+4) − 4 = x.', 'So the quotient is x/[x(√(x+4)+2)] = 1/(√(x+4)+2) for x ≠ 0.', 'Now substitute: 1/(2 + 2) = 1/4.'],
      answer: '1/4',
      why: 'The conjugate converts the root difference into a polynomial exposing the cancelling factor x.',
    },
    {
      title: "L'Hôpital twice",
      problem: 'Find lim_{x→0} (eˣ − 1 − x)/x².',
      steps: ['At 0: 0/0. Differentiate top and bottom: (eˣ − 1)/(2x).', 'At 0: still 0/0. Differentiate again: eˣ/2.', 'At 0 this is 1/2.'],
      answer: '1/2',
      why: 'Each application is valid because the previous form was 0/0 and the next limit exists.',
    },
    {
      title: 'A 1^∞ form',
      problem: 'Find lim_{x→∞} (1 + 2/x)^{3x}.',
      steps: ['Form 1^∞. Let y = (1 + 2/x)^{3x}; ln y = 3x·ln(1 + 2/x).', 'Put t = 1/x → 0⁺: ln y = 3·ln(1 + 2t)/t.', 'By L\'Hôpital: ln(1+2t)/t → 2/(1+2t) → 2, so ln y → 6.', 'Hence y → e⁶.'],
      answer: 'e⁶ ≈ 403.43',
      why: 'Exponentials are continuous, so lim e^{ln y} = e^{lim ln y}.',
    },
  ],
  graphical: {
    text: `The technique lab below runs the real MATHNEX limit engine on a preset and animates the **hole** left by cancellation: the original curve and the simplified curve coincide except at one removable point. Switch presets to see which technique the engine chose.`,
    demo: 'lim-techniques',
  },
  applications: [
    { h: 'Small-angle approximations', text: 'sin θ ≈ θ and 1 − cos θ ≈ θ²/2 follow from the fundamental limits; they linearise pendulum, beam-deflection and optics models.' },
    { h: 'Continuous compounding / exponential decay', text: '(1 + r/n)ⁿ → e^r gives continuous growth and the RC-circuit decay v(t) = V₀e^{−t/RC}.' },
    { h: 'Asymptotic analysis of transfer functions', text: 'Behaviour of H(s) as s → ∞ (high-frequency roll-off) is a limit at infinity: degree comparison of numerator and denominator gives the roll-off slope.' },
  ],
  exercises: [
    { id: 'l2-b1', level: 'Beginner', q: 'lim_{x→3} (x² − 9)/(x − 3)', hint: 'Difference of squares.', sol: '(x−3)(x+3)/(x−3) = x+3 → **6**.' },
    { id: 'l2-b2', level: 'Beginner', q: 'lim_{x→0} sin(5x)/x', sol: 'sin(5x)/x = 5·sin(5x)/(5x) → 5·1 = **5**.' },
    { id: 'l2-b3', level: 'Beginner', q: 'lim_{x→∞} (4x² + 1)/(2x² − 3)', sol: 'Equal degrees: ratio of leading coefficients = 4/2 = **2**.' },
    { id: 'l2-i1', level: 'Intermediate', q: 'lim_{x→4} (√x − 2)/(x − 4)', hint: 'Rationalise, or note x − 4 = (√x − 2)(√x + 2).', sol: 'x − 4 = (√x−2)(√x+2), so the quotient is 1/(√x+2) → **1/4**.' },
    { id: 'l2-i2', level: 'Intermediate', q: 'lim_{x→0} (1 − cos 2x)/x²', sol: '1 − cos 2x = 2sin²x, so the quotient is 2(sin x/x)² → **2**.' },
    { id: 'l2-i3', level: 'Intermediate', q: 'lim_{x→1} (1/(x−1) − 2/(x²−1))', sol: 'Common denominator: (x+1−2)/(x²−1) = (x−1)/((x−1)(x+1)) = 1/(x+1) → **1/2**.' },
    { id: 'l2-a1', level: 'Advanced', q: 'lim_{x→∞} (√(x²+3x) − x)', sol: 'Multiply by the conjugate: 3x/(√(x²+3x)+x) = 3/(√(1+3/x)+1) → **3/2**.' },
    { id: 'l2-a2', level: 'Advanced', q: 'lim_{x→0⁺} x·ln x', hint: 'Write as ln x/(1/x).', sol: 'ln x/(1/x) is −∞/∞... L\'Hôpital: (1/x)/(−1/x²) = −x → **0**.' },
    { id: 'l2-u1', level: 'University', q: 'Show that L\'Hôpital cannot be applied to lim_{x→∞} (x + sin x)/x, and find the limit another way.', hint: 'Split the fraction.', sol: 'The form is ∞/∞ but f′/g′ = 1 + cos x has no limit, so the rule is silent. Directly: (x + sin x)/x = 1 + (sin x)/x and |sin x/x| ≤ 1/x → 0 (squeeze). So the limit is **1**.' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Technique', 'For (x²−1)/(x−1) at x = 1 the best first step is', ['substitute again', 'factor and cancel', 'rationalise', 'L\'Hôpital is the only way'], 1, 'Polynomial 0/0 ⇒ cancel the common factor.'),
    mc('q2', 'Beginner', 'Fundamental', 'lim_{x→0} sin x / x =', ['0', '1', '∞', 'does not exist'], 1, 'Fundamental trigonometric limit.'),
    mc('q3', 'Intermediate', 'Forms', 'Which is NOT an indeterminate form?', ['0/0', '∞ − ∞', '5/∞', '1^∞'], 2, '5/∞ → 0 is determinate.'),
    mc('q4', 'Intermediate', 'L\'Hôpital', 'L\'Hôpital differentiates…', ['the quotient with the quotient rule', 'numerator and denominator separately', 'only the denominator', 'neither'], 1, 'f′/g′ — not (f/g)′.'),
    mc('q5', 'Advanced', 'Infinity', 'lim_{x→∞} (√(x²+x) − x) =', ['0', '1/2', '1', '∞'], 1, 'Conjugate: x/(√(x²+x)+x) → 1/2.'),
    mc('q6', 'Advanced', 'Hypotheses', 'For (x + sin x)/x as x→∞ L\'Hôpital…', ['gives 1', 'gives 0', 'is inconclusive', 'proves the limit is ∞'], 2, 'lim (1 + cos x) does not exist, so no conclusion; the true limit is 1 by splitting.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Substitution', 'lim_{x→2} (x³ − 3x) =', ['2', '0', '−2', '14'], 0, '8 − 6 = 2.'),
    mc('t2', 'Beginner', 'Cancel', 'lim_{x→5} (x² − 25)/(x − 5) =', ['0', '5', '10', 'undefined'], 2, 'x + 5 → 10.'),
    mc('t3', 'Beginner', 'Infinity', 'lim_{x→∞} (3x + 1)/(x² + 1) =', ['3', '0', '∞', '1/3'], 1, 'deg N < deg D.'),
    mc('t4', 'Intermediate', 'Trig', 'lim_{x→0} tan(3x)/x =', ['1', '3', '1/3', '0'], 1, 'tan(3x)/x = 3·tan(3x)/(3x) → 3.'),
    mc('t5', 'Intermediate', 'Exp', 'lim_{x→0} (e^{2x} − 1)/x =', ['1', '2', 'e', '0'], 1, 'L\'Hôpital: 2e^{2x} → 2.'),
    mc('t6', 'Intermediate', 'Log', 'lim_{x→0} ln(1 + 3x)/x =', ['1', '3', '1/3', '0'], 1, 'L\'Hôpital: 3/(1+3x) → 3.'),
    mc('t7', 'Advanced', 'Growth', 'lim_{x→∞} x²/eˣ =', ['∞', '1', '0', '2'], 2, 'Exponentials dominate polynomials (L\'Hôpital twice).'),
    mc('t8', 'Advanced', '1^∞', 'lim_{x→0} (1 + x)^{1/x} =', ['1', '0', 'e', '∞'], 2, 'Definition of e.'),
  ],
};

/* ════════════════════════ L3 — ADVANCED ════════════════════════ */
const L3: ChapterData = {
  id: 'lim-3',
  code: 'LIMITS 03',
  title: 'Advanced Concepts: ε–δ, Limit Laws, Squeeze',
  blurb: 'Rigorous definition, formal ε–δ proofs, limit laws, the Squeeze Theorem, sequential characterisation and asymptotic behaviour.',
  objectives: [
    'State the ε–δ definition and negate it correctly.',
    'Prove limits of linear, quadratic and simple rational functions with explicit δ(ε).',
    'Prove and apply the limit laws and the Squeeze Theorem.',
    'Use the sequential characterisation to prove that a limit does or does not exist.',
    'Compare growth rates with asymptotic notation (~, o, O).',
  ],
  theory: [
    {
      h: 'The ε–δ definition',
      body: `lim_{x→a} f(x) = L means:

**∀ε > 0 ∃δ > 0 such that 0 < |x − a| < δ ⇒ |f(x) − L| < ε.**

Read it as a game: an opponent names a tolerance ε around L; you must answer with a window δ around a (excluding a) so that every x inside the window has f(x) inside the tolerance. If you can always win, the limit is L.

The negation (limit is **not** L): ∃ε > 0 such that ∀δ > 0 ∃x with 0 < |x − a| < δ but |f(x) − L| ≥ ε.`,
    },
    {
      h: 'Writing an ε–δ proof: scratch work then proof',
      body: `1. **Scratch work (backwards):** start from |f(x) − L| < ε and manipulate it into the form |x − a| · (something) < ε. Bound the "something" near a (usually by restricting δ ≤ 1).
2. **Choose δ** as the minimum of the restrictions.
3. **Proof (forwards):** "Let ε > 0. Choose δ = …. If 0 < |x − a| < δ then … < ε."

Linear case f(x) = mx + b, m ≠ 0: |f(x) − (ma+b)| = |m||x − a| < ε whenever |x − a| < ε/|m|. So δ = ε/|m|.

Quadratic f(x) = x² at a: |x² − a²| = |x − a||x + a|. If δ ≤ 1 then |x + a| ≤ |x − a| + 2|a| < 2|a| + 1. So take δ = min(1, ε/(2|a| + 1)).`,
    },
    {
      h: 'Limit laws',
      body: `If lim f = L and lim g = M then: lim (f ± g) = L ± M; lim (cf) = cL; lim (fg) = LM; lim (f/g) = L/M provided M ≠ 0; lim fⁿ = Lⁿ; lim √f = √L (L ≥ 0).

**Why the product law is true.** |fg − LM| = |f(g − M) + M(f − L)| ≤ |f||g − M| + |M||f − L|. Near a, f is bounded (|f| ≤ |L| + 1), and each remaining term can be made < ε/2 by choosing δ small — the ε/2 trick.`,
    },
    {
      h: 'Squeeze Theorem',
      body: `If g(x) ≤ f(x) ≤ h(x) near a (x ≠ a) and lim g = lim h = L then lim f = L.

Classic: x² sin(1/x) is trapped between −x² and x², so → 0. Also sin x/x → 1 by squeezing cos x < sin x/x < 1.

Squeeze is the right tool whenever one factor oscillates but is **bounded** and the other factor → 0 (or the denominator → ∞).`,
    },
    {
      h: 'Sequential characterisation',
      body: `lim_{x→a} f(x) = L ⇔ for **every** sequence xₙ → a with xₙ ≠ a, f(xₙ) → L.

Use it negatively: find one sequence with f(xₙ) not → L, or two sequences with different limits, to prove non-existence (sin(1/x) at 0).`,
    },
    {
      h: 'Asymptotic behaviour',
      body: `f ~ g (x → a) means f/g → 1. f = o(g) means f/g → 0. f = O(g) means |f/g| stays bounded.

Examples at ∞: x² + x ~ x²; ln x = o(x); eˣ ≠ O(x¹⁰⁰). At 0: sin x ~ x, 1 − cos x ~ x²/2, eˣ − 1 ~ x. Replacing a function by its asymptotic equivalent inside a **product or quotient** is safe; inside a **sum** it can be fatal (cancellation).`,
    },
  ],
  definitions: [
    { name: 'ε–δ limit', text: '∀ε>0 ∃δ>0: 0<|x−a|<δ ⇒ |f(x)−L|<ε.' },
    { name: 'Limit at +∞', text: 'lim_{x→+∞} f(x) = L: ∀ε>0 ∃M: x > M ⇒ |f(x) − L| < ε.' },
    { name: 'Infinite limit', text: 'lim_{x→a} f(x) = +∞: ∀M ∃δ>0: 0<|x−a|<δ ⇒ f(x) > M.' },
    { name: 'Squeeze Theorem', text: 'g ≤ f ≤ h near a and lim g = lim h = L ⇒ lim f = L.' },
    { name: 'Sequential criterion', text: 'lim f = L ⇔ f(xₙ) → L for every sequence xₙ → a, xₙ ≠ a.' },
    { name: 'Asymptotic equivalence', text: 'f ~ g ⇔ lim f/g = 1.' },
  ],
  formulas: [
    { name: 'ε–δ (linear)', f: 'f(x) = mx + b:   δ = \\frac{ε}{|m|}' },
    { name: 'ε–δ (square)', f: 'x² → a²:   δ = min(1, \\frac{ε}{2|a| + 1})' },
    { name: 'Triangle inequality', f: '|u + v| ≤ |u| + |v|,   ||u| − |v|| ≤ |u − v|' },
    { name: 'Product law bound', f: '|fg − LM| ≤ |f||g − M| + |M||f − L|' },
    { name: 'Squeeze', f: 'g(x) ≤ f(x) ≤ h(x),  lim g = lim h = L ⇒ lim f = L' },
    { name: 'Standard asymptotics at 0', f: 'sin x ~ x,  tan x ~ x,  1 − cos x ~ \\frac{x²}{2},  e^{x} − 1 ~ x,  ln(1+x) ~ x' },
  ],
  examples: [
    {
      title: 'ε–δ proof: lim_{x→3} (4x − 5) = 7',
      problem: 'Prove it from the definition.',
      steps: ['Scratch: |(4x − 5) − 7| = |4x − 12| = 4|x − 3|. We need 4|x − 3| < ε, i.e. |x − 3| < ε/4.', 'Choose δ = ε/4.', 'Proof: given ε > 0 let δ = ε/4. If 0 < |x − 3| < δ then |(4x−5) − 7| = 4|x−3| < 4δ = ε. ∎'],
      answer: 'δ = ε/4 works for every ε.',
      why: 'The function is linear, so |f(x) − L| is exactly m|x − a|; the bound is an equality, giving the best δ.',
    },
    {
      title: 'ε–δ proof: lim_{x→2} x² = 4',
      problem: 'Prove it with an explicit δ.',
      steps: ['Scratch: |x² − 4| = |x − 2||x + 2|.', 'Restrict δ ≤ 1: then 1 < x < 3 so |x + 2| < 5.', 'Need 5|x − 2| < ε, i.e. |x − 2| < ε/5.', 'Choose δ = min(1, ε/5).', 'Proof: if 0 < |x − 2| < δ then |x+2| < 5 and |x²−4| < 5·ε/5 = ε. ∎'],
      answer: 'δ = min(1, ε/5).',
      why: 'The factor |x + 2| is not constant, so we first bound it using the restriction δ ≤ 1.',
    },
    {
      title: 'Squeeze: lim_{x→0} x² sin(1/x)',
      problem: 'Find the limit.',
      steps: ['For x ≠ 0, −1 ≤ sin(1/x) ≤ 1, so −x² ≤ x² sin(1/x) ≤ x².', 'lim(−x²) = lim x² = 0.', 'By the Squeeze Theorem the limit is 0.'],
      answer: '0',
    },
  ],
  graphical: {
    text: `**ε–δ lab.** Choose a function, a point a and ε. The shaded **horizontal band** is (L − ε, L + ε); the **vertical band** is (a − δ, a + δ). The largest δ that keeps the graph (for x ≠ a) inside the band is found by bisection on a fine grid (numerical evidence). For linear, quadratic and constant functions the lab also writes the exact formal proof.`,
    demo: 'lim-epsdelta',
  },
  applications: [
    { h: 'Tolerance design', text: 'ε–δ is exactly tolerance analysis: to guarantee an output within ±ε of target, how tightly must the input be controlled? δ(ε) is the allowable input tolerance (sensors, machining, ADC resolution).' },
    { h: 'Numerical analysis: error control', text: 'Convergence proofs for iterative solvers and series truncations use ε–δ arguments and the triangle inequality to bound total error.' },
    { h: 'Control: stability margins', text: 'Asymptotic equivalents (e.g. 1 − cos x ~ x²/2) simplify nonlinear plant models near equilibrium.' },
  ],
  exercises: [
    { id: 'l3-b1', level: 'Beginner', q: 'Find δ (in terms of ε) so that |(2x + 1) − 5| < ε whenever 0 < |x − 2| < δ.', sol: '|2x − 4| = 2|x − 2| < ε ⇔ |x − 2| < ε/2. Take **δ = ε/2**.' },
    { id: 'l3-b2', level: 'Beginner', q: 'State the negation of "lim_{x→a} f(x) = L".', sol: '∃ε>0 such that ∀δ>0 there is an x with 0<|x−a|<δ and |f(x)−L| ≥ ε.' },
    { id: 'l3-b3', level: 'Beginner', q: 'Use the limit laws: lim_{x→1} (3x² − 2x + 4).', sol: 'Sum/product/power laws: 3(1) − 2(1) + 4 = **5**.' },
    { id: 'l3-i1', level: 'Intermediate', q: 'Prove lim_{x→1} (x² + x) = 2 with δ = min(1, ε/4).', hint: '|x² + x − 2| = |x − 1||x + 2|.', sol: 'For |x − 1| < 1 we have 0 < x < 2, so |x + 2| < 4. Then |x² + x − 2| = |x−1||x+2| < 4δ ≤ ε. ∎' },
    { id: 'l3-i2', level: 'Intermediate', q: 'Find lim_{x→0} x cos(1/x²).', sol: '|x cos(1/x²)| ≤ |x| → 0, so by Squeeze the limit is **0**.' },
    { id: 'l3-i3', level: 'Intermediate', q: 'Show lim_{x→∞} (sin x)/x = 0.', sol: '−1/x ≤ sin x / x ≤ 1/x for x>0; both bounds → 0. By Squeeze the limit is **0**.' },
    { id: 'l3-a1', level: 'Advanced', q: 'Prove lim_{x→2} 1/x = 1/2 from the definition.', hint: '|1/x − 1/2| = |x − 2|/(2|x|). Restrict δ ≤ 1 so x > 1.', sol: 'If |x−2| < 1 then x > 1 so 1/(2|x|) < 1/2. Hence |1/x − 1/2| < |x−2|/2 < ε when |x−2| < 2ε. Take **δ = min(1, 2ε)**. ∎' },
    { id: 'l3-a2', level: 'Advanced', q: 'Let f(x) = 1 for rational x, 0 for irrational. Prove lim_{x→a} f(x) does not exist for every a.', hint: 'Use two sequences: one rational, one irrational.', sol: 'Density: there are rational xₙ → a and irrational yₙ → a. Then f(xₙ) = 1 → 1 and f(yₙ) = 0 → 0. Different limits ⇒ no limit exists (sequential criterion).' },
    { id: 'l3-u1', level: 'University', q: 'Prove the sum law: if lim f = L and lim g = M then lim (f + g) = L + M.', hint: 'Use ε/2.', sol: 'Given ε>0 choose δ₁ with |f − L| < ε/2 for 0<|x−a|<δ₁, and δ₂ for g. Let δ = min(δ₁, δ₂). Then |(f+g) − (L+M)| ≤ |f−L| + |g−M| < ε/2 + ε/2 = ε. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'In ε–δ, ε measures closeness of…', ['x to a', 'f(x) to L', 'a to L', 'δ to ε'], 1, 'ε is the output tolerance; δ is the input window.'),
    mc('q2', 'Beginner', 'Linear', 'For f(x) = 5x the ε–δ choice is δ =', ['5ε', 'ε/5', 'ε', 'ε²'], 1, '|5x − 5a| = 5|x − a| < ε.'),
    mc('q3', 'Intermediate', 'Squeeze', 'Squeeze applies to x sin(1/x) at 0 because', ['sin(1/x) → 0', 'sin(1/x) is bounded and x → 0', 'x → ∞', 'the function is continuous'], 1, 'Bounded × (→0) → 0.'),
    mc('q4', 'Intermediate', 'Sequences', 'To disprove lim f = L you can', ['find one sequence xₙ → a with f(xₙ) not → L', 'check ten values', 'differentiate f', 'factor f'], 0, 'One bad sequence suffices.'),
    mc('q5', 'Advanced', 'Negation', 'The negation of the ε–δ definition begins with', ['∀ε ∀δ', '∃ε ∀δ', '∃δ ∀ε', '∀δ ∃ε'], 1, '∃ε>0 ∀δ>0 ∃x…'),
    mc('q6', 'Advanced', 'Asymptotics', 'Which is true as x → 0?', ['1 − cos x ~ x', '1 − cos x ~ x²/2', 'sin x ~ x²', 'eˣ − 1 ~ x²'], 1, 'Taylor: 1 − cos x = x²/2 − …'),
  ],
  test: [
    mc('t1', 'Beginner', 'δ', 'For lim_{x→1}(3x−2)=1 a valid δ is', ['ε/3', '3ε', 'ε', '1/ε'], 0, '|3x−3| = 3|x−1|.'),
    mc('t2', 'Beginner', 'Laws', 'If lim f = 2 and lim g = −3 then lim fg =', ['−1', '−6', '6', '5'], 1, 'Product law.'),
    mc('t3', 'Beginner', 'Squeeze', 'If −x² ≤ f ≤ x² then lim_{x→0} f =', ['1', '0', 'does not exist', '∞'], 1, 'Both bounds → 0.'),
    mc('t4', 'Intermediate', 'Quadratic', 'For x² at a = 3 with δ ≤ 1, |x + 3| is less than', ['5', '6', '7', '8'], 2, '2 < x < 4 ⇒ |x + 3| < 7.'),
    mc('t5', 'Intermediate', 'Quotient', 'The quotient law requires', ['L ≠ 0', 'M ≠ 0', 'f(a) defined', 'f continuous'], 1, 'Denominator limit must be nonzero.'),
    mc('t6', 'Intermediate', 'Sequence', 'sin(1/x) at 0 takes values 0 and 1 along two sequences so', ['limit is 0.5', 'limit does not exist', 'limit is 1', 'limit is 0'], 1, 'Different limits along sequences.'),
    mc('t7', 'Advanced', 'Equivalents', 'Replacing sin x by x in (sin x − x)/x³ would give 0 but the true limit is', ['0', '−1/6', '1/6', '1'], 1, 'sin x = x − x³/6 + … so the quotient → −1/6; substituting equivalents in a difference is invalid.'),
    mc('t8', 'Advanced', 'Dirichlet', 'The Dirichlet function (1 on ℚ, 0 off ℚ) has limit at a = 0', ['0', '1', 'none', '0.5'], 2, 'Rational and irrational sequences give 1 and 0.'),
  ],
};

/* ════════════════════════ L4 — CONTINUITY ════════════════════════ */
const L4: ChapterData = {
  id: 'lim-4',
  code: 'LIMITS 04',
  title: 'Continuity & the Intermediate Value Theorem',
  blurb: 'Continuity at a point and on an interval, the three kinds of discontinuity, and the IVT with bisection.',
  objectives: [
    'State the three-part definition of continuity at a point and test each part.',
    'Classify discontinuities: removable, jump, infinite (and essential/oscillatory).',
    'Prove that polynomials, rational functions, sin, cos, eˣ are continuous where defined and that sums, products, quotients and compositions preserve continuity.',
    'State and apply the Intermediate Value Theorem; use bisection to locate roots.',
    'Explain why continuity on a closed interval matters (boundedness and extreme values).',
  ],
  theory: [
    {
      h: 'Continuity at a point',
      body: `f is continuous at a if **all three** hold:

1. f(a) is defined;
2. lim_{x→a} f(x) exists;
3. lim_{x→a} f(x) = f(a).

Compactly: lim_{x→a} f(x) = f(a) — "you can find the value by substitution". Equivalent ε–δ form: ∀ε ∃δ: |x − a| < δ ⇒ |f(x) − f(a)| < ε (here x = a is allowed).`,
    },
    {
      h: 'Continuity on an interval',
      body: `f is continuous on (a, b) if continuous at every point of (a, b). On a closed interval [a, b] we also need **one-sided** continuity at the endpoints: lim_{x→a⁺} f = f(a) and lim_{x→b⁻} f = f(b).

Graphically: you can draw the graph without lifting the pencil — a good picture, but the definition is the limit statement.`,
    },
    {
      h: 'Types of discontinuity',
      body: `- **Removable:** lim_{x→a} f(x) = L exists but f(a) is undefined or ≠ L. Redefine f(a) := L to repair it. Example: (x²−4)/(x−2) at 2.
- **Jump:** both one-sided limits exist but differ. Example: ⌊x⌋ at integers, |x|/x at 0. The jump size is f(a⁺) − f(a⁻).
- **Infinite:** at least one one-sided limit is ±∞ (vertical asymptote). Example: 1/x at 0.
- **Essential (oscillatory):** a one-sided limit fails to exist without being infinite. Example: sin(1/x) at 0.`,
    },
    {
      h: 'Building continuous functions',
      body: `If f, g are continuous at a then so are f ± g, fg, cf, and f/g (g(a) ≠ 0). If g is continuous at a and f is continuous at g(a), then f∘g is continuous at a.

Hence every polynomial, every rational function (on its domain), √x on [0, ∞), sin, cos, eˣ, ln x (x > 0) and all their algebraic combinations are continuous wherever defined.`,
    },
    {
      h: 'Intermediate Value Theorem (IVT)',
      body: `If f is continuous on [a, b] and N is any number strictly between f(a) and f(b), then there is c ∈ (a, b) with f(c) = N.

**Consequence (existence of roots):** if f is continuous on [a, b] and f(a)·f(b) < 0, then f has a root in (a, b).

**Bisection** turns this into an algorithm: evaluate the midpoint m, keep the half where the sign changes, repeat. After n steps the root lies in an interval of length (b − a)/2ⁿ.

**Why continuity is essential:** f(x) = 1/x has f(−1) < 0 < f(1) but no root — it is discontinuous at 0.`,
    },
    {
      h: 'Why closed intervals matter (preview)',
      body: `Extreme Value Theorem: a continuous function on [a, b] attains a maximum and a minimum. It is false on open intervals (f(x) = x on (0,1) has no max) or for discontinuous f (1/x on [−1,1] unbounded). This is proved in the Real Analysis module (Chapter 5).`,
    },
  ],
  definitions: [
    { name: 'Continuity at a', text: 'f(a) defined, lim_{x→a} f(x) exists, and lim_{x→a} f(x) = f(a).' },
    { name: 'Continuity on [a,b]', text: 'Continuous on (a,b), right-continuous at a and left-continuous at b.' },
    { name: 'Removable discontinuity', text: 'lim f exists (finite) but ≠ f(a) or f(a) undefined.' },
    { name: 'Jump discontinuity', text: 'f(a⁻) and f(a⁺) both exist (finite) and differ.' },
    { name: 'Infinite discontinuity', text: 'At least one one-sided limit is ±∞.' },
    { name: 'Intermediate Value Theorem', text: 'f continuous on [a,b], N between f(a) and f(b) ⇒ ∃c∈(a,b): f(c)=N.' },
  ],
  formulas: [
    { name: 'Continuity', f: 'lim_{x→a} f(x) = f(a)' },
    { name: 'Composition', f: 'lim_{x→a} f(g(x)) = f(lim_{x→a} g(x))  (f continuous at lim g)' },
    { name: 'Jump size', f: 'jump = lim_{x→a⁺} f(x) − lim_{x→a⁻} f(x)' },
    { name: 'Bisection error', f: '|c − c_{n}| ≤ \\frac{b − a}{2^{n+1}}' },
    { name: 'Bisection steps for tolerance τ', f: 'n ≥ log₂(\\frac{b − a}{τ})' },
  ],
  examples: [
    {
      title: 'Choosing k to make f continuous',
      problem: 'f(x) = (x² − 9)/(x − 3) for x ≠ 3 and f(3) = k. Find k so that f is continuous at 3.',
      steps: ['Limit: (x−3)(x+3)/(x−3) = x + 3 → 6.', 'Continuity requires f(3) = lim = 6.'],
      answer: 'k = 6 (this repairs the removable discontinuity).',
    },
    {
      title: 'IVT: a root of x³ + x − 1',
      problem: 'Show that x³ + x − 1 = 0 has a solution in (0, 1) and locate it to 0.1.',
      steps: ['f is a polynomial, hence continuous. f(0) = −1 < 0, f(1) = 1 > 0, so a root exists in (0, 1).', 'Midpoint 0.5: f = 0.125 + 0.5 − 1 = −0.375 < 0 → root in (0.5, 1).', 'Midpoint 0.75: f = 0.4219 + 0.75 − 1 = 0.1719 > 0 → root in (0.5, 0.75).', 'Midpoint 0.625: f = 0.2441 + 0.625 − 1 = −0.1309 < 0 → (0.625, 0.75).', 'Midpoint 0.6875: f = 0.325 + 0.6875 − 1 = 0.0125 > 0 → (0.625, 0.6875).'],
      answer: 'The root lies in (0.625, 0.6875) — so it is about 0.68 (true value ≈ 0.6823).',
    },
    {
      title: 'Classifying discontinuities',
      problem: 'Classify the discontinuity of f(x) = (x² − 1)/(x − 1) at 1 and of g(x) = 1/(x − 2) at 2.',
      steps: ['f: limit 2 exists, f(1) undefined → removable.', 'g: one-sided limits are −∞ (left) and +∞ (right) → infinite discontinuity.'],
      answer: 'f has a removable discontinuity (hole at (1, 2)); g has an infinite discontinuity (vertical asymptote x = 2).',
    },
  ],
  graphical: {
    text: `The **continuity analyzer** tests each of the three conditions at a point of your choice, shows the one-sided limits, and classifies the discontinuity using the real limit engine. The **IVT lab** runs bisection step by step and warns if a discontinuity is detected inside [a, b], where the theorem does not apply.`,
    demo: 'lim-continuity',
  },
  applications: [
    { h: 'Root finding in engineering', text: 'Bisection (IVT) is the guaranteed fallback in solvers for implicit equations: beam deflection, pipe flow (Colebrook), equilibrium of circuits with nonlinear elements.' },
    { h: 'Piecewise models and matching conditions', text: 'Stress–strain curves, spline paths and control laws are stitched from pieces; continuity (and one-sided limits) at the junctions are the matching conditions.' },
    { h: 'Sampling and quantisation', text: 'An ideal ADC is a step function with jump discontinuities; the jump size is the quantisation step.' },
  ],
  exercises: [
    { id: 'l4-b1', level: 'Beginner', q: 'Is f(x) = x² + 3x continuous at x = 2?', sol: 'Polynomials are continuous everywhere: **yes**.' },
    { id: 'l4-b2', level: 'Beginner', q: 'Where is f(x) = 1/(x − 4) discontinuous? What type?', sol: 'At x = 4 (undefined). One-sided limits ±∞ ⇒ **infinite discontinuity**.' },
    { id: 'l4-b3', level: 'Beginner', q: 'Name the three conditions for continuity at a.', sol: '(1) f(a) defined; (2) lim_{x→a} f exists; (3) lim = f(a).' },
    { id: 'l4-i1', level: 'Intermediate', q: 'Find k so that f(x) = x + 1 (x < 2), k (x = 2), 3x − 3 (x > 2) is continuous at 2.', sol: 'Left limit 3, right limit 3(2) − 3 = 3; so limit 3. Set **k = 3**.' },
    { id: 'l4-i2', level: 'Intermediate', q: 'Classify f(x) = |x − 1|/(x − 1) at 1.', sol: 'Left limit −1, right limit +1, f(1) undefined: **jump discontinuity** of size 2.' },
    { id: 'l4-i3', level: 'Intermediate', q: 'Show that cos x = x has a solution in (0, 1).', hint: 'Consider g(x) = cos x − x.', sol: 'g is continuous. g(0) = 1 > 0, g(1) = cos 1 − 1 ≈ −0.46 < 0. By the IVT there is c ∈ (0,1) with g(c) = 0.' },
    { id: 'l4-a1', level: 'Advanced', q: 'Find constants a, b so that f(x) = 2 (x ≤ −1), ax + b (−1 < x < 3), −2 (x ≥ 3) is continuous on ℝ.', sol: 'Continuity at −1: −a + b = 2. At 3: 3a + b = −2. Subtract: 4a = −4 ⇒ **a = −1**, then b = 1.' },
    { id: 'l4-a2', level: 'Advanced', q: 'Give an example showing the IVT fails without continuity.', sol: 'f(x) = −1 for x < 0 and f(x) = 1 for x ≥ 0 on [−1, 1]: f takes −1 and 1 but never 0.' },
    { id: 'l4-u1', level: 'University', q: 'Prove: if f is continuous on [a,b] and f(a) < 0 < f(b), then f has a root. (Outline using the supremum.)', hint: 'Let c = sup{x : f(x) < 0 on [a,x]}.', sol: 'Let S = {x ∈ [a,b] : f(t) < 0 ∀t∈[a,x]}; a∈S so S is nonempty, bounded; let c = sup S. If f(c) < 0, continuity gives f < 0 slightly right of c, contradicting sup. If f(c) > 0, f > 0 slightly left of c, so S would stop before c. Hence f(c) = 0. (Full detail in Real Analysis, Chapter 5.)' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'f is continuous at a if', ['f(a) exists', 'lim f exists', 'lim f = f(a)', 'f is differentiable'], 2, 'The limit must exist and equal f(a), which implies f(a) is defined.'),
    mc('q2', 'Beginner', 'Types', 'A hole in the graph is a', ['jump', 'removable discontinuity', 'infinite discontinuity', 'asymptote'], 1, 'Limit exists but f(a) is undefined or different.'),
    mc('q3', 'Intermediate', 'Jump', 'f(x) = ⌊x⌋ at x = 2 has', ['a removable discontinuity', 'a jump discontinuity', 'an infinite discontinuity', 'continuity'], 1, 'Left limit 1, right limit 2.'),
    mc('q4', 'Intermediate', 'IVT', 'The IVT requires f to be', ['differentiable', 'continuous on [a,b]', 'increasing', 'a polynomial'], 1, 'Continuity on the closed interval.'),
    mc('q5', 'Advanced', 'IVT', 'f(x)=1/x, f(−1)<0<f(1). Why no root?', ['f is decreasing', 'f is discontinuous at 0 in [−1,1]', 'IVT is false', 'f(0)=0'], 1, 'Hypothesis of continuity fails at 0.'),
    mc('q6', 'Advanced', 'Bisection', 'Bisection on [0,1] to accuracy 0.001 needs n ≥', ['5', '8', '10', '1000'], 2, 'n ≥ log₂(1/0.001) ≈ 9.97 ⇒ 10 steps.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Rational', 'f(x) = (x+1)/(x−3) is continuous on', ['all ℝ', 'ℝ except x=3', 'ℝ except x=−1', 'x>3 only'], 1, 'Rational functions are continuous except where the denominator is 0.'),
    mc('t2', 'Beginner', 'Fix', '(x²−1)/(x−1) can be made continuous at 1 by defining f(1) =', ['0', '1', '2', '−2'], 2, 'The limit is 2.'),
    mc('t3', 'Beginner', 'Composition', 'sin(x²) is continuous because', ['sin is bounded', 'composition of continuous functions', 'x² is increasing', 'sin(0)=0'], 1, 'Composition rule.'),
    mc('t4', 'Intermediate', 'k', 'f(x)=x² (x<1), k (x=1), 2x−1 (x>1) continuous at 1 iff k =', ['0', '1', '2', 'none'], 1, 'Both one-sided limits equal 1.'),
    mc('t5', 'Intermediate', 'Classify', '1/(x−2)² at 2 has', ['a jump', 'an infinite discontinuity', 'a removable discontinuity', 'no discontinuity'], 1, 'Both one-sided limits are +∞.'),
    mc('t6', 'Intermediate', 'IVT', 'Which guarantees a root in (1,2)?', ['f(1)=2, f(2)=3', 'f continuous, f(1)=−1, f(2)=4', 'f(1)=−1, f(2)=4', 'f continuous, f(1)=1, f(2)=2'], 1, 'Continuity and a sign change.'),
    mc('t7', 'Advanced', 'Essential', 'sin(1/x) at 0 is', ['removable', 'jump', 'infinite', 'essential (oscillatory)'], 3, 'No one-sided limit exists and it is not infinite.'),
    mc('t8', 'Advanced', 'EVT', 'f(x) = x on (0,1) is continuous but has no maximum. This shows', ['IVT is false', 'closed interval needed for extreme values', 'f is discontinuous', 'sup does not exist'], 1, 'Extreme Value Theorem needs [a,b].'),
  ],
};

export const LIMIT_CHAPTERS: ChapterData[] = [L1, L2, L3, L4];
