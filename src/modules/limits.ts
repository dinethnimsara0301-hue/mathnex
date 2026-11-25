/* MATHNEX — Limits & Continuity module (Module 13). */
import { esc, wireSubnav } from './shared';
import { rich } from './mxrich';
import { GView, mountGraph, type GScene } from './gview';
import { mountLessons, type DemoMounter } from './lesson';
import { LIMIT_CHAPTERS } from './limitsData';
import {
  analyzeContinuity,
  compileFn,
  computeLimit,
  deltaForEpsilon,
  evidenceTable,
  parseLimitNotation,
  parsePoint,
  polyCoeffs,
  qToNumber,
  qToString,
  setCAS,
  type LimitResult,
  type Step,
} from './limitsEngine';

const MOD = 'limits';
let initialized = false;

const num = (v: number, p = 8): string => (Number.isFinite(v) ? String(Number(v.toPrecision(p))) : Number.isNaN(v) ? 'undefined' : v > 0 ? '+∞' : '−∞');
const tex = (s: string) => esc(s);

function mk(tag: string, cls = '', html = ''): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
function field(label: string, inner: string): string {
  return `<label class="field">${label}${inner}</label>`;
}

const store = {
  get<T>(k: string): T | null {
    try {
      const r = localStorage.getItem(k);
      return r ? (JSON.parse(r) as T) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown): void {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  },
};
interface LimState {
  tab?: string;
  expr?: string;
  pt?: string;
  side?: string;
  graphF?: string;
  graphA?: string;
}
const STATE_KEY = 'mathnexLimitsState';
const getState = (): LimState => store.get<LimState>(STATE_KEY) || {};
const patchState = (p: LimState) => store.set(STATE_KEY, { ...getState(), ...p });

/* ───────────────────────── step rendering ───────────────────────── */
function stepsHtml(steps: Step[]): string {
  return `<div class="lw-steps">${steps
    .map((s) => {
      const body = s.body ? `<div>${esc(s.body)}</div>` : '';
      const d = Math.min(4, s.depth);
      return `<div class="lw-step d${d}"><b>${esc(s.title)}</b>${body}</div>`;
    })
    .join('')}</div>`;
}

function evidenceHtml(expr: string, pt: string, sides: ('left' | 'right')[]): string {
  try {
    const cols = sides.map((s) => ({ s, rows: evidenceTable(expr, pt, s) }));
    const n = cols[0].rows.length;
    let h = `<table class="dm-tbl"><thead><tr>${cols.map((c) => `<th>x (${c.s})</th><th>f(x)</th>`).join('')}</tr></thead><tbody>`;
    for (let i = 0; i < n; i++) h += `<tr>${cols.map((c) => `<td>${num(c.rows[i].x, 10)}</td><td>${num(c.rows[i].fx, 8)}</td>`).join('')}</tr>`;
    return h + '</tbody></table>';
  } catch (e) {
    return `<span class="muted">${esc((e as Error).message)}</span>`;
  }
}

/* ═══════════════════════════ Graph Lab (approach lab) ═══════════════════════════ */
interface Preset {
  label: string;
  f: string;
  a: string;
  view: [number, number, number, number];
}
const PRESETS: Record<string, Preset> = {
  hole: { label: 'Hole (removable)', f: '(x^2-4)/(x-2)', a: '2', view: [-1, 5, -1, 7] },
  jump: { label: 'Jump  |x|/x', f: 'abs(x)/x', a: '0', view: [-4, 4, -3, 3] },
  asym: { label: 'Vertical asymptote 1/x', f: '1/x', a: '0', view: [-5, 5, -6, 6] },
  asym2: { label: 'Infinite limit 1/x²', f: '1/x^2', a: '0', view: [-4, 4, -1, 10] },
  osc: { label: 'Oscillation sin(1/x)', f: 'sin(1/x)', a: '0', view: [-0.4, 0.4, -1.6, 1.6] },
  damp: { label: 'Squeeze x·sin(1/x)', f: 'x*sin(1/x)', a: '0', view: [-0.4, 0.4, -0.5, 0.5] },
  sinc: { label: 'sin x / x', f: 'sin(x)/x', a: '0', view: [-12, 12, -0.5, 1.5] },
  inf: { label: 'At infinity', f: '(3x^2+2)/(x^2-1)', a: 'inf', view: [-10, 10, -2, 8] },
  sqrt: { label: 'Domain edge √x', f: 'sqrt(x)', a: '0', view: [-2, 6, -1, 3] },
};

function mountApproachLab(host: HTMLElement, opts: { preset?: string } = {}): void {
  host.replaceChildren();
  const st = getState();
  const p0 = PRESETS[opts.preset || 'hole'];
  const wrap = mk('div', 'dm');
  const presetOpts = Object.entries(PRESETS)
    .map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`)
    .join('');
  wrap.innerHTML = `
    <div class="dm-ctrl">
      ${field('Preset', `<select data-k="preset"><option value="">Custom…</option>${presetOpts}</select>`)}
      ${field('f(x)', `<input data-k="f" type="text" value="${esc(opts.preset ? p0.f : st.graphF || p0.f)}" spellcheck="false" autocapitalize="off" aria-label="Function of x">`)}
      ${field('Approach point a', `<input data-k="a" type="text" value="${esc(opts.preset ? p0.a : st.graphA || p0.a)}" spellcheck="false" aria-label="Approach point">`)}
      ${field('Probe x (drag ▲ on graph)', `<input data-k="probe" type="number" step="any" aria-label="Probe x value">`)}
    </div>
    <div class="dm-row">
      <button type="button" data-a="left">▶ Approach from left</button>
      <button type="button" data-a="right">◀ Approach from right</button>
      <button type="button" data-a="stop">■ Stop</button>
      <button type="button" data-a="zoom">🔍 Zoom to a</button>
      <button type="button" data-a="fit">Reset view</button>
    </div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <div class="dm-two"><div class="dm-out" data-k="tabL"></div><div class="dm-out" data-k="tabR"></div></div>`;
  host.appendChild(wrap);
  const $ = <T extends HTMLElement>(k: string) => wrap.querySelector<T>(`[data-k="${k}"]`) as T;
  const fIn = $<HTMLInputElement>('f');
  const aIn = $<HTMLInputElement>('a');
  const pIn = $<HTMLInputElement>('probe');
  const presetSel = $<HTMLSelectElement>('preset');
  const out = $('out');
  let fn: ReturnType<typeof compileFn> | null = null;
  let aVal = 2;
  let aInf = 0;
  let aNode = 2;
  let probe = 1.5;
  let res: { l: LimitResult; r: LimitResult; t: LimitResult } | null = null;
  let timer = 0;

  const gv = mountGraph($('graph'), {
    height: 320,
    view: p0.view,
    scene: (): GScene => {
      const sc: GScene = { curves: [], points: [], lines: [], segs: [] };
      if (!fn) return sc;
      const f = fn.f;
      sc.curves!.push({ f, color: 'main' });
      if (!aInf) {
        sc.lines!.push({ kind: 'v', v: aNode, color: 'text', dash: [4, 4] });
        const fa = f(aNode);
        const lims: [LimitResult | undefined, string][] = [[res?.l, 'left'], [res?.r, 'right']];
        const finals = lims.filter(([r]) => r && r.status === 'value').map(([r]) => r!.num as number);
        if (res && res.t.status === 'value') {
          const L = res.t.num as number;
          sc.lines!.push({ kind: 'h', v: L, color: 'good', label: `L = ${num(L, 6)}` });
          if (!Number.isFinite(fa) || Math.abs(fa - L) > 1e-9) sc.points!.push({ x: aNode, y: L, kind: 'open', color: 'good' });
        } else {
          finals.forEach((L, i) => {
            sc.points!.push({ x: aNode, y: L, kind: 'open', color: i === 0 ? 'alt' : 'warn' });
          });
        }
        if (Number.isFinite(fa)) sc.points!.push({ x: aNode, y: fa, kind: 'filled', color: 'bad', label: `f(a)=${num(fa, 5)}` });
      } else if (res && res.t.status === 'value') {
        sc.lines!.push({ kind: 'h', v: res.t.num as number, color: 'good', label: `y = ${num(res.t.num as number, 6)}` });
      }
      const y0 = f(probe);
      if (Number.isFinite(y0)) {
        sc.points!.push({ x: probe, y: y0, kind: 'filled', color: 'alt', r: 5, label: `(${num(probe, 5)}, ${num(y0, 5)})` });
        sc.segs!.push({ x1: probe, y1: 0, x2: probe, y2: y0, color: 'alt', dash: [3, 3], width: 1 });
      }
      return sc;
    },
    handle: () => ({ x: probe, onMove: (x) => setProbe(x), label: 'x' }),
  });

  function setProbe(x: number) {
    probe = x;
    pIn.value = String(Number(x.toPrecision(10)));
    gv.draw();
  }

  function tables() {
    const l = $('tabL');
    const r = $('tabR');
    if (!fn) return;
    if (aInf) {
      l.innerHTML = `<b>x → ${aInf > 0 ? '+∞' : '−∞'}</b><br>${evidenceHtml(fIn.value, aIn.value, ['right'])}`;
      r.innerHTML = '<span class="an-note">Tables are numerical <b>evidence</b>, not proof. The result above comes from the symbolic engine.</span>';
    } else {
      l.innerHTML = `<b>x → a⁻</b> ${evidenceHtml(fIn.value, aIn.value, ['left'])}`;
      r.innerHTML = `<b>x → a⁺</b> ${evidenceHtml(fIn.value, aIn.value, ['right'])}`;
    }
  }

  function refresh(resetView = false) {
    stop();
    try {
      fn = compileFn(fIn.value);
      const pt = parsePoint(aIn.value);
      aInf = pt.inf;
      aVal = pt.a;
      aNode = pt.a;
      res = aInf
        ? { l: computeLimit(fIn.value, aIn.value), r: computeLimit(fIn.value, aIn.value), t: computeLimit(fIn.value, aIn.value) }
        : { l: computeLimit(fIn.value, aIn.value, 'left'), r: computeLimit(fIn.value, aIn.value, 'right'), t: computeLimit(fIn.value, aIn.value, 'both') };
      const t = res.t;
      const pill = t.status === 'value' || t.status === 'infinite' ? 'ok' : t.status === 'dne' ? 'bad' : 'warn';
      out.innerHTML = aInf
        ? `<span class="dm-badge ${pill}">${t.status === 'unsupported' ? 'UNSUPPORTED' : t.status === 'dne' ? 'NO LIMIT' : 'LIMIT'}</span> ${esc(t.headline)}`
        : `<span class="dm-badge ${pill}">${t.status === 'unsupported' ? 'UNSUPPORTED' : t.status === 'dne' ? 'NO TWO-SIDED LIMIT' : 'LIMIT EXISTS'}</span> ${esc(t.headline)}<br>
           Left-hand: <b>${esc(res.l.display)}</b> · Right-hand: <b>${esc(res.r.display)}</b> · f(a) = <b>${esc(num(fn.f(aNode), 8))}</b>`;
      if (resetView) {
        if (!probe || !Number.isFinite(probe) || resetView) probe = aInf ? 10 : aVal + (Math.abs(aVal) < 1 ? 0.5 : 0.5);
        pIn.value = String(probe);
      }
      tables();
    } catch (e) {
      fn = null;
      res = null;
      out.innerHTML = `<span class="dm-badge bad">ERROR</span> ${esc((e as Error).message)}`;
    }
    patchState({ graphF: fIn.value, graphA: aIn.value });
    gv.draw();
  }

  function stop() {
    if (timer) {
      window.clearInterval(timer);
      timer = 0;
    }
  }
  function animate(dir: 'left' | 'right') {
    stop();
    if (!fn) return;
    if (aInf) {
      probe = aInf > 0 ? 1 : -1;
      timer = window.setInterval(() => {
        probe *= 2;
        setProbe(probe);
        if (Math.abs(probe) > 1e8) stop();
      }, 380);
      return;
    }
    const s = dir === 'left' ? -1 : 1;
    let d = 1;
    probe = aNode + s * d;
    setProbe(probe);
    timer = window.setInterval(() => {
      d /= 2;
      probe = aNode + s * d;
      setProbe(probe);
      if (d < 1e-7) stop();
    }, 380);
  }

  fIn.addEventListener('change', () => {
    presetSel.value = '';
    refresh();
  });
  aIn.addEventListener('change', () => {
    presetSel.value = '';
    refresh(true);
  });
  pIn.addEventListener('input', () => {
    const v = parseFloat(pIn.value);
    if (Number.isFinite(v)) {
      probe = v;
      gv.draw();
    }
  });
  presetSel.addEventListener('change', () => {
    const p = PRESETS[presetSel.value];
    if (!p) return;
    fIn.value = p.f;
    aIn.value = p.a;
    gv.setView(...p.view, true);
    refresh(true);
  });
  wrap.querySelector<HTMLButtonElement>('[data-a="left"]')!.onclick = () => animate('left');
  wrap.querySelector<HTMLButtonElement>('[data-a="right"]')!.onclick = () => animate('right');
  wrap.querySelector<HTMLButtonElement>('[data-a="stop"]')!.onclick = stop;
  wrap.querySelector<HTMLButtonElement>('[data-a="zoom"]')!.onclick = () => {
    if (aInf) return;
    const w = Math.max(Math.abs(gv.x1 - gv.x0) / 8, 1e-3);
    const L = res && res.t.status === 'value' ? (res.t.num as number) : fn ? fn.f(aNode + 1e-6) : 0;
    const yc = Number.isFinite(L) ? L : 0;
    gv.setView(aNode - w, aNode + w, yc - w * 0.6, yc + w * 0.6);
  };
  wrap.querySelector<HTMLButtonElement>('[data-a="fit"]')!.onclick = () => gv.reset();
  if (opts.preset) presetSel.value = opts.preset;
  refresh(true);
  // stop any running animation when the node leaves the DOM
  new MutationObserver(() => {
    if (!document.body.contains(wrap)) {
      stop();
      gv.dispose();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

/* ═══════════════════════════ ε–δ lab ═══════════════════════════ */
export function formalProof(expr: string, aText: string, epsTxt: string): string | null {
  const pc = polyCoeffs(expr);
  const a = parsePoint(aText);
  if (!pc || a.inf !== 0 || !a.aq) return null;
  const c = pc.coeffs.map(qToNumber);
  const aq = qToNumber(a.aq);
  const aStr = qToString(a.aq);
  const deg = c.length - 1;
  const ev = (x: number) => c.reduceRight((acc, k) => acc * x + k, 0);
  const L = ev(aq);
  if (deg <= 0) return `f(x) = ${num(c[0])} is constant. Then |f(x) − L| = 0 < ε for every x, so any δ works (e.g. δ = 1). ∎`;
  if (deg === 1) {
    const m = c[1];
    return `Scratch work. |f(x) − L| = |${num(m)}x + ${num(c[0])} − ${num(L)}| = ${num(Math.abs(m))}·|x − ${aStr}|, which is < ε when |x − ${aStr}| < ε/${num(Math.abs(m))}.\nProof. Let ε > 0 and choose δ = ε/${num(Math.abs(m))}. If 0 < |x − ${aStr}| < δ then |f(x) − ${num(L)}| = ${num(Math.abs(m))}|x − ${aStr}| < ${num(Math.abs(m))}δ = ε. ∎  (for ε = ${epsTxt}: δ = ${num(parseFloat(epsTxt) / Math.abs(m), 6)})`;
  }
  if (deg === 2) {
    const [, q, p] = c;
    const K = Math.abs(p) * (2 * Math.abs(aq) + 1) + Math.abs(q);
    return `Scratch work. f(x) − f(a) = (x − ${aStr})·[${num(p)}(x + ${aStr}) + ${num(q)}]. Restrict δ ≤ 1, so |x − ${aStr}| < 1 and |x + ${aStr}| < ${num(2 * Math.abs(aq) + 1)}. Then |p(x+a) + q| ≤ ${num(Math.abs(p))}·${num(2 * Math.abs(aq) + 1)} + ${num(Math.abs(q))} = ${num(K)} =: K.\nSo |f(x) − L| ≤ K|x − ${aStr}| < ε if |x − ${aStr}| < ε/K.\nProof. Let ε > 0, choose δ = min(1, ε/${num(K)}). If 0 < |x − ${aStr}| < δ then |f(x) − ${num(L)}| ≤ K|x − ${aStr}| < Kδ ≤ ε. ∎  (for ε = ${epsTxt}: δ = ${num(Math.min(1, parseFloat(epsTxt) / K), 6)})`;
  }
  return null;
}

function mountEpsDeltaLab(host: HTMLElement): void {
  host.replaceChildren();
  const wrap = mk('div', 'dm');
  wrap.innerHTML = `
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="f" type="text" value="x^2" spellcheck="false">`)}
      ${field('Point a', `<input data-k="a" type="text" value="2" spellcheck="false">`)}
      ${field('Limit L (blank = auto)', `<input data-k="L" type="text" value="" placeholder="auto" spellcheck="false">`)}
      ${field('ε = <span data-k="epsv">0.5</span>', `<input data-k="eps" type="range" min="-3" max="0.7" step="0.01" value="-0.3">`)}
    </div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <details class="lsn-det" open><summary>Formal ε–δ proof (exact, polynomial f of degree ≤ 2)</summary><div class="lsn-prose"><div data-k="proof" style="white-space:pre-wrap"></div></div></details>
    <details class="lsn-det"><summary>Sequential characterisation: f(xₙ) along sequences xₙ → a</summary><div class="lsn-prose"><div data-k="seq"></div></div></details>`;
  host.appendChild(wrap);
  const $ = <T extends HTMLElement>(k: string) => wrap.querySelector<T>(`[data-k="${k}"]`) as T;
  let fn: ReturnType<typeof compileFn> | null = null;
  let a = 2;
  let L = 4;
  let eps = 0.5;
  let delta = 0;
  const gv = mountGraph($('graph'), {
    height: 320,
    view: [-1, 5, -2, 12],
    scene: (): GScene => {
      if (!fn) return {};
      return {
        bands: [
          { kind: 'h', lo: L - eps, hi: L + eps, color: 'alt', label: 'ε-band' },
          { kind: 'v', lo: a - delta, hi: a + delta, color: 'warn', label: 'δ-window' },
        ],
        curves: [{ f: fn.f, color: 'main' }],
        lines: [
          { kind: 'h', v: L, color: 'good', label: 'L' },
          { kind: 'v', v: a, color: 'text' },
        ],
        points: [{ x: a, y: L, kind: 'open', color: 'good' }],
      };
    },
  });
  function refresh() {
    const out = $('out');
    try {
      const fText = $<HTMLInputElement>('f').value;
      fn = compileFn(fText);
      const pt = parsePoint($<HTMLInputElement>('a').value);
      if (pt.inf) throw new Error('Choose a finite point a for the ε–δ lab.');
      a = pt.a;
      const Ltxt = $<HTMLInputElement>('L').value.trim();
      let Ltext = '';
      if (Ltxt) {
        L = parsePoint(Ltxt).a;
        Ltext = Ltxt;
      } else {
        const r = computeLimit(fText, $<HTMLInputElement>('a').value);
        if (r.status !== 'value') throw new Error(`The two-sided limit does not exist as a finite number here (${r.display}). No ε–δ proof of a finite limit is possible.`);
        L = r.num as number;
        Ltext = r.display;
      }
      eps = Math.pow(10, parseFloat($<HTMLInputElement>('eps').value));
      $('epsv').textContent = num(eps, 3);
      delta = deltaForEpsilon(fn.f, a, L, eps, Math.max(1, Math.abs(gv.x1 - gv.x0)));
      out.innerHTML = `<span class="dm-badge ok">L = ${esc(Ltext)}</span> For ε = <b>${num(eps, 4)}</b> the largest δ (numerical, by bisection) is <b>≈ ${num(delta, 4)}</b>: every x with 0 < |x − a| < ${num(delta, 4)} keeps f(x) inside (L − ε, L + ε). <span class="an-note">Shrink ε and watch δ shrink — a limit means δ exists for every ε.</span>`;
      const pf = formalProof(fText, $<HTMLInputElement>('a').value, num(eps, 4));
      $('proof').textContent = pf || 'A formal proof is generated only for polynomials of degree ≤ 2 (the numerical δ above is evidence, not a proof). For rational functions use the technique of Lesson 3: bound the extra factor with δ ≤ 1.';
      seqTable(fText);
    } catch (e) {
      fn = null;
      out.innerHTML = `<span class="dm-badge bad">ERROR</span> ${esc((e as Error).message)}`;
    }
    gv.draw();
  }
  function seqTable(fText: string) {
    if (!fn) return;
    const ns = [1, 2, 5, 10, 100, 1000, 10000];
    const seqs: { name: string; x: (n: number) => number }[] = [
      { name: 'xₙ = a + 1/n', x: (n) => a + 1 / n },
      { name: 'yₙ = a − 1/n', x: (n) => a - 1 / n },
      { name: 'zₙ = a + 1/(nπ)', x: (n) => a + 1 / (n * Math.PI) },
      { name: 'wₙ = a + 1/(2nπ + π/2)', x: (n) => a + 1 / (2 * n * Math.PI + Math.PI / 2) },
    ];
    let h = `<table class="dm-tbl"><thead><tr><th>n</th>${seqs.map((s) => `<th>f(${esc(s.name)})</th>`).join('')}</tr></thead><tbody>`;
    for (const n of ns) h += `<tr><td>${n}</td>${seqs.map((s) => `<td>${num(fn!.f(s.x(n)), 6)}</td>`).join('')}</tr>`;
    h += `</tbody></table><p class="an-note">If lim f(x) = L exists, every column must tend to L. Columns that settle on different numbers prove that no limit exists (try f = sin(1/(x − a))…). Here f = ${esc(fText)}.</p>`;
    $('seq').innerHTML = h;
  }
  wrap.querySelectorAll('input').forEach((i) => i.addEventListener('input', refresh));
  refresh();
  const aPt = a;
  void aPt;
}

/* ═══════════════════════════ Continuity & IVT ═══════════════════════════ */
const KIND_BADGE: Record<string, string> = { continuous: 'ok', removable: 'warn', jump: 'warn', infinite: 'bad', essential: 'bad', 'one-sided': 'warn', undefined: 'bad', unsupported: 'warn' };

function mountContinuityLab(host: HTMLElement): void {
  host.replaceChildren();
  const wrap = mk('div', 'dm');
  wrap.innerHTML = `
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="f" type="text" value="(x^2-1)/(x-1)" spellcheck="false">`)}
      ${field('Point a', `<input data-k="a" type="text" value="1" spellcheck="false">`)}
      <button type="button" class="primary" data-a="run">Analyse continuity</button>
    </div>
    <div class="lw-ex" data-k="ex"></div>
    <div data-k="graph"></div>
    <div class="dm-out" data-k="out" aria-live="polite"></div>
    <h4 style="margin:14px 0 4px">Intermediate Value Theorem lab (bisection)</h4>
    <div class="dm-ctrl">
      ${field('f(x)', `<input data-k="g" type="text" value="x^3+x-1" spellcheck="false">`)}
      ${field('a', `<input data-k="ia" type="text" value="0" spellcheck="false">`)}
      ${field('b', `<input data-k="ib" type="text" value="1" spellcheck="false">`)}
      ${field('Target value N', `<input data-k="iN" type="text" value="0" spellcheck="false">`)}
      <button type="button" class="primary" data-a="ivt">Run bisection</button>
    </div>
    <div data-k="igraph"></div>
    <div class="dm-out" data-k="iout" aria-live="polite"></div>`;
  host.appendChild(wrap);
  const $ = <T extends HTMLElement>(k: string) => wrap.querySelector<T>(`[data-k="${k}"]`) as T;
  const examples: [string, string, string][] = [
    ['hole', '(x^2-1)/(x-1)', '1'],
    ['jump', 'abs(x)/x', '0'],
    ['asymptote', '1/(x-2)', '2'],
    ['oscillation', 'sin(1/x)', '0'],
    ['continuous', 'x^2+3x', '2'],
    ['√x edge', 'sqrt(x)', '0'],
  ];
  const exBox = $('ex');
  examples.forEach(([n, f, a]) => {
    const b = mk('button', '', n) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      $<HTMLInputElement>('f').value = f;
      $<HTMLInputElement>('a').value = a;
      run();
    };
    exBox.appendChild(b);
  });

  let fn: ReturnType<typeof compileFn> | null = null;
  let aVal = 1;
  let rep: ReturnType<typeof analyzeContinuity> | null = null;
  let Lval: number | null = null;
  const gv = mountGraph($('graph'), {
    height: 280,
    view: [-3, 5, -3, 6],
    scene: (): GScene => {
      const sc: GScene = { points: [], lines: [] };
      if (!fn) return sc;
      sc.curves = [{ f: fn.f, color: 'main' }];
      sc.lines!.push({ kind: 'v', v: aVal, color: 'text', dash: [4, 4] });
      const fa = fn.f(aVal);
      if (rep && (rep.kind === 'removable' || rep.kind === 'jump') && Lval !== null) sc.points!.push({ x: aVal, y: Lval, kind: 'open', color: 'good' });
      if (Number.isFinite(fa)) sc.points!.push({ x: aVal, y: fa, kind: 'filled', color: 'bad' });
      return sc;
    },
  });
  function run() {
    const out = $('out');
    try {
      const ftxt = $<HTMLInputElement>('f').value;
      const atxt = $<HTMLInputElement>('a').value;
      fn = compileFn(ftxt);
      aVal = parsePoint(atxt).a;
      rep = analyzeContinuity(ftxt, atxt);
      const two = computeLimit(ftxt, atxt);
      Lval = two.status === 'value' ? (two.num as number) : null;
      if (Lval === null) {
        const l = computeLimit(ftxt, atxt, 'left');
        if (l.status === 'value') Lval = l.num as number;
      }
      out.innerHTML = `<span class="dm-badge ${KIND_BADGE[rep.kind] || 'warn'}">${esc(rep.title.toUpperCase())}</span>
        <div style="margin-top:6px">f(a) = <b>${esc(rep.fa)}</b> · left limit = <b>${esc(rep.left)}</b> · right limit = <b>${esc(rep.right)}</b></div>
        <div style="margin-top:6px">${esc(rep.detail)}</div>${stepsHtml(rep.steps)}`;
    } catch (e) {
      fn = null;
      out.innerHTML = `<span class="dm-badge bad">ERROR</span> ${esc((e as Error).message)}`;
    }
    gv.draw();
  }
  wrap.querySelector<HTMLButtonElement>('[data-a="run"]')!.onclick = run;
  $<HTMLInputElement>('f').addEventListener('change', run);
  $<HTMLInputElement>('a').addEventListener('change', run);

  /* IVT lab */
  let g: ReturnType<typeof compileFn> | null = null;
  let iv: { lo: number; hi: number; root: number | null; a: number; b: number; N: number } | null = null;
  const ig = mountGraph($('igraph'), {
    height: 260,
    view: [-0.5, 1.5, -2, 2],
    scene: (): GScene => {
      if (!g || !iv) return {};
      const sc: GScene = { curves: [{ f: g.f, color: 'main' }], lines: [{ kind: 'h', v: iv.N, color: 'warn', label: `y = ${num(iv.N, 5)}` }], points: [], bands: [] };
      sc.bands!.push({ kind: 'v', lo: iv.lo, hi: iv.hi, color: 'good' });
      if (iv.root !== null) sc.points!.push({ x: iv.root, y: iv.N, kind: 'filled', color: 'good', label: `c ≈ ${num(iv.root, 6)}` });
      sc.points!.push({ x: iv.a, y: g.f(iv.a), kind: 'filled', color: 'alt' }, { x: iv.b, y: g.f(iv.b), kind: 'filled', color: 'alt' });
      return sc;
    },
  });
  function ivt() {
    const out = $('iout');
    try {
      g = compileFn($<HTMLInputElement>('g').value);
      const a = parsePoint($<HTMLInputElement>('ia').value).a;
      const b = parsePoint($<HTMLInputElement>('ib').value).a;
      const N = parsePoint($<HTMLInputElement>('iN').value).a;
      if (!(b > a)) throw new Error('Need a < b.');
      const F = (x: number) => g!.f(x) - N;
      const fa = F(a);
      const fb = F(b);
      if (!Number.isFinite(fa) || !Number.isFinite(fb)) throw new Error('f is undefined at an endpoint.');
      // continuity scan (numerical warning only)
      const n = 800;
      let warn = '';
      let prev = F(a);
      let sum = 0;
      const ds: number[] = [];
      for (let i = 1; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        const y = F(x);
        if (!Number.isFinite(y)) {
          warn = `f is undefined near x ≈ ${num(x, 5)}`;
          break;
        }
        ds.push(Math.abs(y - prev));
        sum += Math.abs(y - prev);
        prev = y;
      }
      if (!warn && ds.length) {
        const avg = sum / ds.length;
        const idx = ds.findIndex((d) => d > 12 * avg + 1e-3);
        if (idx >= 0) warn = `a sudden jump appears near x ≈ ${num(a + ((b - a) * (idx + 1)) / n, 5)}`;
      }
      const lines: string[] = [];
      if (warn) lines.push(`<span class="dm-badge warn">POSSIBLE DISCONTINUITY</span> ${esc(warn)} (detected numerically — it can miss narrow features). The IVT needs f continuous on [a, b]; verify it before trusting the result.`);
      if (fa * fb > 0) {
        iv = { lo: a, hi: b, root: null, a, b, N };
        lines.push(`<span class="dm-badge warn">NO SIGN CHANGE</span> f(a) − N = ${num(fa, 6)} and f(b) − N = ${num(fb, 6)} have the same sign, so the IVT does not guarantee a solution of f(x) = N in (a, b). (A solution may still exist — the theorem is only a sufficient condition.)`);
        out.innerHTML = lines.join('<br>');
        ig.setView(a - (b - a) * 0.25, b + (b - a) * 0.25, Math.min(fa, fb) + N - 2, Math.max(fa, fb) + N + 2);
        return;
      }
      let lo = a;
      let hi = b;
      let flo = fa;
      const rows: string[] = [];
      for (let k = 1; k <= 60 && hi - lo > 1e-10; k++) {
        const m = (lo + hi) / 2;
        const fm = F(m);
        if (k <= 12) rows.push(`<tr><td>${k}</td><td>${num(lo, 8)}</td><td>${num(hi, 8)}</td><td>${num(m, 8)}</td><td>${num(fm + N, 6)}</td></tr>`);
        if (fm === 0) {
          lo = hi = m;
          break;
        }
        if (flo * fm < 0) hi = m;
        else {
          lo = m;
          flo = fm;
        }
      }
      const root = (lo + hi) / 2;
      iv = { lo, hi, root, a, b, N };
      lines.push(`<span class="dm-badge ok">IVT APPLIES</span> f(a) − N and f(b) − N have opposite signs, so (if f is continuous on [a, b]) some c ∈ (a, b) has f(c) = ${num(N, 6)}.`);
      lines.push(`Bisection locates c ∈ [${num(lo, 10)}, ${num(hi, 10)}], c ≈ <b>${num(root, 9)}</b> (numerical approximation; each step halves the interval, so after n steps the error is at most (b − a)/2ⁿ).`);
      out.innerHTML = `${lines.join('<br>')}<table class="dm-tbl" style="margin-top:8px"><thead><tr><th>n</th><th>lower</th><th>upper</th><th>midpoint</th><th>f(mid)</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
      ig.setView(a - (b - a) * 0.25, b + (b - a) * 0.25, Math.min(fa, fb) + N - 1.5, Math.max(fa, fb) + N + 1.5);
    } catch (e) {
      g = null;
      iv = null;
      out.innerHTML = `<span class="dm-badge bad">ERROR</span> ${esc((e as Error).message)}`;
    }
    ig.draw();
  }
  wrap.querySelector<HTMLButtonElement>('[data-a="ivt"]')!.onclick = ivt;
  run();
  ivt();
}

