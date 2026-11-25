/* Interactive demos for the Real Analysis module. Everything is computed locally and offline. */
import { esc } from './shared';
import { mountGraph, type GScene } from './gview';
import { formalProof } from './limits';
import {
  compileFn,
  deltaForEpsilon,
  derivFn,
  derivNodeText,
  evalExactAt,
  nodeText,
  parseNodeText,
  qToString,
  seriesTests,
  sequenceLimit,
  parsePoint,
  type LimitResult,
} from './limitsEngine';

const num = (v: number, p = 8): string => (Number.isFinite(v) ? String(Number(v.toPrecision(p))) : Number.isNaN(v) ? 'undefined' : v > 0 ? '+∞' : '−∞');
function mk(tag: string, cls = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
const field = (label: string, inner: string) => `<label class="field">${label}${inner}</label>`;
const qs = <T extends HTMLElement>(root: HTMLElement, k: string) => root.querySelector<T>(`[data-k="${k}"]`) as T;
const warn = (m: string) => `<span class="dm-badge bad">ERROR</span> ${esc(m)}`;

/* ───────────────────────── Chapter 1: set explorer ───────────────────────── */
interface SetInfo {
  label: string;
  inSet: (x: number) => boolean;
  interior: (x: number) => boolean;
  open: boolean;
  closed: boolean;
  bounded: boolean;
  interiorTxt: string;
  closureTxt: string;
  boundaryTxt: string;
  supTxt: string;
  infTxt: string;
  draw: (sc: GScene) => void;
  view: [number, number];
}
const seg = (sc: GScene, a: number, b: number, c = 'main') => (sc.segs = sc.segs || []).push({ x1: a, y1: 0, x2: b, y2: 0, color: c, width: 6 });
const pt = (sc: GScene, x: number, kind: 'filled' | 'open', c = 'main') => (sc.points = sc.points || []).push({ x, y: 0, kind, color: c, r: 6 });
const SETS: Record<string, SetInfo> = {
  open01: { label: '(0, 1)', inSet: (x) => x > 0 && x < 1, interior: (x) => x > 0 && x < 1, open: true, closed: false, bounded: true, interiorTxt: '(0, 1)', closureTxt: '[0, 1]', boundaryTxt: '{0, 1}', supTxt: '1 (no maximum)', infTxt: '0 (no minimum)', draw: (s) => { seg(s, 0, 1); pt(s, 0, 'open'); pt(s, 1, 'open'); }, view: [-1, 2] },
  closed01: { label: '[0, 1]', inSet: (x) => x >= 0 && x <= 1, interior: (x) => x > 0 && x < 1, open: false, closed: true, bounded: true, interiorTxt: '(0, 1)', closureTxt: '[0, 1]', boundaryTxt: '{0, 1}', supTxt: '1 = max', infTxt: '0 = min', draw: (s) => { seg(s, 0, 1); pt(s, 0, 'filled'); pt(s, 1, 'filled'); }, view: [-1, 2] },
  half: { label: '(0, 1]', inSet: (x) => x > 0 && x <= 1, interior: (x) => x > 0 && x < 1, open: false, closed: false, bounded: true, interiorTxt: '(0, 1)', closureTxt: '[0, 1]', boundaryTxt: '{0, 1}', supTxt: '1 = max', infTxt: '0 (no minimum)', draw: (s) => { seg(s, 0, 1); pt(s, 0, 'open'); pt(s, 1, 'filled'); }, view: [-1, 2] },
  ray: { label: '[2, ∞)', inSet: (x) => x >= 2, interior: (x) => x > 2, open: false, closed: true, bounded: false, interiorTxt: '(2, ∞)', closureTxt: '[2, ∞)', boundaryTxt: '{2}', supTxt: 'none (unbounded above)', infTxt: '2 = min', draw: (s) => { seg(s, 2, 50); pt(s, 2, 'filled'); }, view: [-1, 6] },
  recip: { label: '{1/n : n ∈ ℕ}', inSet: (x) => x > 0 && Math.abs(1 / x - Math.round(1 / x)) < 1e-9, interior: () => false, open: false, closed: false, bounded: true, interiorTxt: '∅', closureTxt: '{1/n} ∪ {0}', boundaryTxt: '{1/n} ∪ {0}', supTxt: '1 = max', infTxt: '0 (limit point, not attained)', draw: (s) => { for (let n = 1; n <= 40; n++) pt(s, 1 / n, 'filled'); pt(s, 0, 'open', 'warn'); }, view: [-0.2, 1.2] },
  mixed: { label: '(0, 1) ∪ {2}', inSet: (x) => (x > 0 && x < 1) || x === 2, interior: (x) => x > 0 && x < 1, open: false, closed: false, bounded: true, interiorTxt: '(0, 1)', closureTxt: '[0, 1] ∪ {2}', boundaryTxt: '{0, 1, 2}', supTxt: '2 = max', infTxt: '0 (no minimum)', draw: (s) => { seg(s, 0, 1); pt(s, 0, 'open'); pt(s, 1, 'open'); pt(s, 2, 'filled'); }, view: [-1, 3] },
  ints: { label: 'ℤ (integers)', inSet: (x) => Math.abs(x - Math.round(x)) < 1e-12, interior: () => false, open: false, closed: true, bounded: false, interiorTxt: '∅', closureTxt: 'ℤ', boundaryTxt: 'ℤ', supTxt: 'none', infTxt: 'none', draw: (s) => { for (let n = -20; n <= 20; n++) pt(s, n, 'filled'); }, view: [-6, 6] },
  all: { label: 'ℝ', inSet: () => true, interior: () => true, open: true, closed: true, bounded: false, interiorTxt: 'ℝ', closureTxt: 'ℝ', boundaryTxt: '∅', supTxt: 'none', infTxt: 'none', draw: (s) => seg(s, -500, 500), view: [-6, 6] },
};
export function mountRealSetExplorer(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('Set', `<select data-k="set">${Object.entries(SETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select>`)}
      ${field('Test point x', `<input data-k="x" type="text" value="0.5" spellcheck="false">`)}
    </div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>`;
  host.appendChild(w);
  let cur = SETS.open01;
  let tx = 0.5;
  const gv = mountGraph(qs(w, 'graph'), {
    height: 150,
    view: [-1, 2, -1, 1],
    scene: (): GScene => {
      const sc: GScene = {};
      cur.draw(sc);
      if (Number.isFinite(tx)) (sc.points = sc.points || []).push({ x: tx, y: 0, kind: 'cross', color: 'bad', r: 7, label: 'x' });
      return sc;
    },
  });
  function update() {
    cur = SETS[qs<HTMLSelectElement>(w, 'set').value];
    try {
      tx = parsePoint(qs<HTMLInputElement>(w, 'x').value).a;
    } catch {
      tx = NaN;
    }
    gv.setView(cur.view[0], cur.view[1], -1, 1, true);
    const mem = Number.isFinite(tx) ? `x = ${num(tx, 6)} is <b>${cur.inSet(tx) ? 'in' : 'not in'}</b> the set and is <b>${cur.interior(tx) ? '' : 'not '}an interior point</b>.` : 'Enter a number for the test point.';
    qs(w, 'out').innerHTML = `<b>${esc(cur.label)}</b><br>
      Open: <b>${cur.open ? 'yes' : 'no'}</b> · Closed: <b>${cur.closed ? 'yes' : 'no'}</b> · Bounded: <b>${cur.bounded ? 'yes' : 'no'}</b><br>
      Interior: ${esc(cur.interiorTxt)} · Closure: ${esc(cur.closureTxt)} · Boundary: ${esc(cur.boundaryTxt)}<br>
      sup: ${esc(cur.supTxt)} · inf: ${esc(cur.infTxt)}<br>${mem}`;
  }
  w.querySelectorAll('select,input').forEach((e) => e.addEventListener('input', update));
  update();
}

/* ───────────────────────── sequence helpers ───────────────────────── */
function seqTerms(fn: (n: number) => number, count: number): number[] {
  const out: number[] = [];
  for (let n = 1; n <= count; n++) out.push(fn(n));
  return out;
}
function seqPoints(terms: number[], max: number, color = 'main') {
  return terms.slice(0, max).map((y, i) => ({ x: i + 1, y, kind: 'filled' as const, color, r: 3 }));
}

/* ───────────────────────── Chapter 2: sup / inf tester ───────────────────────── */
export function mountSupInfTester(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('Terms aₙ (formula in n, write n as x)', `<input data-k="f" type="text" value="1-1/x" spellcheck="false">`)}
      ${field('Number of terms', `<input data-k="N" type="number" min="5" max="5000" value="500">`)}
      ${field('Candidate supremum s (blank = auto)', `<input data-k="s" type="text" value="1" spellcheck="false">`)}
      ${field('ε = <span data-k="ev">0.05</span>', `<input data-k="e" type="range" min="-4" max="0" step="0.05" value="-1.3">`)}
    </div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>`;
  host.appendChild(w);
  let terms: number[] = [];
  let s = 1;
  let eps = 0.05;
  const gv = mountGraph(qs(w, 'graph'), {
    height: 280,
    view: [0, 60, -0.2, 1.4],
    scene: (): GScene => ({
      points: seqPoints(terms, 400),
      lines: [{ kind: 'h', v: s, color: 'good', label: 's' }],
      bands: [{ kind: 'h', lo: s - eps, hi: s, color: 'alt', label: '(s − ε, s]' }],
    }),
  });
  function run() {
    const out = qs(w, 'out');
    try {
      const f = compileFn(qs<HTMLInputElement>(w, 'f').value).f;
      const N = Math.max(5, Math.min(5000, parseInt(qs<HTMLInputElement>(w, 'N').value, 10) || 500));
      terms = seqTerms(f, N);
      if (terms.some((t) => !Number.isFinite(t))) throw new Error('The formula is not defined for every n ≥ 1.');
      const sTxt = qs<HTMLInputElement>(w, 's').value.trim();
      const mx = Math.max(...terms);
      const mn = Math.min(...terms);
      s = sTxt ? parsePoint(sTxt).a : mx;
      eps = Math.pow(10, parseFloat(qs<HTMLInputElement>(w, 'e').value));
      qs(w, 'ev').textContent = num(eps, 3);
      const isUpper = terms.every((t) => t <= s + 1e-12);
      const idx = terms.findIndex((t) => t > s - eps);
      const attained = terms.some((t) => Math.abs(t - s) < 1e-12);
      const parts: string[] = [];
      parts.push(`Largest of the ${N} computed terms: <b>${num(mx, 8)}</b> · smallest: <b>${num(mn, 8)}</b> (numerical).`);
      parts.push(
        isUpper
          ? `<span class="dm-badge ok">UPPER BOUND ✓</span> every computed term ≤ s = ${num(s, 8)} (checked for n ≤ ${N} only).`
          : `<span class="dm-badge bad">NOT AN UPPER BOUND</span> some term exceeds s — the largest computed term is ${num(mx, 8)}.`
      );
      if (isUpper) {
        parts.push(
          idx >= 0
            ? `ε-property: for ε = ${num(eps, 3)} the term a<sub>${idx + 1}</sub> = ${num(terms[idx], 8)} lies in (s − ε, s], so s − ε is <b>not</b> an upper bound.`
            : `No computed term lies in (s − ε, s] — s is probably too large or more terms are needed (then s is not the least upper bound).`
        );
        parts.push(attained ? `s is attained (a term equals s) ⇒ s = max.` : `s is not attained by any computed term ⇒ if s is the supremum there is no maximum.`);
      }
      parts.push(`<span class="an-note">Finite sampling is evidence, not proof: to prove s = sup you show (i) aₙ ≤ s for all n and (ii) ∀ε ∃n with aₙ > s − ε (Chapter 2).</span>`);
      out.innerHTML = parts.join('<br>');
      gv.setView(0, Math.min(60, N), Math.min(mn, s) - 0.2 * (Math.abs(mx - mn) + 0.2), Math.max(mx, s) + 0.2 * (Math.abs(mx - mn) + 0.2));
    } catch (e) {
      terms = [];
      out.innerHTML = warn((e as Error).message);
    }
    gv.draw();
  }
  w.querySelectorAll('input').forEach((i) => i.addEventListener('input', run));
  run();
}

