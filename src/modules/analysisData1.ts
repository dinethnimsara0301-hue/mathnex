import type { ChapterData } from './lesson';
import type { QuizQuestion } from './shared';

type Lv = 'Beginner' | 'Intermediate' | 'Advanced';
const mc = (id: string, level: Lv, category: string, prompt: string, options: string[], correctIndex: number, explanation: string): QuizQuestion => ({
  id, level, category, kind: 'mcq', prompt, options, correctIndex, explanation,
});

/* ═════════════════ CHAPTER 01 — REAL NUMBER SYSTEM ═════════════════ */
const C1: ChapterData = {
  id: 'an-1',
  code: 'CHAPTER 01',
  title: 'The Real Number System',
  blurb: 'Axioms of ℝ, rational vs irrational, absolute value, intervals, open/closed sets and boundedness.',
  objectives: [
    'List the field, order and completeness axioms and say which ones distinguish ℝ from ℚ.',
    'Prove that √2 is irrational and that between any two reals there are rationals and irrationals.',
    'Solve and prove inequalities with absolute values using the triangle inequality.',
    'Classify intervals and sets as open, closed, bounded or unbounded, and find interior points, limit points and closure.',
  ],
  theory: [
    {
      h: 'Why we need a careful definition of ℝ',
      body: `Calculus talks about limits, and limits need numbers to exist "in the gaps". The rationals ℚ have gaps: there is no rational x with x² = 2. Analysis works in ℝ, the **complete ordered field**: the rationals with all gaps filled.

ℝ is characterised by three groups of axioms:

- **Field axioms:** + and × are commutative, associative, distributive, with identities 0 and 1 and inverses (−x, and 1/x for x ≠ 0).
- **Order axioms:** for any x, y exactly one of x < y, x = y, x > y holds; < is transitive; x < y ⇒ x + z < y + z; and x, y > 0 ⇒ xy > 0.
- **Completeness (least upper bound) axiom:** every nonempty set bounded above has a least upper bound (Chapter 2).

ℚ satisfies the first two groups but **not** the third — that is the entire difference.`,
    },
    {
      h: 'Rational and irrational numbers',
      body: `A rational number is p/q with p, q integers, q ≠ 0; an irrational number is a real that is not rational.

**Theorem.** √2 is irrational.
*Proof (contradiction).* Suppose √2 = p/q in lowest terms. Then p² = 2q², so p² is even, hence p is even: p = 2k. Then 4k² = 2q², so q² = 2k², making q even. Both p and q even contradicts "lowest terms". ∎

**Density.** Between any two real numbers a < b there is a rational and an irrational number. (Choose n with 1/n < b − a by the Archimedean property; then some m/n lies in (a, b); and m/n + √2/N for large N is irrational and still inside.)`,
    },
    {
      h: 'Archimedean property',
      body: `For every real x there is a natural number n > x. Equivalently, for every ε > 0 there is n with 1/n < ε.

This innocent-looking fact is what makes 1/n → 0 and is used in almost every ε–N proof. It follows from completeness: if ℕ were bounded above, it would have a least upper bound s, but then s − 1 is not an upper bound, so some n > s − 1 and n + 1 > s, a contradiction.`,
    },
    {
      h: 'Absolute value and the triangle inequality',
      body: `|x| = x if x ≥ 0 and −x if x < 0. Geometrically |x − y| is the distance between x and y.

- |x| < r ⇔ −r < x < r  and  |x − a| < r ⇔ a − r < x < a + r.
- **Triangle inequality:** |x + y| ≤ |x| + |y|.
- **Reverse triangle inequality:** ||x| − |y|| ≤ |x − y|.
- |xy| = |x||y|.

The triangle inequality is the single most used tool in analysis: it lets you control a difference by inserting an intermediate point, |x − z| ≤ |x − y| + |y − z|.`,
    },
    {
      h: 'Intervals',
      body: `Open (a, b), closed [a, b], half-open [a, b) and (a, b], and rays (a, ∞), [a, ∞), (−∞, b), (−∞, b], and ℝ itself.

Bounded intervals have finite length b − a. A subset of ℝ is an interval exactly when it contains every point between any two of its points.`,
    },
    {
      h: 'Open and closed sets; bounded and unbounded sets',
      body: `A point x is an **interior point** of A if some neighbourhood (x − r, x + r) ⊆ A. A is **open** if every point of A is interior.

A point x is a **limit point** of A if every neighbourhood of x contains a point of A other than x. A is **closed** if it contains all its limit points; equivalently, its complement is open. The **closure** Ā is A together with its limit points.

Examples: (0, 1) is open, not closed; [0, 1] is closed, not open; ℝ and ∅ are both open and closed; ℚ has closure ℝ (dense) and no interior points.

A is **bounded** if A ⊆ [−M, M] for some M; otherwise unbounded. In ℝ, a set is **compact** iff it is closed and bounded (Heine–Borel), which is why [a, b] is so well behaved.`,
    },
  ],
  definitions: [
    { name: 'Ordered field', text: 'A set with +, × and < satisfying the field and order axioms (ℚ and ℝ are examples).' },
    { name: 'Interior point', text: 'x with (x − r, x + r) ⊆ A for some r > 0.' },
    { name: 'Open set', text: 'A set all of whose points are interior points.' },
    { name: 'Limit point', text: 'x such that every neighbourhood of x contains a point of A different from x.' },
    { name: 'Closed set', text: 'A set containing all of its limit points (complement open).' },
    { name: 'Bounded set', text: 'A ⊆ [−M, M] for some real M.' },
  ],
  formulas: [
    { name: 'Absolute value inequality', f: '|x − a| < r  ⇔  a − r < x < a + r' },
    { name: 'Triangle inequality', f: '|x + y| ≤ |x| + |y|' },
    { name: 'Reverse triangle', f: '| |x| − |y| | ≤ |x − y|' },
    { name: 'Bernoulli', f: '(1 + x)^{n} ≥ 1 + nx   (x ≥ −1, n ∈ ℕ)' },
    { name: 'Closure', f: 'Ā = A ∪ {limit points of A}' },
  ],
  examples: [
    {
      title: 'Solving an absolute-value inequality',
      problem: 'Solve |2x − 3| < 5 and write the solution set as an interval.',
      steps: ['|2x − 3| < 5 ⇔ −5 < 2x − 3 < 5.', 'Add 3: −2 < 2x < 8.', 'Divide by 2: −1 < x < 4.'],
      answer: 'x ∈ (−1, 4).',
      why: '|u| < r ⇔ −r < u < r, valid for r > 0.',
    },
    {
      title: 'Proving a set is open',
      problem: 'Show that (0, 1) is open.',
      steps: ['Take x ∈ (0, 1). Let r = min(x, 1 − x) > 0.', 'Then (x − r, x + r) ⊆ (0, 1) because x − r ≥ 0 and x + r ≤ 1.', 'So x is an interior point. Since x was arbitrary, (0, 1) is open.'],
      answer: '(0, 1) is open; its closure is [0, 1] (the endpoints are limit points not in the set).',
    },
    {
      title: 'Using the triangle inequality',
      problem: 'If |x − 2| < 1, find a bound for |x² − 4|.',
      steps: ['|x² − 4| = |x − 2||x + 2|.', '|x − 2| < 1 ⇒ 1 < x < 3 ⇒ 3 < x + 2 < 5, so |x + 2| < 5.', 'Therefore |x² − 4| < 5|x − 2|.'],
      answer: '|x² − 4| < 5|x − 2| whenever |x − 2| < 1.',
      why: 'This "bound the extra factor" idea powers ε–δ proofs.',
    },
  ],
  graphical: {
    text: `The **set explorer** shows common subsets of ℝ on the number line. Pick a set to see whether it is open, closed, bounded, its interior, closure, boundary, and its supremum/infimum (Chapter 2). Type a test point to check membership and whether it is an interior point.`,
    demo: 'an-real',
  },
  applications: [
    { h: 'Tolerance intervals in measurement', text: 'A measurement x ± ε is the open interval (x − ε, x + ε). Propagating errors through sums uses the triangle inequality: |Δ(x + y)| ≤ |Δx| + |Δy|.' },
    { h: 'Floating-point numbers are rational', text: 'Computers only store rationals (finite binary fractions). Irrationals like √2 are approximated, which is why numerical analysis relies on density and completeness to guarantee that approximations can be made arbitrarily accurate.' },
    { h: 'Feasible regions in optimisation', text: 'Constraint sets in engineering design are closed and bounded subsets of ℝⁿ; compactness guarantees that a continuous cost function attains a minimum (Chapter 5).' },
  ],
  exercises: [
    { id: 'a1-b1', level: 'Beginner', q: 'Solve |x + 4| ≤ 3.', sol: '−3 ≤ x + 4 ≤ 3 ⇒ −7 ≤ x ≤ −1: **[−7, −1]**.' },
    { id: 'a1-b2', level: 'Beginner', q: 'Is (0, 1] open, closed, both or neither?', sol: '**Neither.** 1 is not an interior point (so not open) and 0 is a limit point not in the set (so not closed).' },
    { id: 'a1-b3', level: 'Beginner', q: 'Is 0.999… (repeating) rational? Express as a fraction.', sol: 'Geometric series: 9/10 + 9/100 + … = (9/10)/(1 − 1/10) = 1. So 0.999… = **1**, a rational number.' },
    { id: 'a1-i1', level: 'Intermediate', q: 'Prove that if a, b ∈ ℝ then |a| − |b| ≤ |a − b|.', hint: 'Write a = (a − b) + b.', sol: '|a| = |(a − b) + b| ≤ |a − b| + |b| by the triangle inequality. Rearranging gives |a| − |b| ≤ |a − b|. ∎' },
    { id: 'a1-i2', level: 'Intermediate', q: 'Find the interior, closure and boundary of A = (0, 1) ∪ {2}.', sol: 'Interior = (0, 1). Closure = [0, 1] ∪ {2}. Boundary = {0, 1, 2}.' },
    { id: 'a1-i3', level: 'Intermediate', q: 'Solve x² − 5x + 6 < 0.', sol: '(x − 2)(x − 3) < 0 ⇒ **2 < x < 3**.' },
    { id: 'a1-a1', level: 'Advanced', q: 'Prove that √3 is irrational.', hint: 'Mimic the √2 proof; use that 3 | p² ⇒ 3 | p.', sol: 'Suppose √3 = p/q in lowest terms: p² = 3q². So 3 | p² and, since 3 is prime, 3 | p, p = 3k. Then 9k² = 3q², q² = 3k², so 3 | q. Contradiction with lowest terms. ∎' },
    { id: 'a1-a2', level: 'Advanced', q: 'Prove that the union of any collection of open sets is open and the intersection of two open sets is open.', sol: 'Union: if x ∈ ∪Aᵢ then x ∈ Aⱼ for some j, which is open, so some (x − r, x + r) ⊆ Aⱼ ⊆ ∪Aᵢ. Intersection: x ∈ A ∩ B gives r₁, r₂ with neighborhoods in A and B; take r = min(r₁, r₂). ∎' },
    { id: 'a1-u1', level: 'University', q: 'Show that infinite intersections of open sets need not be open by finding ∩ₙ (−1/n, 1/n).', sol: 'The intersection is {0}: x ≠ 0 is excluded once 1/n < |x|, and 0 lies in every set. {0} is closed and not open (no neighbourhood of 0 is contained in {0}).' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Rationals', 'Which property does ℝ have but ℚ lacks?', ['commutativity', 'order', 'completeness', 'distributivity'], 2, 'ℚ is an ordered field; only ℝ is complete.'),
    mc('q2', 'Beginner', 'Inequality', '|x − 1| < 2 means', ['−1 < x < 3', '1 < x < 2', '−2 < x < 2', 'x > 3'], 0, '1 − 2 < x < 1 + 2.'),
    mc('q3', 'Intermediate', 'Sets', 'The set [0, 1) is', ['open', 'closed', 'neither', 'both'], 2, '0 is not interior; 1 is a limit point not in the set.'),
    mc('q4', 'Intermediate', 'Density', 'Between any two reals there is', ['only rationals', 'only irrationals', 'both a rational and an irrational', 'nothing guaranteed'], 2, 'ℚ and ℝ∖ℚ are both dense.'),
    mc('q5', 'Advanced', 'Closure', 'The closure of ℚ is', ['ℚ', 'ℝ', '∅', 'ℤ'], 1, 'Every real is a limit of rationals.'),
    mc('q6', 'Advanced', 'Proof', 'The proof that √2 is irrational is by', ['induction', 'contradiction', 'contrapositive on ε', 'construction'], 1, 'Assume rational in lowest terms and derive a contradiction.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Absolute', '|−7| =', ['−7', '7', '0', '49'], 1, 'Distance from 0.'),
    mc('t2', 'Beginner', 'Interval', 'The interval (2, 5] is', ['open', 'closed', 'half-open', 'unbounded'], 2, 'Open on one end, closed on the other.'),
    mc('t3', 'Beginner', 'Bounded', 'Which is unbounded?', ['[0, 1]', '(−5, 5)', '[1, ∞)', '{1, 2, 3}'], 2, 'No upper bound.'),
    mc('t4', 'Intermediate', 'Triangle', '|x + y| ≤ |x| + |y| is called', ['the Archimedean property', 'the triangle inequality', 'completeness', 'Bernoulli'], 1, 'Standard name.'),
    mc('t5', 'Intermediate', 'Open', 'An arbitrary union of open sets is', ['open', 'closed', 'bounded', 'finite'], 0, 'Neighbourhoods persist inside the union.'),
    mc('t6', 'Intermediate', 'Closed', 'The set {1/n : n ∈ ℕ} has which limit point?', ['1', '0', '2', 'none'], 1, '1/n → 0 and 0 is not in the set.'),
    mc('t7', 'Advanced', 'Intersection', '∩ (−1/n, 1/n) over n ∈ ℕ is', ['∅', '{0}', '(−1, 1)', '[−1, 1]'], 1, 'Only 0 lies in every set.'),
    mc('t8', 'Advanced', 'Interior', 'The interior of ℚ is', ['ℚ', '∅', 'ℝ', '{0}'], 1, 'Every interval contains irrationals, so no neighbourhood is inside ℚ.'),
  ],
};

/* ═════════════════ CHAPTER 02 — SUPREMUM & INFIMUM ═════════════════ */
const C2: ChapterData = {
  id: 'an-2',
  code: 'CHAPTER 02',
  title: 'Supremum and Infimum',
  blurb: 'Upper/lower bounds, sup and inf, max and min, the least-upper-bound property and completeness.',
  objectives: [
    'Define upper bound, lower bound, supremum and infimum, and distinguish sup from max.',
    'Use the ε-characterisation sup A = s ⇔ s is an upper bound and ∀ε ∃a ∈ A with a > s − ε.',
    'State the Least Upper Bound Property and derive consequences (Archimedean property, existence of √2).',
    'Compute sup and inf of explicit sets and of sums/scalings of sets.',
  ],
  theory: [
    {
      h: 'Bounds',
      body: `Let A ⊆ ℝ be nonempty. M is an **upper bound** of A if a ≤ M for every a ∈ A. If A has an upper bound it is **bounded above**. Lower bounds are defined analogously.

Upper bounds are never unique: if M is one, so is M + 1. The interesting question is whether there is a **smallest** one.`,
    },
    {
      h: 'Supremum and infimum',
      body: `The **supremum** sup A is the *least* upper bound: s = sup A if (i) s is an upper bound of A, and (ii) any upper bound M satisfies s ≤ M. The **infimum** inf A is the greatest lower bound.

**ε-characterisation.** s = sup A ⇔ (i) a ≤ s for all a ∈ A, and (ii) for every ε > 0 there exists a ∈ A with a > s − ε.
(ii) says "s − ε is not an upper bound, however small ε is".`,
    },
    {
      h: 'Maximum versus supremum',
      body: `The **maximum** max A exists only when sup A ∈ A. For A = (0, 1): sup A = 1 but there is no maximum. For A = [0, 1]: sup A = max A = 1. For A = {1 − 1/n : n ∈ ℕ}: sup A = 1 (not attained), min A = 0 = inf A.

So sup/inf are always the "right" notion; max/min are special cases when the extreme value is attained.`,
    },
    {
      h: 'Least Upper Bound Property (completeness)',
      body: `**Axiom (completeness of ℝ).** Every nonempty subset of ℝ that is bounded above has a supremum in ℝ.

This fails in ℚ: A = {q ∈ ℚ : q² < 2} is bounded above in ℚ (by 2) but has no *rational* least upper bound — its sup "should be" √2.

Equivalent forms: every nonempty set bounded below has an infimum; every bounded monotone sequence converges; nested closed intervals have a common point; Cauchy sequences converge. They are different faces of one idea: ℝ has no gaps.`,
    },
    {
      h: 'Consequences and arithmetic of sup/inf',
      body: `- **Archimedean property** (shown in Chapter 1).
- **Existence of √2:** sup{x : x² < 2} squares to 2.
- If A ⊆ B then sup A ≤ sup B and inf A ≥ inf B.
- sup(A + B) = sup A + sup B, where A + B = {a + b}.
- sup(cA) = c sup A for c > 0; sup(−A) = −inf A.

*Proof of sup(A + B) = sup A + sup B (sketch).* a + b ≤ sup A + sup B shows ≤. For ≥, given ε pick a > sup A − ε/2 and b > sup B − ε/2; then a + b > sup A + sup B − ε. ∎`,
    },
  ],
  definitions: [
    { name: 'Upper bound', text: 'M with a ≤ M for all a ∈ A.' },
    { name: 'Supremum', text: 'The least upper bound of A (sup A).' },
    { name: 'Infimum', text: 'The greatest lower bound of A (inf A).' },
    { name: 'Maximum / minimum', text: 'A supremum / infimum that belongs to the set.' },
    { name: 'Completeness axiom', text: 'Every nonempty set bounded above has a least upper bound in ℝ.' },
  ],
  formulas: [
    { name: 'ε-characterisation of sup', f: 's = sup A ⇔ a ≤ s ∀a∈A  and  ∀ε>0 ∃a∈A: a > s − ε' },
    { name: 'ε-characterisation of inf', f: 'm = inf A ⇔ a ≥ m ∀a∈A  and  ∀ε>0 ∃a∈A: a < m + ε' },
    { name: 'Sum of sets', f: 'sup(A + B) = sup A + sup B,   inf(A + B) = inf A + inf B' },
    { name: 'Negation', f: 'sup(−A) = −inf A' },
  ],
  examples: [
    {
      title: 'sup and inf of {1 − 1/n}',
      problem: 'Find sup and inf of A = {1 − 1/n : n = 1, 2, 3, …}.',
      steps: ['The terms are 0, 1/2, 2/3, 3/4, … increasing, so the smallest is 0: inf A = min A = 0.', 'Every term is < 1, so 1 is an upper bound.', 'Given ε > 0 choose n > 1/ε: then 1 − 1/n > 1 − ε, so no number below 1 is an upper bound.', 'Hence sup A = 1, and it is not attained (no maximum).'],
      answer: 'sup A = 1 (no max), inf A = min A = 0.',
      why: 'The Archimedean property supplies n with 1/n < ε.',
    },
    {
      title: 'Using the ε-characterisation',
      problem: 'Show that if s = sup A, then there is a sequence aₙ ∈ A with aₙ → s.',
      steps: ['For each n choose aₙ ∈ A with s − 1/n < aₙ ≤ s (possible by the ε-characterisation with ε = 1/n).', 'Then |aₙ − s| < 1/n → 0.'],
      answer: 'Such a sequence exists, so the supremum is a limit of elements of A (a limit point or an element).',
    },
    {
      title: 'sup of a set defined by an inequality',
      problem: 'Find sup and inf of A = {x ∈ ℝ : x² + 2x < 3}.',
      steps: ['x² + 2x − 3 < 0 ⇔ (x + 3)(x − 1) < 0 ⇔ −3 < x < 1.', 'So A = (−3, 1): sup A = 1, inf A = −3, neither attained.'],
      answer: 'sup A = 1, inf A = −3; A has no max or min.',
    },
  ],
  graphical: {
    text: `The **supremum tester** takes a sequence formula aₙ (in n), computes the first terms, and tests a candidate supremum s: it checks the upper-bound property for the sampled terms and finds, for a chosen ε, the first term lying inside (s − ε, s]. The plot shows the terms, the line y = s and the ε-strip. (Finite sampling is evidence; the proof is the ε-characterisation.)`,
    demo: 'an-supinf',
  },
  applications: [
    { h: 'Worst-case design (supremum of loads)', text: 'The design load of a bridge is a supremum over all admissible load cases: it must bound every case and be as small as possible — exactly sup A.' },
    { h: 'Norms and signal amplitudes', text: 'The peak amplitude of a signal is sup |x(t)|; the operator norm of a matrix is sup ‖Ax‖/‖x‖. Both are suprema that may or may not be attained.' },
    { h: 'Error bounds in numerical methods', text: 'Truncation error is bounded by sup of a derivative on an interval (Lagrange remainder, Chapter 6); continuity on a closed interval guarantees the sup is attained.' },
  ],
  exercises: [
    { id: 'a2-b1', level: 'Beginner', q: 'Find sup and inf of [2, 7).', sol: 'sup = 7 (not attained), inf = min = 2.' },
    { id: 'a2-b2', level: 'Beginner', q: 'Does A = (0, ∞) have an upper bound? A supremum?', sol: 'No upper bound, so no supremum in ℝ. inf A = 0 (not attained).' },
    { id: 'a2-b3', level: 'Beginner', q: 'Find sup of {1/n : n ∈ ℕ}.', sol: 'The largest term is 1 (n = 1), so sup = max = 1. inf = 0, not attained.' },
    { id: 'a2-i1', level: 'Intermediate', q: 'Let A = {(−1)ⁿ + 1/n : n ∈ ℕ}. Find sup A and inf A.', sol: 'Odd n: −1 + 1/n = 0, −2/3, −4/5, … decreasing toward −1 (never reaching it). Even n: 1 + 1/n = 3/2, 5/4, 7/6, … decreasing toward 1. The largest term is the n = 2 term, so **sup A = max A = 3/2**. No term equals −1 but terms get arbitrarily close, so **inf A = −1 (not attained)**.' },
    { id: 'a2-i2', level: 'Intermediate', q: 'Prove: if A ⊆ B are bounded nonempty sets then sup A ≤ sup B.', sol: 'sup B is an upper bound of B hence of A. Since sup A is the least upper bound of A, sup A ≤ sup B. ∎' },
    { id: 'a2-i3', level: 'Intermediate', q: 'Find sup{x ∈ ℚ : x² < 2} in ℝ and explain why it is not in ℚ.', sol: 'The sup is √2 (in ℝ), which is irrational; hence the set has no supremum within ℚ — this shows ℚ is not complete.' },
    { id: 'a2-a1', level: 'Advanced', q: 'Prove that for nonempty bounded A, B: sup(A + B) = sup A + sup B.', hint: 'Use ε/2.', sol: '≤: a + b ≤ sup A + sup B for all a, b. ≥: given ε pick a > sup A − ε/2, b > sup B − ε/2; then a + b > sup A + sup B − ε, so sup A + sup B − ε is not an upper bound of A + B for any ε. ∎' },
    { id: 'a2-a2', level: 'Advanced', q: 'Prove sup(−A) = −inf A.', sol: 'm = inf A satisfies a ≥ m for all a ⇒ −a ≤ −m, so −m is an upper bound of −A. If M is any upper bound of −A then −M is a lower bound of A so −M ≤ m ⇒ −m ≤ M. Hence −m is the least upper bound. ∎' },
    { id: 'a2-u1', level: 'University', q: 'Use the Least Upper Bound Property to prove the Archimedean property.', sol: 'Suppose ℕ is bounded above. Let s = sup ℕ. Then s − 1 is not an upper bound, so some n ∈ ℕ has n > s − 1, giving n + 1 > s with n + 1 ∈ ℕ — contradicting that s is an upper bound. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'The supremum of a set is its', ['largest element', 'least upper bound', 'average', 'closure'], 1, 'Least upper bound.'),
    mc('q2', 'Beginner', 'Sup vs max', 'sup(0, 1) =', ['0', '1', 'does not exist', '1/2'], 1, 'sup is 1 but no maximum exists.'),
    mc('q3', 'Intermediate', 'ε', 'If s = sup A and ε > 0, then', ['s − ε is an upper bound', 's − ε is not an upper bound', 's + ε ∈ A', 'A is finite'], 1, 'Some element exceeds s − ε.'),
    mc('q4', 'Intermediate', 'ℚ', 'Why does {q ∈ ℚ : q² < 2} have no sup in ℚ?', ['it is unbounded', 'its sup would be √2 ∉ ℚ', 'it is empty', 'ℚ is finite'], 1, 'ℚ lacks completeness.'),
    mc('q5', 'Advanced', 'Arithmetic', 'sup(A + B) =', ['sup A · sup B', 'sup A + sup B', 'max(sup A, sup B)', 'sup A − sup B'], 1, 'Standard result.'),
    mc('q6', 'Advanced', 'Negation', 'sup(−A) =', ['−sup A', '−inf A', 'inf A', '1/sup A'], 1, 'Negating flips order.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Bounds', 'Upper bounds of [0, 1] include', ['1 only', 'any number ≥ 1', 'any number ≤ 1', '0.5'], 1, 'Any M ≥ 1.'),
    mc('t2', 'Beginner', 'inf', 'inf{1/n} =', ['1', '0', '−1', 'does not exist'], 1, 'Terms tend to 0 but never reach it.'),
    mc('t3', 'Beginner', 'Max', 'max [0, 1) =', ['0', '1', 'does not exist', '0.99'], 2, 'sup is 1 but not in the set.'),
    mc('t4', 'Intermediate', 'Set', 'sup{x : x² < 4} =', ['2', '−2', '4', '0'], 0, 'The set is (−2, 2).'),
    mc('t5', 'Intermediate', 'Completeness', 'LUB property says every nonempty set bounded above has', ['a maximum', 'a supremum', 'a minimum', 'an infimum equal to its sup'], 1, 'A supremum in ℝ.'),
    mc('t6', 'Intermediate', 'Monotone', 'A ⊆ B implies', ['sup A ≥ sup B', 'sup A ≤ sup B', 'sup A = sup B', 'no relation'], 1, 'Larger set, larger sup.'),
    mc('t7', 'Advanced', 'Scaling', 'For c > 0, sup(cA) =', ['c + sup A', 'c · sup A', 'sup A / c', 'sup A'], 1, 'Positive scaling preserves order.'),
    mc('t8', 'Advanced', 'Archimedean', 'The Archimedean property follows from', ['field axioms only', 'order axioms only', 'completeness', 'density of ℚ'], 2, 'If ℕ were bounded, its supremum would give a contradiction.'),
  ],
};

/* ═════════════════ CHAPTER 03 — SEQUENCES ═════════════════ */
const C3: ChapterData = {
  id: 'an-3',
  code: 'CHAPTER 03',
  title: 'Sequences',
  blurb: 'Convergence (ε–N), divergence, boundedness, monotone sequences, subsequences, Cauchy sequences and Bolzano–Weierstrass.',
  objectives: [
    'State and use the ε–N definition of convergence; prove limits of simple sequences with an explicit N(ε).',
    'Prove that convergent sequences are bounded and limits are unique; apply the limit laws.',
    'Apply the Monotone Convergence Theorem and analyse recursively defined sequences.',
    'Define Cauchy sequences, prove they are bounded, and state that in ℝ Cauchy ⇔ convergent.',
    'State and apply the Bolzano–Weierstrass Theorem.',
  ],
  theory: [
    {
      h: 'Sequences and convergence',
      body: `A sequence is a function ℕ → ℝ, written (aₙ). It **converges** to L, written aₙ → L, if

**∀ε > 0 ∃N ∈ ℕ such that n ≥ N ⇒ |aₙ − L| < ε.**

Meaning: eventually (for all large n) the terms stay inside every tolerance band around L. The N depends on ε — smaller ε demands larger N. A sequence that does not converge **diverges**; it may tend to ±∞ or oscillate.

*Proof template.* To show 1/n → 0: given ε, choose N > 1/ε (Archimedean). For n ≥ N, |1/n − 0| = 1/n ≤ 1/N < ε.`,
    },
    {
      h: 'Basic theorems',
      body: `- **Uniqueness:** a convergent sequence has exactly one limit.
- **Boundedness:** every convergent sequence is bounded (eventually within 1 of L, and finitely many other terms are bounded). The converse is false: (−1)ⁿ is bounded but diverges.
- **Limit laws:** if aₙ → a and bₙ → b then aₙ ± bₙ → a ± b, aₙbₙ → ab, aₙ/bₙ → a/b (b ≠ 0, bₙ ≠ 0), cₐₙ → ca.
- **Order and squeeze:** aₙ ≤ bₙ ⇒ a ≤ b; if aₙ ≤ cₙ ≤ bₙ and aₙ, bₙ → L then cₙ → L.`,
    },
    {
      h: 'Divergent sequences',
      body: `A sequence **diverges to +∞** if ∀M ∃N: n ≥ N ⇒ aₙ > M. A sequence can also diverge by oscillation, like (−1)ⁿ or sin n.

To prove divergence: exhibit two subsequences with different limits (e.g., a₂ₙ → 1 and a₂ₙ₊₁ → −1 for (−1)ⁿ), or show the sequence is unbounded.`,
    },
    {
      h: 'Monotone sequences',
      body: `(aₙ) is **increasing** if aₙ ≤ aₙ₊₁ for all n (decreasing if ≥); **monotone** if either.

**Monotone Convergence Theorem.** A monotone sequence converges ⇔ it is bounded. *Proof (increasing case):* let L = sup{aₙ}. Given ε, L − ε is not an upper bound, so some a_N > L − ε; monotonicity gives L − ε < aₙ ≤ L for n ≥ N. ∎

This is the workhorse for sequences defined recursively. Example: a₁ = √2, aₙ₊₁ = √(2 + aₙ). By induction aₙ < 2 and aₙ increases, so aₙ → L with L = √(2 + L), i.e. L = 2.`,
    },
    {
      h: 'Subsequences',
      body: `A subsequence is (a_{nₖ}) with n₁ < n₂ < … . If aₙ → L then every subsequence → L. Contrapositive: two subsequences with different limits ⇒ divergence.

A **subsequential limit** (cluster point) is the limit of some subsequence.`,
    },
    {
      h: 'Cauchy sequences and completeness',
      body: `(aₙ) is **Cauchy** if ∀ε ∃N: m, n ≥ N ⇒ |aₘ − aₙ| < ε — the terms get close to **each other**, with no limit mentioned.

Convergent ⇒ Cauchy (triangle inequality: |aₘ − aₙ| ≤ |aₘ − L| + |L − aₙ| < ε). In ℝ the converse holds, and it is equivalent to completeness. In ℚ it fails: decimal approximations of √2 are Cauchy but have no limit in ℚ.

Cauchy sequences are bounded.`,
    },
    {
      h: 'Bolzano–Weierstrass Theorem',
      body: `**Every bounded sequence in ℝ has a convergent subsequence.**

*Proof idea.* Every sequence has a monotone subsequence (call n a "peak" if aₙ ≥ aₘ for all m > n: infinitely many peaks give a decreasing subsequence; finitely many give an increasing one beyond the last peak). A bounded monotone subsequence converges by the Monotone Convergence Theorem. ∎

Consequences: continuous functions on [a, b] are bounded and attain extrema (Chapter 5).`,
    },
  ],
  definitions: [
    { name: 'Convergence (ε–N)', text: 'aₙ → L ⇔ ∀ε>0 ∃N: n ≥ N ⇒ |aₙ − L| < ε.' },
    { name: 'Divergence to ∞', text: '∀M ∃N: n ≥ N ⇒ aₙ > M.' },
    { name: 'Bounded sequence', text: '∃M: |aₙ| ≤ M for all n.' },
    { name: 'Monotone sequence', text: 'Increasing (aₙ ≤ aₙ₊₁) or decreasing for all n.' },
    { name: 'Cauchy sequence', text: '∀ε ∃N: m, n ≥ N ⇒ |aₘ − aₙ| < ε.' },
    { name: 'Subsequence', text: '(a_{nₖ}) with n₁ < n₂ < …' },
  ],
  formulas: [
    { name: 'Standard limits', f: '\\frac{1}{n} → 0,   rⁿ → 0 (|r|<1),   n^{1/n} → 1,   (1 + \\frac{1}{n})ⁿ → e' },
    { name: 'Growth hierarchy', f: 'ln n ≪ n^{p} ≪ aⁿ ≪ n!   (p>0, a>1)' },
    { name: 'Cauchy condition', f: '∀ε ∃N: m, n ≥ N ⇒ |aₘ − aₙ| < ε' },
    { name: 'Monotone convergence', f: 'aₙ increasing, aₙ ≤ M  ⇒  aₙ → sup aₙ' },
  ],
  examples: [
    {
      title: 'ε–N proof for (3n + 1)/(n + 2) → 3',
      problem: 'Prove that (3n + 1)/(n + 2) → 3 and find N for ε = 0.01.',
      steps: ['|(3n+1)/(n+2) − 3| = |(3n + 1 − 3n − 6)/(n+2)| = 5/(n+2) < 5/n.', 'We need 5/n < ε, i.e. n > 5/ε.', 'Choose N > 5/ε. For n ≥ N the difference is < 5/N < ε. ∎', 'For ε = 0.01: N = 501 works (n > 500).'],
      answer: 'Limit 3; N(ε) = ⌈5/ε⌉ + 1.',
      why: 'We simplify |aₙ − L| to a decreasing expression in n that we can make smaller than ε.',
    },
    {
      title: 'A recursive sequence',
      problem: 'a₁ = 1, aₙ₊₁ = (aₙ + 2/aₙ)/2 (Newton for √2). Show it converges and find the limit.',
      steps: ['By AM–GM, aₙ₊₁ ≥ √2 for n ≥ 1, so (aₙ) is bounded below by √2 from n = 2.', 'aₙ₊₁ − aₙ = (2 − aₙ²)/(2aₙ) ≤ 0 for aₙ ≥ √2: decreasing.', 'Monotone Convergence ⇒ aₙ → L, L ≥ √2.', 'Take limits in the recursion: L = (L + 2/L)/2 ⇒ L² = 2.'],
      answer: 'aₙ → √2 (Newton’s method converges quadratically).',
    },
    {
      title: 'Divergence via subsequences',
      problem: 'Show aₙ = (−1)ⁿ + 1/n diverges.',
      steps: ['a₂ₖ = 1 + 1/(2k) → 1.', 'a₂ₖ₊₁ = −1 + 1/(2k+1) → −1.', 'Two subsequences with different limits ⇒ the sequence diverges.'],
      answer: 'The sequence diverges (it is bounded — an example of Bolzano–Weierstrass: it has convergent subsequences with limits ±1).',
    },
  ],
  graphical: {
    text: `The **sequence explorer** plots (aₙ) for a formula in n. The limit is found **symbolically** with the MATHNEX limit engine (when supported). Choose ε: the plot shows the band L ± ε and the least N such that all computed terms beyond N lie in it. It also tests boundedness, monotonicity and the Cauchy condition on the computed terms (numerical evidence).`,
    demo: 'an-seq',
  },
  applications: [
    { h: 'Iterative solvers', text: 'Newton, Jacobi and fixed-point iterations produce sequences; convergence theorems (monotone, Cauchy) decide whether the algorithm works and how many iterations (N) guarantee a tolerance ε.' },
    { h: 'Discrete-time signals and filters', text: 'A recursive filter yₙ₊₁ = a yₙ + b xₙ has bounded outputs iff |a| < 1; the impulse response rⁿ → 0 is precisely the standard limit.' },
    { h: 'Convergence of numerical integration', text: 'Riemann sums Rₙ are a sequence converging to ∫f; error estimates give the N needed for a given accuracy.' },
  ],
  exercises: [
    { id: 'a3-b1', level: 'Beginner', q: 'Find lim (2n² + 1)/(n² + 3).', sol: 'Divide by n²: (2 + 1/n²)/(1 + 3/n²) → **2**.' },
    { id: 'a3-b2', level: 'Beginner', q: 'Does (−1)ⁿ converge? Is it bounded?', sol: 'Bounded (|aₙ| ≤ 1) but **diverges** (subsequences → 1 and −1).' },
    { id: 'a3-b3', level: 'Beginner', q: 'Give N so that |1/n² − 0| < 0.001 for n ≥ N.', sol: '1/n² < 0.001 ⇔ n > √1000 ≈ 31.6. **N = 32**.' },
    { id: 'a3-i1', level: 'Intermediate', q: 'Prove from the definition that rⁿ → 0 for 0 < r < 1.', hint: 'Write r = 1/(1 + h) and use Bernoulli.', sol: 'r = 1/(1+h), h > 0. (1+h)ⁿ ≥ 1 + nh > nh, so 0 < rⁿ < 1/(nh) < ε when n > 1/(hε). ∎' },
    { id: 'a3-i2', level: 'Intermediate', q: 'Show a₁ = 1, aₙ₊₁ = √(2 + aₙ) converges and find its limit.', sol: 'Induction: 1 ≤ aₙ < 2 and aₙ₊₁ > aₙ (since aₙ₊₁² − aₙ² = 2 + aₙ − aₙ² = (2 − aₙ)(1 + aₙ) > 0). Monotone and bounded ⇒ converges to L with L = √(2+L), L ≥ 1 ⇒ L² − L − 2 = 0 ⇒ **L = 2**.' },
    { id: 'a3-i3', level: 'Intermediate', q: 'Is aₙ = n/(n+1) increasing? Bounded? Limit?', sol: 'aₙ₊₁ − aₙ = 1/((n+1)(n+2)) > 0: increasing; bounded by 1; limit **1**.' },
    { id: 'a3-a1', level: 'Advanced', q: 'Prove that every convergent sequence is Cauchy.', sol: 'Let aₙ → L, ε > 0. Choose N with |aₙ − L| < ε/2 for n ≥ N. For m, n ≥ N: |aₘ − aₙ| ≤ |aₘ − L| + |L − aₙ| < ε/2 + ε/2 = ε. ∎' },
    { id: 'a3-a2', level: 'Advanced', q: 'Show aₙ = 1 + 1/2 + … + 1/n is not Cauchy (hence diverges).', hint: 'Look at a₂ₙ − aₙ.', sol: 'a₂ₙ − aₙ = 1/(n+1) + … + 1/(2n) ≥ n·(1/2n) = 1/2 for all n. So for ε = 1/2 no N works; not Cauchy, hence divergent.' },
    { id: 'a3-u1', level: 'University', q: 'Prove that a Cauchy sequence is bounded and use Bolzano–Weierstrass to show it converges.', sol: 'Take ε = 1: for n ≥ N, |aₙ − a_N| < 1, so |aₙ| ≤ |a_N| + 1; finitely many earlier terms are bounded; hence bounded. By B–W a subsequence a_{nₖ} → L. Given ε choose N₁ with Cauchy ε/2 and k with n_k ≥ N₁, |a_{nₖ} − L| < ε/2: then |aₙ − L| ≤ |aₙ − a_{nₖ}| + |a_{nₖ} − L| < ε for n ≥ N₁. ∎' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'Definition', 'aₙ → L means for every ε there is N with', ['|aₙ − L| < ε for all n', '|aₙ − L| < ε for n ≥ N', 'aₙ = L for n ≥ N', 'aₙ < L for n ≥ N'], 1, 'Eventually the terms stay within ε of L.'),
    mc('q2', 'Beginner', 'Standard', 'lim (1 + 1/n)ⁿ =', ['1', '0', 'e', '∞'], 2, 'Definition of e.'),
    mc('q3', 'Intermediate', 'Bounded', 'Which is true?', ['bounded ⇒ convergent', 'convergent ⇒ bounded', 'monotone ⇒ convergent', 'Cauchy ⇒ divergent'], 1, '(−1)ⁿ is bounded but diverges; monotone also needs boundedness.'),
    mc('q4', 'Intermediate', 'MCT', 'A monotone sequence converges iff it is', ['bounded', 'positive', 'rational', 'Cauchy-free'], 0, 'Monotone Convergence Theorem.'),
    mc('q5', 'Advanced', 'Cauchy', 'In ℚ, the decimal approximations of √2 form a Cauchy sequence that', ['converges in ℚ', 'does not converge in ℚ', 'is unbounded', 'is not Cauchy'], 1, 'Its limit √2 is not rational — ℚ is incomplete.'),
    mc('q6', 'Advanced', 'B–W', 'Bolzano–Weierstrass states every bounded sequence has', ['a limit', 'a convergent subsequence', 'a maximum', 'a Cauchy subsequence that diverges'], 1, 'A convergent subsequence.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Limit', 'lim (4n + 1)/(2n + 5) =', ['2', '4', '1/5', '∞'], 0, '4/2.'),
    mc('t2', 'Beginner', 'Geometric', 'lim (1/2)ⁿ =', ['1', '0', '2', 'does not exist'], 1, '|r| < 1.'),
    mc('t3', 'Beginner', 'Divergence', 'aₙ = n² is', ['convergent', 'bounded', 'divergent to ∞', 'oscillating'], 2, 'Grows without bound.'),
    mc('t4', 'Intermediate', 'Subsequence', 'If aₙ → 3, then a₂ₙ →', ['3', '6', '0', 'unknown'], 0, 'Subsequences share the limit.'),
    mc('t5', 'Intermediate', 'Uniqueness', 'A sequence can have', ['two limits', 'exactly one limit if it converges', 'no limit but be Cauchy in ℝ', 'infinitely many limits'], 1, 'Limits are unique; in ℝ Cauchy ⇔ convergent.'),
    mc('t6', 'Intermediate', 'Recursive', 'a₁ = 1, aₙ₊₁ = aₙ/2 + 1 converges to', ['1', '2', '3', '0'], 1, 'L = L/2 + 1 ⇒ L = 2.'),
    mc('t7', 'Advanced', 'Harmonic', 'Hₙ = 1 + 1/2 + … + 1/n is', ['convergent', 'Cauchy', 'divergent to ∞', 'bounded'], 2, 'H₂ₙ − Hₙ ≥ 1/2 — not Cauchy.'),
    mc('t8', 'Advanced', 'B–W', '(sin n) is bounded so by Bolzano–Weierstrass it has', ['no limit', 'a convergent subsequence', 'a limit', 'a maximum term'], 1, 'Bounded sequences have convergent subsequences (the sequence itself diverges).'),
  ],
};

/* ═════════════════ CHAPTER 04 — SERIES ═════════════════ */
const C4: ChapterData = {
  id: 'an-4',
  code: 'CHAPTER 04',
  title: 'Infinite Series',
  blurb: 'Partial sums, geometric and harmonic series, comparison, ratio, root and alternating tests, absolute vs conditional convergence.',
  objectives: [
    'Define convergence of Σaₙ through partial sums and apply the nth-term test.',
    'Sum geometric and telescoping series exactly; prove divergence of the harmonic series.',
    'Apply comparison, limit comparison, ratio, root and alternating-series tests and know when each is inconclusive.',
    'Distinguish absolute from conditional convergence and state consequences (rearrangement).',
  ],
  theory: [
    {
      h: 'Series as limits of partial sums',
      body: `The series Σ_{n=1}^∞ aₙ **converges** to S if its partial sums Sₙ = a₁ + … + aₙ converge to S. Otherwise it diverges. Everything about series is the theory of the sequence (Sₙ), so Chapter 3 applies.

**nth-term (divergence) test.** If Σaₙ converges then aₙ → 0. Hence if aₙ does **not** → 0 the series diverges. The converse is false: 1/n → 0 yet Σ1/n diverges.`,
    },
    {
      h: 'Geometric and telescoping series',
      body: `**Geometric:** Σ_{n=0}^∞ rⁿ = 1/(1 − r) for |r| < 1, diverges for |r| ≥ 1. Proof: Sₙ = (1 − rⁿ⁺¹)/(1 − r) and rⁿ⁺¹ → 0.

**Telescoping:** Σ 1/(n(n+1)) = Σ (1/n − 1/(n+1)), so Sₙ = 1 − 1/(n+1) → 1.

**Harmonic series** Σ1/n diverges: the block 1/(2ᵏ+1) + … + 1/2ᵏ⁺¹ has 2ᵏ terms, each ≥ 1/2ᵏ⁺¹, so it is ≥ 1/2. Hence S_{2ᵏ} ≥ 1 + k/2 → ∞ (logarithmic growth).

**p-series** Σ1/nᵖ converges ⇔ p > 1 (integral test: ∫₁^∞ x^{−p} dx).`,
    },
    {
      h: 'Comparison tests',
      body: `**Direct comparison.** If 0 ≤ aₙ ≤ bₙ: Σbₙ converges ⇒ Σaₙ converges; Σaₙ diverges ⇒ Σbₙ diverges.

**Limit comparison.** If aₙ, bₙ > 0 and aₙ/bₙ → c with 0 < c < ∞ then Σaₙ and Σbₙ converge or diverge together.

Example: Σ (n + 1)/(n³ + 2) behaves like Σ1/n² (ratio → 1), so converges.`,
    },
    {
      h: 'Ratio test and root test',
      body: `**Ratio test.** Let L = lim |aₙ₊₁/aₙ|. If L < 1 the series converges absolutely; if L > 1 it diverges; if L = 1 the test is **inconclusive**.

**Root test.** Let L = lim |aₙ|^{1/n}. Same conclusions (L < 1 converge, L > 1 diverge, L = 1 inconclusive).

*Why it works:* L < 1 means eventually |aₙ| ≤ rⁿ for some r < 1 — comparison with a geometric series.

Both tests are inconclusive for Σ1/n and Σ1/n², where L = 1 yet behaviour differs. They excel with factorials and nth powers: Σ n!/nⁿ has ratio (n/(n+1))ⁿ → 1/e < 1.`,
    },
    {
      h: 'Alternating series',
      body: `**Alternating Series Test (Leibniz).** If bₙ ≥ 0, bₙ decreasing and bₙ → 0 then Σ(−1)ⁿ⁺¹bₙ converges. The error after n terms satisfies |S − Sₙ| ≤ bₙ₊₁.

Example: 1 − 1/2 + 1/3 − … = ln 2.`,
    },
    {
      h: 'Absolute and conditional convergence',
      body: `Σaₙ **converges absolutely** if Σ|aₙ| converges; absolute convergence ⇒ convergence. It **converges conditionally** if Σaₙ converges but Σ|aₙ| diverges (alternating harmonic).

Absolutely convergent series can be rearranged and regrouped without changing the sum. **Riemann rearrangement theorem:** a conditionally convergent series can be rearranged to converge to any real number (or diverge) — infinite sums are not always commutative.`,
    },
  ],
  definitions: [
    { name: 'Partial sum', text: 'Sₙ = a₁ + a₂ + … + aₙ.' },
    { name: 'Convergent series', text: 'Σaₙ = S ⇔ Sₙ → S.' },
    { name: 'Absolute convergence', text: 'Σ|aₙ| converges.' },
    { name: 'Conditional convergence', text: 'Σaₙ converges but Σ|aₙ| diverges.' },
    { name: 'p-series', text: 'Σ 1/nᵖ — converges iff p > 1.' },
  ],
  formulas: [
    { name: 'Geometric series', f: 'Σ_{n=0}^{∞} a rⁿ = \\frac{a}{1 − r},   |r| < 1' },
    { name: 'Partial geometric sum', f: 'Sₙ = a \\frac{1 − rⁿ}{1 − r}' },
    { name: 'Ratio test', f: 'L = lim |\\frac{aₙ₊₁}{aₙ}|:  L<1 converge,  L>1 diverge,  L=1 inconclusive' },
    { name: 'Root test', f: 'L = lim |aₙ|^{1/n}' },
    { name: 'Alternating error bound', f: '|S − Sₙ| ≤ bₙ₊₁' },
    { name: 'Telescoping', f: 'Σ (bₙ − bₙ₊₁) = b₁ − lim bₙ' },
  ],
  examples: [
    {
      title: 'Geometric series sum',
      problem: 'Find Σ_{n=0}^∞ 3(2/5)ⁿ.',
      steps: ['First term a = 3, ratio r = 2/5, |r| < 1.', 'Sum = a/(1 − r) = 3/(3/5) = 5.'],
      answer: '5',
    },
    {
      title: 'Ratio test',
      problem: 'Decide convergence of Σ 2ⁿ/n! and of Σ n!/nⁿ.',
      steps: ['For 2ⁿ/n!: aₙ₊₁/aₙ = 2/(n+1) → 0 < 1, so it converges (absolutely).', 'For n!/nⁿ: aₙ₊₁/aₙ = (n/(n+1))ⁿ = 1/(1+1/n)ⁿ → 1/e < 1, so converges.'],
      answer: 'Both converge.',
      why: 'Ratios below 1 give eventual geometric domination.',
    },
    {
      title: 'Conditional convergence',
      problem: 'Classify Σ (−1)ⁿ⁺¹/n.',
      steps: ['bₙ = 1/n is decreasing and → 0, so the series converges (alternating test).', 'Σ|aₙ| = Σ1/n diverges.'],
      answer: 'Conditionally convergent (sum = ln 2).',
    },
  ],
  graphical: {
    text: `The **series lab** plots partial sums Sₙ of Σaₙ for a formula in n. It computes the ratio-test limit **symbolically** (a(n+1)/a(n) is formed as an exact expression and passed to the limit engine) and the root-test limit, tests the nth-term condition, and compares with a geometric/p-series. When the ratio limit is 1 it reports "inconclusive" instead of guessing.`,
    demo: 'an-series',
  },
  applications: [
    { h: 'Fourier series and signals', text: 'Periodic signals are represented as infinite series of sinusoids; convergence tests tell when a truncated series approximates the signal and how fast.' },
    { h: 'Geometric series in finance and decay', text: 'Present value of a perpetuity, the total energy of a decaying oscillation and the settling of a discrete system all sum a geometric series.' },
    { h: 'Taylor series in numerical computing', text: 'sin, cos, eˣ in calculators are evaluated from truncated series; the alternating-series bound gives guaranteed error control.' },
  ],
  exercises: [
    { id: 'a4-b1', level: 'Beginner', q: 'Sum Σ_{n=1}^∞ (1/3)ⁿ.', sol: 'a = 1/3, r = 1/3: (1/3)/(1 − 1/3) = **1/2**.' },
    { id: 'a4-b2', level: 'Beginner', q: 'Does Σ n/(n + 1) converge?', sol: 'n/(n+1) → 1 ≠ 0, so by the nth-term test it **diverges**.' },
    { id: 'a4-b3', level: 'Beginner', q: 'Does Σ 1/n^{1.5} converge?', sol: 'p-series with p = 1.5 > 1: **converges**.' },
    { id: 'a4-i1', level: 'Intermediate', q: 'Test Σ n²/3ⁿ.', sol: 'Ratio: (n+1)²/(3n²) → 1/3 < 1: **converges**.' },
    { id: 'a4-i2', level: 'Intermediate', q: 'Decide Σ (n + 2)/(n³ + n).', sol: 'Compare with 1/n²: ratio → 1, so by limit comparison **converges**.' },
    { id: 'a4-i3', level: 'Intermediate', q: 'Find Σ_{n=1}^∞ 1/(n(n+2)).', hint: 'Partial fractions: 1/(n(n+2)) = ½(1/n − 1/(n+2)).', sol: 'Telescoping: Sₙ = ½(1 + 1/2 − 1/(n+1) − 1/(n+2)) → **3/4**.' },
    { id: 'a4-a1', level: 'Advanced', q: 'Use the root test on Σ ((2n + 1)/(3n + 2))ⁿ.', sol: '|aₙ|^{1/n} = (2n+1)/(3n+2) → 2/3 < 1: **converges**.' },
    { id: 'a4-a2', level: 'Advanced', q: 'Show Σ sin(n)/n² converges absolutely.', sol: '|sin n/n²| ≤ 1/n² and Σ1/n² converges; by comparison Σ|aₙ| converges, so the series converges absolutely.' },
    { id: 'a4-u1', level: 'University', q: 'Prove the harmonic series diverges and the alternating harmonic series converges conditionally (outline).', sol: 'Divergence: S_{2ᵏ} ≥ 1 + k/2 (group 2^{j−1} terms each ≥ 1/2ʲ giving ≥ 1/2 per block). Alternating: bₙ = 1/n is decreasing → 0; the alternating series test gives convergence; absolute series is harmonic, divergent ⇒ conditional.' },
  ],
  quiz: [
    mc('q1', 'Beginner', 'nth term', 'If aₙ does not tend to 0 then Σaₙ', ['converges', 'diverges', 'may converge', 'is geometric'], 1, 'Divergence (nth-term) test.'),
    mc('q2', 'Beginner', 'Geometric', 'Σ_{n=0}^∞ (1/2)ⁿ =', ['1', '2', '∞', '1/2'], 1, '1/(1 − 1/2) = 2.'),
    mc('q3', 'Intermediate', 'p-series', 'Σ 1/nᵖ converges iff', ['p > 0', 'p ≥ 1', 'p > 1', 'p < 1'], 2, 'Integral test.'),
    mc('q4', 'Intermediate', 'Ratio', 'If L = lim|aₙ₊₁/aₙ| = 1 the ratio test', ['says convergent', 'says divergent', 'is inconclusive', 'says conditionally convergent'], 2, 'Both 1/n and 1/n² give L = 1.'),
    mc('q5', 'Advanced', 'Conditional', 'Σ(−1)ⁿ⁺¹/n is', ['absolutely convergent', 'conditionally convergent', 'divergent', 'geometric'], 1, 'Converges, but Σ1/n diverges.'),
    mc('q6', 'Advanced', 'Rearrangement', 'Rearranging a conditionally convergent series can', ['never change the sum', 'change the sum arbitrarily', 'only make it diverge', 'only change its sign'], 1, 'Riemann rearrangement theorem.'),
  ],
  test: [
    mc('t1', 'Beginner', 'Geometric', 'Σ_{n=1}^∞ (1/10)ⁿ =', ['1/9', '1/10', '1', '10/9'], 0, '(1/10)/(1 − 1/10) = 1/9.'),
    mc('t2', 'Beginner', 'Harmonic', 'Σ 1/n is', ['convergent', 'divergent', 'conditionally convergent', 'geometric'], 1, 'Harmonic series diverges.'),
    mc('t3', 'Beginner', 'p-series', 'Σ 1/n² is', ['convergent', 'divergent', 'alternating', 'telescoping only'], 0, 'p = 2 > 1.'),
    mc('t4', 'Intermediate', 'Ratio', 'Ratio test on Σ 3ⁿ/n! gives L =', ['3', '0', '1', '∞'], 1, '3/(n+1) → 0.'),
    mc('t5', 'Intermediate', 'Comparison', 'Σ 1/(n² + 1) converges by comparison with', ['Σ 1/n', 'Σ 1/n²', 'Σ 1', 'Σ n'], 1, '0 < 1/(n²+1) < 1/n².'),
    mc('t6', 'Intermediate', 'Alternating', 'The error after n terms of an alternating series is at most', ['bₙ', 'bₙ₊₁', '2bₙ', '0'], 1, 'First omitted term.'),
    mc('t7', 'Advanced', 'Root', 'Root test on Σ (n/(2n+1))ⁿ gives L =', ['2', '1/2', '1', '0'], 1, 'n/(2n+1) → 1/2.'),
    mc('t8', 'Advanced', 'Absolute', 'Absolute convergence implies', ['convergence', 'divergence', 'geometric form', 'alternating signs'], 0, 'Σ|aₙ| < ∞ ⇒ Σaₙ converges.'),
  ],
};

export const ANALYSIS_CHAPTERS_1: ChapterData[] = [C1, C2, C3, C4];