/* ═══════════════════════════ Technique lab (chapter 2 demo) ═══════════════════════════ */
function mountTechniqueDemo(host: HTMLElement): void {
  host.replaceChildren();
  const T: [string, string, string][] = [
    ['Factor & cancel', '(x^3-8)/(x-2)', '2'],
    ['Rationalise', '(sqrt(x+4)-2)/x', '0'],
    ["L'Hôpital", '(1-cos(x))/x^2', '0'],
    ['Common denominator', '1/(x-1)-2/(x^2-1)', '1'],
    ['At infinity', 'sqrt(x^2+3x)-x', 'inf'],
    ['1^∞ form', '(1+2/x)^(3x)', 'inf'],
  ];
  const wrap = mk('div', 'dm');
  wrap.innerHTML = `<div class="lw-ex" data-k="ex"></div><div data-k="graph"></div><div class="dm-out" data-k="out" aria-live="polite"></div>`;
  host.appendChild(wrap);
  const $ = <T extends HTMLElement>(k: string) => wrap.querySelector<T>(`[data-k="${k}"]`) as T;
  let fn: ReturnType<typeof compileFn> | null = null;
  let aV = 2;
  let aInf = 0;
  let L: number | null = null;
  const gv = mountGraph($('graph'), {
    height: 300,
    view: [-1, 5, -2, 14],
    scene: (): GScene => {
      if (!fn) return {};
      const sc: GScene = { curves: [{ f: fn.f, color: 'main' }], points: [], lines: [] };
      if (!aInf) {
        sc.lines!.push({ kind: 'v', v: aV, color: 'text' });
        if (L !== null) {
          sc.points!.push({ x: aV, y: L, kind: 'open', color: 'good', label: `L = ${num(L, 6)}` });
          sc.lines!.push({ kind: 'h', v: L, color: 'good' });
        }
      } else if (L !== null) sc.lines!.push({ kind: 'h', v: L, color: 'good', label: `y = ${num(L, 6)}` });
      return sc;
    },
  });
  function run(f: string, a: string) {
    const out = $('out');
    try {
      fn = compileFn(f);
      const pt = parsePoint(a);
      aInf = pt.inf;
      aV = pt.a;
      const r = computeLimit(f, a);
      L = r.status === 'value' ? (r.num as number) : null;
      if (aInf) gv.setView(-10, 20, (L ?? 0) - 4, (L ?? 0) + 4);
      else gv.setView(aV - 3, aV + 3, (L ?? 0) - 6, (L ?? 0) + 8);
      out.innerHTML = `<div class="lw-head">${esc(r.headline)}</div><div class="lw-chips"><span class="dm-badge ${r.status === 'value' ? 'ok' : 'warn'}">${esc(r.method)}</span></div>${stepsHtml(r.steps)}`;
    } catch (e) {
      out.innerHTML = `<span class="dm-badge bad">ERROR</span> ${esc((e as Error).message)}`;
    }
    gv.draw();
  }
  T.forEach(([n, f, a], i) => {
    const b = mk('button', '', n) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => run(f, a);
    $('ex').appendChild(b);
    if (i === 0) run(f, a);
  });
}