/* ───────────────────────── Chapter 3: sequence explorer ───────────────────────── */
export function mountSequenceExplorer(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  const presets: [string, string][] = [
    ['1/n', '1/x'],
    ['(3n+1)/(n+2)', '(3x+1)/(x+2)'],
    ['(1+1/n)ⁿ', '(1+1/x)^x'],
    ['(−1)ⁿ', '(-1)^x'],
    ['n²', 'x^2'],
    ['sin(n)/n', 'sin(x)/x'],
    ['n^(1/n)', 'x^(1/x)'],
    ['(1/2)ⁿ', '(1/2)^x'],
  ];
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('aₙ (formula in n, write n as x)', `<input data-k="f" type="text" value="(3x+1)/(x+2)" spellcheck="false">`)}
      ${field('Terms computed', `<input data-k="N" type="number" min="10" max="5000" value="400">`)}
      ${field('ε = <span data-k="ev">0.05</span>', `<input data-k="e" type="range" min="-4" max="0" step="0.05" value="-1.3">`)}
    </div>
    <div class="lw-ex" data-k="pre"></div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <details class="lsn-det"><summary>First terms</summary><div class="lsn-prose an-seqtbl" data-k="tbl"></div></details>`;
  host.appendChild(w);
  presets.forEach(([lab, f]) => {
    const b = mk('button', '', esc(lab)) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      qs<HTMLInputElement>(w, 'f').value = f;
      run();
    };
    qs(w, 'pre').appendChild(b);
  });
  let terms: number[] = [];
  let L: number | null = null;
  let eps = 0.05;
  const gv = mountGraph(qs(w, 'graph'), {
    height: 280,
    view: [0, 40, -1, 4],
    scene: (): GScene => {
      const sc: GScene = { points: seqPoints(terms, 600) };
      if (L !== null) {
        sc.lines = [{ kind: 'h', v: L, color: 'good', label: 'L' }];
        sc.bands = [{ kind: 'h', lo: L - eps, hi: L + eps, color: 'alt', label: 'L ± ε' }];
      }
      return sc;
    },
  });
  function run() {
    const out = qs(w, 'out');
    try {
      const f = compileFn(qs<HTMLInputElement>(w, 'f').value).f;
      const N = Math.max(10, Math.min(5000, parseInt(qs<HTMLInputElement>(w, 'N').value, 10) || 400));
      terms = seqTerms(f, N);
      if (terms.some((t) => Number.isNaN(t))) throw new Error('The formula is not defined for every n ≥ 1.');
      eps = Math.pow(10, parseFloat(qs<HTMLInputElement>(w, 'e').value));
      qs(w, 'ev').textContent = num(eps, 3);
      const lim: LimitResult = sequenceLimit(qs<HTMLInputElement>(w, 'f').value);
      const parts: string[] = [];
      L = null;
      if (lim.status === 'value') {
        L = lim.num as number;
        parts.push(`<span class="dm-badge ok">CONVERGES</span> lim aₙ = <b>${esc(lim.display)}</b> <span class="an-note">(proved symbolically: ${esc(lim.method)})</span>`);
        let Nidx = 1;
        for (let i = terms.length - 1; i >= 0; i--) {
          if (Math.abs(terms[i] - L) >= eps) {
            Nidx = i + 2;
            break;
          }
        }
        if (Math.abs(terms[terms.length - 1] - L) >= eps) parts.push(`<span class="warn">Increase the number of terms: aₙ has not entered the ε-band by n = ${terms.length}.</span>`);
        else parts.push(`For ε = ${num(eps, 3)}: the smallest N with |aₙ − L| < ε for <b>all computed</b> n ≥ N is <b>N = ${Nidx}</b>.`);
      } else if (lim.status === 'infinite') parts.push(`<span class="dm-badge warn">DIVERGES TO ${esc(lim.display)}</span> (${esc(lim.method)}).`);
      else if (lim.status === 'dne') parts.push(`<span class="dm-badge bad">DIVERGES</span> no limit exists (${esc(lim.headline)}).`);
      else parts.push(`<span class="dm-badge warn">LIMIT NOT PROVED</span> ${esc(lim.headline)} — numerical observations below are evidence only.`);
      const inc = terms.every((t, i) => i === 0 || t >= terms[i - 1] - 1e-15);
      const dec = terms.every((t, i) => i === 0 || t <= terms[i - 1] + 1e-15);
      const mxAbs = Math.max(...terms.map(Math.abs));
      parts.push(`Monotone (first ${terms.length} terms): <b>${inc && dec ? 'constant' : inc ? 'increasing' : dec ? 'decreasing' : 'neither'}</b> · max |aₙ| = <b>${num(mxAbs, 6)}</b> (${Number.isFinite(mxAbs) && mxAbs < 1e12 ? 'bounded on the computed range' : 'large'}).`);
      const K = Math.floor(terms.length / 2);
      const tail = terms.slice(K);
      const spread = Math.max(...tail) - Math.min(...tail);
      parts.push(`Cauchy check: the largest |aₘ − aₙ| among terms n, m ≥ ${K + 1} is <b>${num(spread, 6)}</b> ${spread < eps ? `(< ε: consistent with the Cauchy condition)` : `(≥ ε: the tail has not settled)`}.`);
      if (lim.status === 'dne' || (lim.status === 'unsupported' && !inc && !dec)) {
        const ev = terms.filter((_, i) => i % 2 === 0).slice(-1)[0];
        const od = terms.filter((_, i) => i % 2 === 1).slice(-1)[0];
        parts.push(`Subsequences: a₂ₖ ≈ ${num(od, 6)}, a₂ₖ₋₁ ≈ ${num(ev, 6)} — different limits would prove divergence.`);
      }
      out.innerHTML = parts.join('<br>');
      qs(w, 'tbl').innerHTML = `<table class="dm-tbl"><thead><tr><th>n</th><th>aₙ</th></tr></thead><tbody>${terms.slice(0, 30).map((t, i) => `<tr><td>${i + 1}</td><td>${num(t, 10)}</td></tr>`).join('')}</tbody></table>`;
      const lo = Math.min(...terms.slice(0, 60), L ?? Infinity);
      const hi = Math.max(...terms.slice(0, 60), L ?? -Infinity);
      const pad = Math.max(0.2, (hi - lo) * 0.15);
      gv.setView(0, Math.min(60, terms.length) + 1, lo - pad, hi + pad);
    } catch (e) {
      terms = [];
      L = null;
      out.innerHTML = warn((e as Error).message);
    }
    gv.draw();
  }
  w.querySelectorAll('input').forEach((i) => i.addEventListener('input', run));
  run();
}

/* ───────────────────────── Chapter 4: series lab ───────────────────────── */
export function mountSeriesLab(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  const presets: [string, string][] = [
    ['(1/2)ⁿ', '(1/2)^x'],
    ['1/n', '1/x'],
    ['1/n²', '1/x^2'],
    ['1/(n(n+1))', '1/(x*(x+1))'],
    ['(−1)ⁿ⁺¹/n', '(-1)^(x+1)/x'],
    ['n/2ⁿ', 'x/2^x'],
    ['n²/3ⁿ', 'x^2/3^x'],
    ['n/(n+1)', 'x/(x+1)'],
  ];
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('aₙ (formula in n, write n as x; n starts at 1)', `<input data-k="f" type="text" value="x^2/3^x" spellcheck="false">`)}
      ${field('Terms summed', `<input data-k="N" type="number" min="5" max="3000" value="60">`)}
    </div>
    <div class="lw-ex" data-k="pre"></div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>`;
  host.appendChild(w);
  presets.forEach(([lab, f]) => {
    const b = mk('button', '', esc(lab)) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      qs<HTMLInputElement>(w, 'f').value = f;
      run();
    };
    qs(w, 'pre').appendChild(b);
  });
  let sums: number[] = [];
  const gv = mountGraph(qs(w, 'graph'), {
    height: 260,
    view: [0, 60, -1, 3],
    scene: (): GScene => ({ points: seqPoints(sums, 400) }),
  });
  const lvTxt = (r: LimitResult) => (r.status === 'value' || r.status === 'infinite' ? r.display : r.status === 'dne' ? 'does not exist' : 'not determined');
  function run() {
    const out = qs(w, 'out');
    try {
      const txt = qs<HTMLInputElement>(w, 'f').value;
      // factorial is not in the CAS: reject early with a clear message
      if (/factorial|!/.test(txt)) {
        throw new Error('Factorials are not supported by the symbolic engine. Use the presets without n! or rewrite using powers.');
      }
      const f = compileFn(txt).f;
      const N = Math.max(5, Math.min(3000, parseInt(qs<HTMLInputElement>(w, 'N').value, 10) || 60));
      const a = seqTerms(f, N);
      if (a.some((t) => Number.isNaN(t))) throw new Error('The formula is not defined for every n ≥ 1.');
      sums = [];
      let acc = 0;
      for (const t of a) {
        acc += t;
        sums.push(acc);
      }
      const T = seriesTests(txt);
      const parts: string[] = [];
      parts.push(`Partial sum S<sub>${N}</sub> = <b>${num(acc, 10)}</b> <span class="an-note">(numerical; the plot shows S₁ … S<sub>${Math.min(N, 400)}</sub>)</span>`);
      // nth-term test
      const termZero = T.term.status === 'value' && Math.abs(T.term.num as number) < 1e-12;
      const termNonZero = T.term.status === 'value' && !termZero;
      const termInf = T.term.status === 'infinite';
      parts.push(`<b>nth-term test:</b> lim aₙ = ${esc(lvTxt(T.term))} ${termNonZero || termInf ? '⇒ <span class="bad">the series DIVERGES</span> (terms do not tend to 0).' : termZero ? '⇒ inconclusive on its own (necessary, not sufficient).' : '(not determined).'}`);
      // ratio / root
      const verdict = (r: LimitResult, name: string): { v: string; code: 'conv' | 'div' | 'inc' | 'unk' } => {
        if (r.status === 'value') {
          const L = r.num as number;
          if (L < 1 - 1e-12) return { v: `${name}: L = ${esc(r.display)} < 1 ⇒ <span class="ok">converges absolutely</span>.`, code: 'conv' };
          if (L > 1 + 1e-12) return { v: `${name}: L = ${esc(r.display)} > 1 ⇒ <span class="bad">diverges</span>.`, code: 'div' };
          return { v: `${name}: L = 1 ⇒ <span class="warn">inconclusive</span> (compare with a p-series, or use another test).`, code: 'inc' };
        }
        if (r.status === 'infinite') return { v: `${name}: L = ∞ ⇒ <span class="bad">diverges</span>.`, code: 'div' };
        return { v: `${name}: limit not determined by the engine.`, code: 'unk' };
      };
      const rv = verdict(T.ratio, 'Ratio test lim |aₙ₊₁/aₙ|');
      const ro = verdict(T.root, 'Root test lim |aₙ|^(1/n)');
      parts.push(rv.v, ro.v);
      // geometric detection
      const rat = a.slice(1, 6).map((t, i) => t / a[i]);
      const isGeo = rat.every((r) => Math.abs(r - rat[0]) < 1e-12) && Number.isFinite(rat[0]);
      if (isGeo) {
        const r = rat[0];
        if (Math.abs(r) < 1) parts.push(`<b>Geometric series</b> with first term a₁ = ${num(a[0], 8)} and ratio r = ${num(r, 8)}: exact sum a₁/(1 − r) = <b>${num(a[0] / (1 - r), 10)}</b>.`);
        else parts.push(`<b>Geometric series</b> with ratio r = ${num(r, 8)}, |r| ≥ 1 ⇒ diverges.`);
      }
      // alternating
      const alt = a.slice(0, 40).every((t, i) => i === 0 || t * a[i - 1] < 0);
      if (alt) {
        const b = a.map(Math.abs);
        const dec = b.every((t, i) => i === 0 || t <= b[i - 1] + 1e-15);
        const zero = T.absTerm.status === 'value' && Math.abs(T.absTerm.num as number) < 1e-12;
        parts.push(`<b>Alternating series test:</b> bₙ = |aₙ| ${dec ? 'is decreasing' : 'is not monotone decreasing'} on the computed range (numerical) and bₙ → ${esc(lvTxt(T.absTerm))} (symbolic) ⇒ ${dec && zero ? '<span class="ok">the series converges</span>; error after n terms ≤ bₙ₊₁ (' + num(b[N - 1] ?? 0, 4) + ' for n = ' + N + ').' : 'conditions not confirmed.'}`);
        if (rv.code === 'inc') parts.push(`Absolute convergence is decided by Σ|aₙ|: if it diverges (as for the harmonic series) the convergence is <b>conditional</b>.`);
      }
      parts.push(`<span class="an-note">A numerical partial sum never proves convergence. Verdicts above come from exact limits; "inconclusive" means exactly that — no guess is made.</span>`);
      out.innerHTML = parts.join('<br>');
      const lo = Math.min(...sums.slice(0, 400));
      const hi = Math.max(...sums.slice(0, 400));
      const pad = Math.max(0.2, (hi - lo) * 0.15);
      gv.setView(0, Math.min(N, 400) + 1, Math.min(0, lo) - pad, hi + pad);
    } catch (e) {
      sums = [];
      out.innerHTML = warn((e as Error).message);
    }
    gv.draw();
  }
  w.querySelectorAll('input').forEach((i) => i.addEventListener('input', run));
  run();
}

/* ───────────────────────── Chapter 5: continuity lab ───────────────────────── */
export function mountContinuityAnalysisLab(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="f" type="text" value="1/x" spellcheck="false">`)}
      ${field('Interval  [p, q]', `<div class="vin"><input data-k="p" type="text" value="0.05" spellcheck="false"><input data-k="q" type="text" value="1" spellcheck="false"></div>`)}
      ${field('Point c', `<input data-k="c" type="text" value="0.5" spellcheck="false">`)}
      ${field('ε = <span data-k="ev">0.5</span>', `<input data-k="e" type="range" min="-2" max="0.5" step="0.05" value="-0.3">`)}
    </div>
    <div class="lw-ex" data-k="pre"></div>
    <div class="dm-two"><div data-k="graph"></div><div data-k="g2"></div></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>`;
  host.appendChild(w);
  const pre: [string, string, string, string, string][] = [
    ['x² on [0, 2]', 'x^2', '0', '2', '1'],
    ['x² on [0, 50]', 'x^2', '0', '50', '25'],
    ['1/x on [0.01, 1]', '1/x', '0.01', '1', '0.5'],
    ['sin x on [0, 20]', 'sin(x)', '0', '20', '3'],
    ['√x on [0, 4]', 'sqrt(x)', '0', '4', '1'],
  ];
  pre.forEach(([lab, f, p, q, c]) => {
    const b = mk('button', '', esc(lab)) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      qs<HTMLInputElement>(w, 'f').value = f;
      qs<HTMLInputElement>(w, 'p').value = p;
      qs<HTMLInputElement>(w, 'q').value = q;
      qs<HTMLInputElement>(w, 'c').value = c;
      run(true);
    };
    qs(w, 'pre').appendChild(b);
  });
  let fn: ((x: number) => number) | null = null;
  let c = 0.5;
  let eps = 0.5;
  let delta = 0;
  let P = 0;
  let Q = 1;
  let dpts: { x: number; y: number }[] = [];
  const g1 = mountGraph(qs(w, 'graph'), {
    height: 280,
    view: [-0.5, 2.5, -1, 5],
    scene: (): GScene =>
      fn
        ? {
            curves: [{ f: fn, color: 'main', domain: [P, Q] }],
            bands: [
              { kind: 'h', lo: fn(c) - eps, hi: fn(c) + eps, color: 'alt', label: 'ε-band' },
              { kind: 'v', lo: c - delta, hi: c + delta, color: 'warn', label: 'δ' },
            ],
            points: [{ x: c, y: fn(c), kind: 'filled', color: 'bad' }],
          }
        : {},
  });
  const g2 = mountGraph(qs(w, 'g2'), {
    height: 280,
    view: [0, 1, 0, 1],
    scene: (): GScene => ({ points: dpts.map((d) => ({ x: d.x, y: d.y, kind: 'filled' as const, color: 'good', r: 3 })), texts: [{ x: P, y: 0, text: 'largest δ(c) for each c', color: 'text' }] }),
  });
  function run(resetView = false) {
    const out = qs(w, 'out');
    try {
      fn = compileFn(qs<HTMLInputElement>(w, 'f').value).f;
      P = parsePoint(qs<HTMLInputElement>(w, 'p').value).a;
      Q = parsePoint(qs<HTMLInputElement>(w, 'q').value).a;
      c = parsePoint(qs<HTMLInputElement>(w, 'c').value).a;
      if (!(Q > P)) throw new Error('Need p < q.');
      eps = Math.pow(10, parseFloat(qs<HTMLInputElement>(w, 'e').value));
      qs(w, 'ev').textContent = num(eps, 3);
      const f = fn;
      const domF = (x: number) => (x >= P && x <= Q ? f(x) : NaN);
      delta = deltaForEpsilon(domF, c, f(c), eps, Q - P, 200, 30);
      // scan c over [P, Q]
      dpts = [];
      let minD = Infinity;
      let minAt = P;
      const M = 36;
      for (let i = 0; i <= M; i++) {
        const cc = P + ((Q - P) * i) / M;
        const d = deltaForEpsilon(domF, cc, f(cc), eps, Q - P, 90, 24);
        dpts.push({ x: cc, y: d });
        if (d < minD) {
          minD = d;
          minAt = cc;
        }
      }
      const dm = Math.max(...dpts.map((d) => d.y));
      out.innerHTML = `At c = ${num(c, 5)} with ε = ${num(eps, 3)} the largest δ is <b>≈ ${num(delta, 4)}</b> (numerical).<br>
        Over the whole interval [${num(P, 4)}, ${num(Q, 4)}] the <b>smallest</b> δ(c) found is <b>≈ ${num(minD, 4)}</b> near c ≈ ${num(minAt, 4)}.<br>
        ${minD > 1e-3 * (Q - P) ? '<span class="dm-badge ok">δ stays bounded below</span> — consistent with uniform continuity on this interval.' : '<span class="dm-badge warn">δ(c) collapses toward 0</span> — uniform continuity fails (or the interval is too large for the sampling).'}
        <br><span class="an-note">The right-hand plot shows δ(c): a function continuous on a <b>compact</b> interval has inf δ(c) > 0 (Heine–Cantor). Values are numerical evidence from bisection on a grid.</span>`;
      if (resetView) {
        const ys = [P, Q].map((x) => f(x)).filter(Number.isFinite);
        const lo = Math.min(...ys, 0);
        const hi = Math.max(...ys, 1);
        g1.setView(P - (Q - P) * 0.1, Q + (Q - P) * 0.1, lo - 0.2 * (hi - lo + 1), hi + 0.2 * (hi - lo + 1));
      }
      g2.setView(P - (Q - P) * 0.05, Q + (Q - P) * 0.05, -0.05 * dm, dm * 1.15 + 1e-9);
    } catch (e) {
      fn = null;
      dpts = [];
      out.innerHTML = warn((e as Error).message);
    }
    g1.draw();
    g2.draw();
  }
  w.querySelectorAll('input').forEach((i) => i.addEventListener('input', () => run(false)));
  run(true);
}