/* ═══════════════════════════ Calculator ═══════════════════════════ */
const CALC_EXAMPLES: [string, string, string, string][] = [
  ['(x²−4)/(x−2)', '(x²-4)/(x-2)', '2', 'both'],
  ['sin x / x', 'sin(x)/x', '0', 'both'],
  ['(3x²+2)/(x²−1)  x→∞', '(3x^2+2)/(x^2-1)', 'inf', 'both'],
  ['(1−cos x)/x²', '(1-cos(x))/x^2', '0', 'both'],
  ['(√(x+1)−1)/x', '(sqrt(x+1)-1)/x', '0', 'both'],
  ['1/x  (x→0)', '1/x', '0', 'both'],
  ['|x|/x', 'abs(x)/x', '0', 'both'],
  ['x·ln x  (x→0⁺)', 'x*ln(x)', '0', 'right'],
  ['(1+1/x)^x', '(1+1/x)^x', 'inf', 'both'],
  ['√(x²+x) − x', 'sqrt(x^2+x)-x', 'inf', 'both'],
  ['sin(1/x)', 'sin(1/x)', '0', 'both'],
  ['x·sin(1/x)', 'x*sin(1/x)', '0', 'both'],
];

function mountCalculator(root: HTMLElement, goGraph: (f: string, a: string) => void): { restore: (s: unknown) => void } {
  root.replaceChildren();
  const st = getState();
  const wrap = mk('div', 'grid');
  wrap.innerHTML = `
    <section class="card s5">
      <h3><span class="n">01</span>Limit Calculator</h3>
      ${field('Expression or full notation', `<input data-k="expr" id="limExpr" type="text" inputmode="text" spellcheck="false" autocapitalize="off" value="${esc(st.expr || '(x^2-4)/(x-2)')}" placeholder="lim(x→2) (x²−4)/(x−2)   or   (x²−4)/(x−2)">`)}
      <div class="vin" style="margin-top:8px">
        ${field('x approaches', `<input data-k="pt" id="limPt" type="text" spellcheck="false" value="${esc(st.pt || '2')}" placeholder="2, π, 1/2, inf, -inf">`)}
        ${field('Direction', `<select data-k="side" id="limSide"><option value="both">two-sided</option><option value="left">from the left (a⁻)</option><option value="right">from the right (a⁺)</option></select>`)}
      </div>
      <div class="lw-ex" style="margin-top:8px" data-k="sym"></div>
      <div class="calcrow" style="margin-top:12px"><button type="button" class="primary" id="limRun" data-a="run">Calculate limit</button><button type="button" data-a="graph">Show on graph</button></div>
      <p class="hint">Use <code class="mxr-code">^</code> for powers (x², x^2), sqrt(), sin, cos, tan, ln, log (base 10), exp, abs, pi, e. Supports finite points, π, e, fractions and ±∞.</p>
      <h4 style="margin:12px 0 6px;font-size:13px">Examples</h4>
      <div class="lw-ex" data-k="ex"></div>
    </section>
    <section class="card s7">
      <h3><span class="n">02</span>Result &amp; Working</h3>
      <div id="limRes" class="resultbox" aria-live="polite" data-k="res">Enter a limit and press Calculate.</div>
      <div data-k="steps"></div>
      <details class="lsn-det" data-k="evd" hidden><summary>Numerical evidence table (not a proof)</summary><div class="lsn-prose" data-k="evb"></div></details>
    </section>`;
  root.appendChild(wrap);
  const $ = <T extends HTMLElement>(k: string) => wrap.querySelector<T>(`[data-k="${k}"]`) as T;
  const exprIn = $<HTMLInputElement>('expr');
  const ptIn = $<HTMLInputElement>('pt');
  const sideSel = $<HTMLSelectElement>('side');
  if (st.side) sideSel.value = st.side;

  const syms: [string, string][] = [['x²', '^2'], ['x³', '^3'], ['√', 'sqrt('], ['π', 'pi'], ['∞', 'inf'], ['|x|', 'abs('], ['ln', 'ln('], ['eˣ', 'exp('], ['sin', 'sin('], ['cos', 'cos(']];
  syms.forEach(([lab, ins]) => {
    const b = mk('button', '', lab) as HTMLButtonElement;
    b.type = 'button';
    b.setAttribute('aria-label', `Insert ${ins}`);
    b.onclick = () => {
      const target = ins === 'inf' ? ptIn : exprIn;
      const s = target.selectionStart ?? target.value.length;
      target.value = target.value.slice(0, s) + ins + target.value.slice((target.selectionEnd ?? s));
      target.focus();
      const p = s + ins.length;
      target.setSelectionRange(p, p);
    };
    $('sym').appendChild(b);
  });
  CALC_EXAMPLES.forEach(([lab, e, a, s]) => {
    const b = mk('button', '', esc(lab)) as HTMLButtonElement;
    b.type = 'button';
    b.onclick = () => {
      exprIn.value = e;
      ptIn.value = a;
      sideSel.value = s;
      calc(true);
    };
    $('ex').appendChild(b);
  });

  function calc(record: boolean) {
    const box = $('res');
    const stepsBox = $('steps');
    let expr = exprIn.value.trim();
    let pt = ptIn.value.trim();
    let side = sideSel.value as 'both' | 'left' | 'right';
    const parsed = parseLimitNotation(expr);
    if (parsed) {
      expr = parsed.expr.trim();
      if (parsed.point) pt = parsed.point;
      if (parsed.side) side = parsed.side;
      exprIn.value = expr;
      ptIn.value = pt;
      sideSel.value = side;
    }
    if (!expr) {
      box.className = 'resultbox s-err';
      box.textContent = 'Enter an expression in x.';
      stepsBox.innerHTML = '';
      return;
    }
    const r = computeLimit(expr, pt, side);
    patchState({ expr, pt, side });
    box.className = 'resultbox reveal ' + (r.status === 'value' || r.status === 'infinite' ? 's-ok' : r.status === 'dne' ? '' : 's-err');
    const exactBadge =
      r.status === 'unsupported' || r.status === 'error'
        ? `<span class="dm-badge warn">NOT SOLVED</span>`
        : `<span class="dm-badge ok">SYMBOLIC · PROVED</span> <span class="dm-badge">${esc(r.method)}</span>`;
    box.innerHTML = `<div class="lw-head">${esc(r.headline)}</div><div class="lw-chips">${exactBadge}${r.left ? `<span class="dm-badge">left: ${esc(r.left)}</span>` : ''}${r.right ? `<span class="dm-badge">right: ${esc(r.right)}</span>` : ''}</div>${r.notes.map((n) => `<div class="an-note">${esc(n)}</div>`).join('')}`;
    if (r.status === 'unsupported' || r.status === 'error') {
      box.classList.add('lw-unsup');
      box.innerHTML += `<div class="an-note" style="margin-top:6px"><b>No answer is claimed.</b> ${r.status === 'unsupported' ? 'This expression is outside the cases the engine can prove. The table below is numerical <b>evidence only</b>; use it to guess, then justify by hand (squeeze, sequences, ε–δ).' : ''}</div>`;
    }
    stepsBox.innerHTML = stepsHtml(r.steps);
    const evd = $('evd') as HTMLDetailsElement;
    if (r.status !== 'error') {
      evd.hidden = false;
      const sides: ('left' | 'right')[] = parsePointSafe(pt) ? ['right'] : side === 'left' ? ['left'] : side === 'right' ? ['right'] : ['left', 'right'];
      $('evb').innerHTML = evidenceHtml(expr, pt, sides);
      evd.open = r.status === 'unsupported';
    } else evd.hidden = true;
    if (record && r.status !== 'error') {
      window.__mnx?.pushHist({ mod: MOD, title: `Limit: ${expr} → ${pt}`, txt: r.headline, state: { expr, pt, side } });
    }
  }
  function parsePointSafe(p: string): boolean {
    try {
      return parsePoint(p).inf !== 0;
    } catch {
      return false;
    }
  }
  wrap.querySelector<HTMLButtonElement>('[data-a="run"]')!.onclick = () => calc(true);
  wrap.querySelector<HTMLButtonElement>('[data-a="graph"]')!.onclick = () => {
    const parsed = parseLimitNotation(exprIn.value.trim());
    goGraph(parsed ? parsed.expr : exprIn.value, parsed?.point || ptIn.value);
  };
  [exprIn, ptIn].forEach((i) => i.addEventListener('keydown', (e) => e.key === 'Enter' && calc(true)));
  calc(false);
  return {
    restore: (s: unknown) => {
      const o = s as { expr: string; pt: string; side: string };
      exprIn.value = o.expr;
      ptIn.value = o.pt;
      sideSel.value = o.side;
      calc(false);
    },
  };
}

/* ═══════════════════════════ init ═══════════════════════════ */
export function initLimitsModule(): void {
  if (initialized) return;
  const root = document.getElementById('mod-limits');
  if (!root || !window.__mnx) return;
  const nav = root.querySelector<HTMLElement>('#limSubnav');
  const panels = root.querySelector<HTMLElement>('#limPanels');
  if (!nav || !panels) return;
  initialized = true;
  setCAS(window.__mnx.CAS as never);

  panels.innerHTML = `
    <div data-subpanel="lessons"><div id="limLessons"></div></div>
    <div data-subpanel="calc" hidden><div id="limCalc"></div></div>
    <div data-subpanel="graph" hidden><section class="card"><h3><span class="n">03</span>Interactive Graph Lab — approach points &amp; one-sided limits</h3><div id="limGraph"></div></section></div>
    <div data-subpanel="eps" hidden><section class="card"><h3><span class="n">04</span>ε–δ Lab — formal definition made visible</h3><div id="limEps"></div></section></div>
    <div data-subpanel="cont" hidden><section class="card"><h3><span class="n">05</span>Continuity Analyzer &amp; Intermediate Value Theorem</h3><div id="limCont"></div></section></div>`;
  const q = <T extends HTMLElement>(id: string) => panels.querySelector<T>(`#${id}`) as T;

  const demos: Record<string, DemoMounter> = {
    'lim-approach': (h) => mountApproachLab(h, { preset: 'hole' }),
    'lim-techniques': mountTechniqueDemo,
    'lim-epsdelta': mountEpsDeltaLab,
    'lim-continuity': mountContinuityLab,
  };
  const lessons = mountLessons({ mod: MOD, chapters: LIMIT_CHAPTERS, demos, container: q('limLessons') });
  void lessons;

  let activate: (id: string) => void = () => undefined;
  const mounted: Record<string, boolean> = {};
  const lazy = (tab: string) => {
    if (mounted[tab]) return;
    mounted[tab] = true;
    if (tab === 'graph') mountApproachLab(q('limGraph'), {});
    if (tab === 'eps') mountEpsDeltaLab(q('limEps'));
    if (tab === 'cont') mountContinuityLab(q('limCont'));
  };
  const calc = mountCalculator(q('limCalc'), (f, a) => {
    mounted.graph = false;
    patchState({ graphF: f, graphA: a });
    activate('graph');
  });

  const tabs = [
    { id: 'lessons', label: 'Lessons' },
    { id: 'calc', label: 'Limit Calculator' },
    { id: 'graph', label: 'Graph Lab' },
    { id: 'eps', label: 'ε–δ Lab' },
    { id: 'cont', label: 'Continuity & IVT' },
  ];
  const saved = getState().tab;
  activate = wireSubnav(nav, panels, tabs, saved && tabs.some((t) => t.id === saved) ? saved : 'lessons', (id) => {
    lazy(id);
    patchState({ tab: id });
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  });
  window.__mnx.registerRestore(MOD, (s) => {
    activate('calc');
    calc.restore(s);
  });
}

void GView;
void rich;
void tex;