/* ───────────────────────── Chapter 6: MVT + Taylor ───────────────────────── */
interface TaylorPreset {
  label: string;
  f: (x: number) => number;
  coef: (k: number) => number;
  M: (n: number, x: number) => number; // bound for |f^{(n+1)}| on [0, x] (or [x, 0])
  domain?: [number, number];
}
const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const TAYLOR: Record<string, TaylorPreset> = {
  sin: { label: 'sin x', f: Math.sin, coef: (k) => (k % 2 === 0 ? 0 : (k % 4 === 1 ? 1 : -1) / fact(k)), M: () => 1 },
  cos: { label: 'cos x', f: Math.cos, coef: (k) => (k % 2 === 1 ? 0 : (k % 4 === 0 ? 1 : -1) / fact(k)), M: () => 1 },
  exp: { label: 'eˣ', f: Math.exp, coef: (k) => 1 / fact(k), M: (_n, x) => Math.exp(Math.max(0, x)) },
  ln: { label: 'ln(1 + x)', f: (x) => Math.log(1 + x), coef: (k) => (k === 0 ? 0 : ((k % 2 === 1 ? 1 : -1) / k)), M: (n, x) => (x >= 0 ? fact(n) : fact(n) / Math.pow(1 + x, n + 1)), domain: [-0.9, 3] },
  geo: { label: '1/(1 − x)', f: (x) => 1 / (1 - x), coef: () => 1, M: (n, x) => (x >= 0 ? fact(n + 1) / Math.pow(1 - x, n + 2) : fact(n + 1)), domain: [-3, 0.95] },
};
export function mountDifferentiationLab(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <h4 style="margin:0">Mean Value Theorem / Rolle finder</h4>
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="f" type="text" value="x^3-3x" spellcheck="false">`)}
      ${field('a', `<input data-k="a" type="text" value="-2" spellcheck="false">`)}
      ${field('b', `<input data-k="b" type="text" value="2" spellcheck="false">`)}
    </div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <h4 style="margin:12px 0 0">Taylor polynomial and Lagrange remainder (about 0)</h4>
    <div class="dm-ctrl">
      ${field('Function', `<select data-k="tf">${Object.entries(TAYLOR).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select>`)}
      ${field('Degree n = <span data-k="nv">3</span>', `<input data-k="n" type="range" min="0" max="15" step="1" value="3">`)}
      ${field('Evaluate at x', `<input data-k="tx" type="text" value="0.5" spellcheck="false">`)}
    </div>
    <div data-k="tgraph"></div>
    <div class="dm-out" data-k="tout" aria-live="polite"></div>`;
  host.appendChild(w);
  /* MVT */
  let f: ((x: number) => number) | null = null;
  let df: ((x: number) => number) | null = null;
  let a = -2;
  let b = 2;
  let cs: number[] = [];
  let slope = 0;
  const g = mountGraph(qs(w, 'graph'), {
    height: 280,
    view: [-3, 3, -4, 4],
    scene: (): GScene => {
      if (!f) return {};
      const sc: GScene = { curves: [{ f, color: 'main' }], segs: [{ x1: a, y1: f(a), x2: b, y2: f(b), color: 'warn', width: 2 }], points: [{ x: a, y: f(a), kind: 'filled', color: 'alt' }, { x: b, y: f(b), kind: 'filled', color: 'alt' }] };
      const span = (b - a) * 0.35;
      for (const c of cs) {
        sc.segs!.push({ x1: c - span, y1: f(c) - slope * span, x2: c + span, y2: f(c) + slope * span, color: 'good', dash: [5, 3], width: 1.6 });
        sc.points!.push({ x: c, y: f(c), kind: 'filled', color: 'good', label: `c=${num(c, 5)}` });
      }
      return sc;
    },
  });
  function runMVT() {
    const out = qs(w, 'out');
    try {
      const txt = qs<HTMLInputElement>(w, 'f').value;
      f = compileFn(txt).f;
      df = derivFn(txt);
      a = parsePoint(qs<HTMLInputElement>(w, 'a').value).a;
      b = parsePoint(qs<HTMLInputElement>(w, 'b').value).a;
      if (!(b > a)) throw new Error('Need a < b.');
      if (!Number.isFinite(f(a)) || !Number.isFinite(f(b))) throw new Error('f is undefined at an endpoint.');
      slope = (f(b) - f(a)) / (b - a);
      cs = [];
      const n = 4000;
      const h = (x: number) => (df as (x: number) => number)(x) - slope;
      let prev = h(a + (b - a) * 1e-9);
      let px = a;
      for (let i = 1; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        const v = h(x === b ? b - (b - a) * 1e-9 : x);
        if (Number.isFinite(prev) && Number.isFinite(v) && prev * v <= 0 && !(prev === 0 && v === 0)) {
          let lo = px;
          let hi = x;
          for (let k = 0; k < 60; k++) {
            const m = (lo + hi) / 2;
            if (h(lo) * h(m) <= 0) hi = m;
            else lo = m;
          }
          const c = (lo + hi) / 2;
          if (c > a && c < b && !cs.some((q) => Math.abs(q - c) < 1e-7)) cs.push(c);
        }
        prev = v;
        px = x;
      }
      const isRolle = Math.abs(f(a) - f(b)) < 1e-12;
      out.innerHTML = `f′(x) = <b>${esc(derivNodeText(txt))}</b> (exact, from the CAS). Secant slope (f(b) − f(a))/(b − a) = <b>${num(slope, 8)}</b>${isRolle ? ' — here f(a) = f(b), so this is <b>Rolle’s theorem</b> with f′(c) = 0' : ''}.<br>` +
        (cs.length ? `Points c ∈ (a, b) with f′(c) = slope (found by sign changes of f′ − slope): <b>${cs.map((c) => num(c, 7)).join(', ')}</b>. ` : `No sign change of f′ − slope was found in (a, b): check that f is continuous on [a, b] and differentiable on (a, b) — the MVT hypotheses may fail (e.g. a corner or a pole).`) +
        `<br><span class="an-note">The theorem guarantees at least one c when f is continuous on [a, b] and differentiable on (a, b). This tool searches numerically for the points; it does not replace the proof.</span>`;
      g.setView(a - (b - a) * 0.3, b + (b - a) * 0.3, Math.min(f(a), f(b)) - (Math.abs(f(b) - f(a)) + 3), Math.max(f(a), f(b)) + (Math.abs(f(b) - f(a)) + 3));
    } catch (e) {
      f = null;
      cs = [];
      out.innerHTML = warn((e as Error).message);
    }
    g.draw();
  }
  ['f', 'a', 'b'].forEach((k) => qs<HTMLInputElement>(w, k).addEventListener('input', runMVT));
  runMVT();

  /* Taylor */
  let tp = TAYLOR.sin;
  let deg = 3;
  let tx = 0.5;
  const P = (x: number) => { let s = 0; for (let k = 0; k <= deg; k++) s += tp.coef(k) * Math.pow(x, k); return s; };
  const tg = mountGraph(qs(w, 'tgraph'), {
    height: 300,
    view: [-5, 5, -3, 3],
    scene: (): GScene => ({
      curves: [
        { f: tp.f, color: 'main', domain: tp.domain },
        { f: P, color: 'warn', dash: [6, 3] },
        { f: (x) => Math.abs(tp.f(x) - P(x)), color: 'bad', width: 1.4, domain: tp.domain },
      ],
      points: Number.isFinite(tx) ? [{ x: tx, y: tp.f(tx), kind: 'filled', color: 'good' }] : [],
    }),
  });
  function runTaylor() {
    tp = TAYLOR[qs<HTMLSelectElement>(w, 'tf').value];
    deg = parseInt(qs<HTMLInputElement>(w, 'n').value, 10);
    qs(w, 'nv').textContent = String(deg);
    try {
      tx = parsePoint(qs<HTMLInputElement>(w, 'tx').value).a;
    } catch {
      tx = NaN;
    }
    const dom = tp.domain || [-5, 5];
    if (Number.isFinite(tx) && tx >= dom[0] && tx <= dom[1]) {
      const exact = tp.f(tx);
      const approx = P(tx);
      const err = Math.abs(exact - approx);
      const bound = tp.M(deg, tx) * Math.pow(Math.abs(tx), deg + 1) / fact(deg + 1);
      qs(w, 'tout').innerHTML = `<b>Pₙ(${num(tx, 5)})</b> = ${num(approx, 10)} · f(${num(tx, 5)}) = ${num(exact, 10)} · actual error = <b>${num(err, 4)}</b><br>
        Lagrange bound |Rₙ| ≤ M|x|ⁿ⁺¹/(n+1)! = <b>${num(bound, 4)}</b> with M = ${num(tp.M(deg, tx), 5)} ≥ |f⁽ⁿ⁺¹⁾| between 0 and x ${err <= bound * (1 + 1e-9) + 1e-15 ? '<span class="dm-badge ok">error ≤ bound ✓</span>' : '<span class="dm-badge bad">bound violated (check domain)</span>'}.<br>
        <span class="an-note">Blue/gold: f and Pₙ; red: |f − Pₙ|. Taylor series for 1/(1−x) and ln(1+x) have radius of convergence 1 — outside it the polynomials diverge.</span>`;
    } else qs(w, 'tout').innerHTML = `<span class="warn">Choose x inside the domain ${dom[0]} … ${dom[1]}.</span>`;
    tg.draw();
  }
  ['tf', 'n', 'tx'].forEach((k) => qs(w, k).addEventListener('input', runTaylor));
  runTaylor();
}

/* ───────────────────────── Chapter 7: Riemann sums ───────────────────────── */
const ANTI: Record<string, { f: string; F: (x: number) => number; a: number; b: number }> = {
  'x²': { f: 'x^2', F: (x) => (x * x * x) / 3, a: 0, b: 2 },
  'sin x': { f: 'sin(x)', F: (x) => -Math.cos(x), a: 0, b: Math.PI },
  'eˣ': { f: 'exp(x)', F: Math.exp, a: 0, b: 1 },
  '1/x': { f: '1/x', F: Math.log, a: 1, b: Math.E },
  '3x²−2x': { f: '3x^2-2x', F: (x) => x * x * x - x * x, a: 0, b: 2 },
};
export function mountRiemannLab(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="f" type="text" value="x^2" spellcheck="false">`)}
      ${field('a', `<input data-k="a" type="text" value="0" spellcheck="false">`)}
      ${field('b', `<input data-k="b" type="text" value="2" spellcheck="false">`)}
      ${field('Partition size n = <span data-k="nv">8</span>', `<input data-k="n" type="range" min="1" max="200" step="1" value="8">`)}
      ${field('Rectangles', `<select data-k="mode"><option value="lower">lower sum L(f,P) (inf)</option><option value="upper">upper sum U(f,P) (sup)</option><option value="left">left Riemann sum</option><option value="right">right Riemann sum</option><option value="mid">midpoint sum</option><option value="trap">trapezoid (no rectangles)</option></select>`)}
    </div>
    <div class="lw-ex" data-k="pre"></div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <details class="lsn-det"><summary>Fundamental Theorem of Calculus check</summary><div class="lsn-prose"><div class="dm-ctrl">${field('Preset f with known antiderivative', `<select data-k="ftc">${Object.keys(ANTI).map((k) => `<option>${esc(k)}</option>`).join('')}</select>`)}</div><div class="dm-out" data-k="ftcout"></div></div></details>`;
  host.appendChild(w);
  Object.entries(ANTI).forEach(([lab, v]) => {
    const b = mk('button', '', esc(lab)) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      qs<HTMLInputElement>(w, 'f').value = v.f;
      qs<HTMLInputElement>(w, 'a').value = String(Number(v.a.toPrecision(10)));
      qs<HTMLInputElement>(w, 'b').value = String(Number(v.b.toPrecision(10)));
      run(true);
    };
    qs(w, 'pre').appendChild(b);
  });
  let f: ((x: number) => number) | null = null;
  let rects: { x0: number; x1: number; y0: number; y1: number }[] = [];
  let A = 0;
  let B = 2;
  const g = mountGraph(qs(w, 'graph'), {
    height: 300,
    view: [-0.5, 2.5, -1, 5],
    scene: (): GScene => (f ? { curves: [{ f, color: 'main' }], rects: rects.map((r) => ({ ...r, fill: 'rgba(91,157,255,0.28)', stroke: 'main' })) } : {}),
  });
  const simpson = (fn: (x: number) => number, a: number, b: number, n = 2000) => {
    const h = (b - a) / n;
    let s = fn(a) + fn(b);
    for (let i = 1; i < n; i++) s += fn(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  };
  function run(resetView = false) {
    const out = qs(w, 'out');
    try {
      f = compileFn(qs<HTMLInputElement>(w, 'f').value).f;
      A = parsePoint(qs<HTMLInputElement>(w, 'a').value).a;
      B = parsePoint(qs<HTMLInputElement>(w, 'b').value).a;
      if (!(B > A)) throw new Error('Need a < b.');
      const n = parseInt(qs<HTMLInputElement>(w, 'n').value, 10);
      qs(w, 'nv').textContent = String(n);
      const mode = qs<HTMLSelectElement>(w, 'mode').value;
      const dx = (B - A) / n;
      let Ls = 0;
      let Us = 0;
      let Lf = 0;
      let Rt = 0;
      let Md = 0;
      let Tr = 0;
      rects = [];
      for (let i = 0; i < n; i++) {
        const x0 = A + i * dx;
        const x1 = x0 + dx;
        let m = Infinity;
        let M = -Infinity;
        const S = 40;
        for (let k = 0; k <= S; k++) {
          const y = f(x0 + (dx * k) / S);
          if (!Number.isFinite(y)) throw new Error('f is undefined or unbounded somewhere on [a, b]; Riemann sums need a bounded function.');
          if (y < m) m = y;
          if (y > M) M = y;
        }
        Ls += m * dx;
        Us += M * dx;
        Lf += f(x0) * dx;
        Rt += f(x1) * dx;
        Md += f((x0 + x1) / 2) * dx;
        Tr += ((f(x0) + f(x1)) / 2) * dx;
        if (n <= 120) {
          const h = mode === 'lower' ? m : mode === 'upper' ? M : mode === 'left' ? f(x0) : mode === 'right' ? f(x1) : mode === 'mid' ? f((x0 + x1) / 2) : NaN;
          if (Number.isFinite(h)) rects.push({ x0, x1, y0: 0, y1: h });
        }
      }
      const I = simpson(f, A, B);
      out.innerHTML = `Δx = ${num(dx, 6)} · <b>L</b> = ${num(Ls, 8)} · <b>U</b> = ${num(Us, 8)} · <b>U − L</b> = ${num(Us - Ls, 6)} ${Us - Ls < 1e-3 ? '(the squeeze is tight)' : ''}<br>
        left = ${num(Lf, 8)} · right = ${num(Rt, 8)} · midpoint = ${num(Md, 8)} · trapezoid = ${num(Tr, 8)}<br>
        Integral (Simpson, n = 2000, <b>numerical</b>): <b>${num(I, 9)}</b> — always between L and U ${Ls - 1e-9 <= I && I <= Us + 1e-9 ? '<span class="dm-badge ok">L ≤ ∫ ≤ U ✓</span>' : '<span class="dm-badge warn">check sampling</span>'}.<br>
        <span class="an-note">Lower/upper sums sample each sub-interval 41 times to approximate inf/sup (numerical). For a continuous f, U − L → 0 as n grows (uniform continuity).</span>`;
      if (resetView) {
        const ys: number[] = [];
        for (let k = 0; k <= 100; k++) ys.push(f(A + ((B - A) * k) / 100));
        const lo = Math.min(0, ...ys);
        const hi = Math.max(0, ...ys);
        const p = (hi - lo) * 0.15 + 0.3;
        g.setView(A - (B - A) * 0.15, B + (B - A) * 0.15, lo - p, hi + p);
      }
    } catch (e) {
      f = null;
      rects = [];
      out.innerHTML = warn((e as Error).message);
    }
    g.draw();
  }
  function ftc() {
    const p = ANTI[qs<HTMLSelectElement>(w, 'ftc').value];
    const fn = compileFn(p.f).f;
    const I = simpson(fn, p.a, p.b);
    const G = p.F(p.b) - p.F(p.a);
    const x0 = (p.a + p.b) / 2;
    const Fx = (x: number) => simpson(fn, p.a, x, 400);
    const h = 1e-4 * (p.b - p.a);
    const dF = (Fx(x0 + h) - Fx(x0 - h)) / (2 * h);
    qs(w, 'ftcout').innerHTML = `<b>FTC II:</b> ∫<sub>${num(p.a, 5)}</sub><sup>${num(p.b, 5)}</sup> f = G(b) − G(a) = <b>${num(G, 10)}</b>; numerical Simpson value = ${num(I, 10)} (difference ${num(Math.abs(G - I), 2)}).<br>
      <b>FTC I:</b> at x₀ = ${num(x0, 5)}, d/dx ∫ₐˣ f ≈ ${num(dF, 8)} (central difference of the numerical integral) and f(x₀) = ${num(fn(x0), 8)}.`;
  }
  w.querySelectorAll('input[data-k], select[data-k]').forEach((e) => e.addEventListener('input', () => {
    if ((e as HTMLElement).dataset.k === 'ftc') ftc();
    else run(false);
  }));
  run(true);
  ftc();
}

/* ───────────────────────── Chapter 8: proof studio ───────────────────────── */
interface ProofDef {
  title: string;
  kind: string;
  claim: string;
  steps: { t: string; why: string }[];
}
const PROOFS: ProofDef[] = [
  {
    title: '√2 is irrational', kind: 'Contradiction', claim: 'There is no rational p/q with (p/q)² = 2.',
    steps: [
      { t: 'Assume, for contradiction, that √2 = p/q with integers p, q, q ≠ 0, in lowest terms (gcd(p, q) = 1).', why: 'Negate the claim; "lowest terms" is always achievable by cancelling common factors.' },
      { t: 'Squaring gives p² = 2q², so p² is even.', why: 'p² is twice an integer.' },
      { t: 'Hence p is even: if p were odd, p² would be odd. Write p = 2k.', why: 'Contrapositive of "p odd ⇒ p² odd".' },
      { t: 'Substitute: 4k² = 2q², so q² = 2k² and q² is even, so q is even.', why: 'Same argument as step 3.' },
      { t: 'Both p and q are even, contradicting gcd(p, q) = 1. Hence √2 is irrational. ∎', why: 'The assumption led to a contradiction, so it is false.' },
    ],
  },
  {
    title: 'If n² is even then n is even', kind: 'Contrapositive', claim: 'n² even ⇒ n even.',
    steps: [
      { t: 'The contrapositive is: n odd ⇒ n² odd. It is logically equivalent, so it suffices to prove it.', why: '(P ⇒ Q) ≡ (¬Q ⇒ ¬P).' },
      { t: 'Let n = 2k + 1 for an integer k.', why: 'Definition of odd.' },
      { t: 'Then n² = 4k² + 4k + 1 = 2(2k² + 2k) + 1.', why: 'Expand and factor out 2.' },
      { t: 'This has the form 2m + 1 with m = 2k² + 2k, so n² is odd. ∎', why: 'Definition of odd.' },
    ],
  },
  {
    title: '1 + 2 + … + n = n(n+1)/2', kind: 'Induction', claim: 'For all n ≥ 1, Σ i = n(n+1)/2.',
    steps: [
      { t: 'Base case n = 1: left side 1, right side 1·2/2 = 1. ✓', why: 'The statement holds for the first value.' },
      { t: 'Inductive hypothesis: assume Σ_{i=1}^{k} i = k(k+1)/2 for some k ≥ 1.', why: 'We now show P(k) ⇒ P(k+1).' },
      { t: 'Then Σ_{i=1}^{k+1} i = k(k+1)/2 + (k+1).', why: 'Split off the last term and use the hypothesis.' },
      { t: '= (k+1)(k/2 + 1) = (k+1)(k+2)/2.', why: 'Factor (k+1).' },
      { t: 'This is the formula for n = k + 1. By induction the statement holds for all n ≥ 1. ∎', why: 'Base case + inductive step.' },
    ],
  },
  {
    title: 'lim_{x→3} (4x − 5) = 7', kind: 'ε–δ proof', claim: '∀ε > 0 ∃δ > 0: 0 < |x − 3| < δ ⇒ |(4x − 5) − 7| < ε.',
    steps: [
      { t: 'Scratch work: |(4x − 5) − 7| = |4x − 12| = 4|x − 3|. We want 4|x − 3| < ε, i.e. |x − 3| < ε/4.', why: 'Work backwards to find δ.' },
      { t: 'Let ε > 0 be arbitrary and choose δ = ε/4 > 0.', why: 'State δ before using it.' },
      { t: 'Suppose 0 < |x − 3| < δ.', why: 'The hypothesis of the implication.' },
      { t: 'Then |(4x − 5) − 7| = 4|x − 3| < 4δ = ε. ∎', why: 'The conclusion.' },
    ],
  },
  {
    title: 'There are infinitely many primes', kind: 'Contradiction', claim: 'The set of primes is infinite.',
    steps: [
      { t: 'Suppose there are finitely many primes p₁, p₂, …, pₙ.', why: 'Assume the negation.' },
      { t: 'Let N = p₁p₂⋯pₙ + 1. N > 1 so N has a prime factor q.', why: 'Every integer > 1 has a prime factor.' },
      { t: 'q is one of the pᵢ, so q divides p₁⋯pₙ. Then q divides N − p₁⋯pₙ = 1.', why: 'q divides both terms.' },
      { t: 'But no prime divides 1, a contradiction. So there are infinitely many primes. ∎', why: 'The assumption fails.' },
    ],
  },
];
export function mountProofStudio(host: HTMLElement): void {
  host.replaceChildren();
  const w = mk('div', 'dm');
  w.innerHTML = `
    <h4 style="margin:0">1 · Induction checker (exact arithmetic)</h4>
    <div class="dm-ctrl">
      ${field('Term aᵢ (write i as x)', `<input data-k="t" type="text" value="x" spellcheck="false">`)}
      ${field('Claimed closed form S(n) (write n as x)', `<input data-k="s" type="text" value="x*(x+1)/2" spellcheck="false">`)}
      <button type="button" class="primary" data-a="chk">Check</button>
    </div>
    <div class="dm-out" data-k="iout" aria-live="polite"></div>
    <h4 style="margin:12px 0 0">2 · ε–δ proof builder (polynomials of degree ≤ 2)</h4>
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="ef" type="text" value="4x-5" spellcheck="false">`)}
      ${field('a', `<input data-k="ea" type="text" value="3" spellcheck="false">`)}
      ${field('Example ε', `<input data-k="ee" type="text" value="0.1" spellcheck="false">`)}
      <button type="button" class="primary" data-a="eps">Write the proof</button>
    </div>
    <div class="dm-out" data-k="eout" style="white-space:pre-wrap"></div>
    <h4 style="margin:12px 0 0">3 · Step-by-step proof gallery</h4>
    <div class="dm-ctrl">${field('Proof', `<select data-k="pg">${PROOFS.map((p, i) => `<option value="${i}">${esc(p.title)} — ${esc(p.kind)}</option>`).join('')}</select>`)}
      <div class="dm-row"><button type="button" data-a="next">Reveal next step</button><button type="button" data-a="all">Show all</button><button type="button" data-a="reset">Restart</button></div></div>
    <div data-k="pout"></div>`;
  host.appendChild(w);

  /* induction */
  const runInd = () => {
    const out = qs(w, 'iout');
    try {
      const t = qs<HTMLInputElement>(w, 't').value;
      const s = qs<HTMLInputElement>(w, 's').value;
      let accN = 0n;
      let accD = 1n;
      const gcd = (a: bigint, b: bigint): bigint => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a || 1n; };
      let failAt = -1;
      let prevS: { n: bigint; d: bigint } | null = null;
      let stepFail = -1;
      for (let n = 1; n <= 200; n++) {
        const term = evalExactAt(t, n);
        const S = evalExactAt(s, n);
        if (!term || !S) throw new Error('Could not evaluate the expressions exactly (use rational expressions in x).');
        accN = accN * term.d + term.n * accD;
        accD = accD * term.d;
        const g = gcd(accN, accD);
        accN /= g;
        accD /= g;
        if (accN * S.d !== S.n * accD && failAt < 0) failAt = n;
        if (prevS) {
          // inductive step identity: S(n) − S(n−1) = a_n
          const dN = S.n * prevS.d - prevS.n * S.d;
          const dD = S.d * prevS.d;
          if (dN * term.d !== term.n * dD && stepFail < 0) stepFail = n;
        }
        prevS = S;
      }
      const kk = (src: string) => src.replace(/(?<![A-Za-z])x(?![A-Za-z])/g, 'k');
      const k1 = kk(parseNodeText(s, '(x+1)'));
      const k0 = kk(parseNodeText(s, 'x'));
      const ak1 = kk(parseNodeText(t, '(x+1)'));
      const base = `Base case n = 1: LHS = ${qToString(evalExactAt(t, 1) as never)}, RHS S(1) = ${qToString(evalExactAt(s, 1) as never)}.`;
      out.innerHTML = failAt < 0
        ? `<span class="dm-badge ok">TRUE for n = 1…200 (exact rational arithmetic)</span> — evidence only; the proof is the induction below.<br>${esc(base)}<br>
           <b>Inductive step to prove:</b> S(k) + a<sub>k+1</sub> = S(k+1), i.e. <code class="mxr-code">${esc(k0)} + ${esc(ak1)} = ${esc(k1)}</code>. ${stepFail < 0 ? 'This identity was verified exactly for k = 1…199 — now prove it algebraically for general k.' : `<span class="bad">The identity fails at k = ${stepFail}.</span>`}`
        : `<span class="dm-badge bad">FALSE at n = ${failAt}</span> — a single counterexample disproves the claim, so no induction proof can exist.<br>${esc(base)}`;
    } catch (e) {
      out.innerHTML = warn((e as Error).message);
    }
  };
  w.querySelector<HTMLButtonElement>('[data-a="chk"]')!.onclick = runInd;
  /* eps-delta */
  w.querySelector<HTMLButtonElement>('[data-a="eps"]')!.onclick = () => {
    const out = qs(w, 'eout');
    try {
      const pr = formalProof(qs<HTMLInputElement>(w, 'ef').value, qs<HTMLInputElement>(w, 'ea').value, qs<HTMLInputElement>(w, 'ee').value);
      out.textContent = pr || 'A proof is generated for polynomials of degree ≤ 2 at a rational point. For other functions apply the template of Chapter 8: scratch work, bound the extra factor with δ ≤ 1, then choose δ.';
    } catch (e) {
      out.innerHTML = warn((e as Error).message);
    }
  };
  /* gallery */
  let shown = 0;
  const gal = () => {
    const p = PROOFS[parseInt(qs<HTMLSelectElement>(w, 'pg').value, 10)];
    qs(w, 'pout').innerHTML = `<div class="dm-out"><b>${esc(p.kind)}.</b> Claim: ${esc(p.claim)}</div>` +
      p.steps.slice(0, shown).map((s, i) => `<div class="an-proof-step"><b>Step ${i + 1}.</b> ${esc(s.t)}<br><span class="an-note">Why: ${esc(s.why)}</span></div>`).join('') +
      (shown < p.steps.length ? `<div class="an-note">${shown}/${p.steps.length} steps shown — try to predict the next one.</div>` : `<div class="an-note">Complete proof.</div>`);
  };
  qs(w, 'pg').addEventListener('change', () => { shown = 0; gal(); });
  w.querySelector<HTMLButtonElement>('[data-a="next"]')!.onclick = () => {
    const p = PROOFS[parseInt(qs<HTMLSelectElement>(w, 'pg').value, 10)];
    shown = Math.min(p.steps.length, shown + 1);
    gal();
  };
  w.querySelector<HTMLButtonElement>('[data-a="all"]')!.onclick = () => {
    shown = PROOFS[parseInt(qs<HTMLSelectElement>(w, 'pg').value, 10)].steps.length;
    gal();
  };
  w.querySelector<HTMLButtonElement>('[data-a="reset"]')!.onclick = () => { shown = 0; gal(); };
  runInd();
  gal();
}

void nodeText;
