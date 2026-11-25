/* MATHNEX Limits engine.
   Works on the AST of the existing MATHNEX CAS (window.__mnx.CAS): exact rational arithmetic (BigInt),
   exact polynomial factor/cancel, limit laws, L'Hôpital (exact derivatives from the CAS),
   rationalization, common denominators, squeeze theorem, one-sided analysis.

   Honesty rules:
   • A result is reported as a proven value only when one of the symbolic methods above produced it.
   • Numerical sampling is used only to decide *signs* near a point (e.g. the sign of a denominator that tends to 0)
     and to display evidence tables — it is never presented as a proof.
   • Anything outside the supported class is reported as unsupported (no invented answers). */

/* ───────────────────────── CAS typings ───────────────────────── */
export interface QQ {
  n: bigint;
  d: bigint;
}
export interface Node {
  t: 'n' | 'v' | 'c' | 'b' | 'f' | 'g';
  v?: QQ;
  n?: string;
  o?: string;
  l?: Node;
  r?: Node;
  a?: Node;
}
export interface CASApi {
  parse: (s: string) => Node;
  str: (n: Node) => string;
  simp: (n: Node) => Node;
  evalN: (n: Node, env: Record<string, number>) => number;
  evalQ: (n: Node, env: Record<string, QQ>) => QQ | null;
  diff: (n: Node, v: string) => { res: Node; steps: { rule: string; t: string }[] };
}

let CAS: CASApi | null = null;
export function setCAS(c: CASApi): void {
  CAS = c;
}
function cas(): CASApi {
  if (!CAS) throw new Error('CAS engine is not available.');
  return CAS;
}

/* ───────────────────────── rational + polynomial ───────────────────────── */
const gcdB = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
const mkQ = (n: bigint, d: bigint = 1n): QQ => {
  if (d === 0n) throw new Error('Division by zero');
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcdB(n, d) || 1n;
  return { n: n / g, d: d / g };
};
const qAdd = (a: QQ, b: QQ) => mkQ(a.n * b.d + b.n * a.d, a.d * b.d);
const qSub = (a: QQ, b: QQ) => mkQ(a.n * b.d - b.n * a.d, a.d * b.d);
const qMul = (a: QQ, b: QQ) => mkQ(a.n * b.n, a.d * b.d);
const qDiv = (a: QQ, b: QQ) => mkQ(a.n * b.d, a.d * b.n);
const qNeg = (a: QQ) => mkQ(-a.n, a.d);
const qZero = (a: QQ) => a.n === 0n;
const qNum = (a: QQ) => Number(a.n) / Number(a.d);
const qSign = (a: QQ) => (a.n > 0n ? 1 : a.n < 0n ? -1 : 0);
const Q0 = mkQ(0n);
const Q1 = mkQ(1n);
export const qStr = (a: QQ): string => (a.d === 1n ? a.n.toString() : `${a.n}/${a.d}`);

type Poly = QQ[]; // index = power
const pTrim = (p: Poly): Poly => {
  const r = [...p];
  while (r.length > 1 && qZero(r[r.length - 1])) r.pop();
  return r.length ? r : [Q0];
};
const pDeg = (p: Poly) => (p.length === 1 && qZero(p[0]) ? -1 : p.length - 1);
const pAdd = (a: Poly, b: Poly): Poly => {
  const r: Poly = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) r.push(qAdd(a[i] || Q0, b[i] || Q0));
  return pTrim(r);
};
const pNeg = (a: Poly): Poly => a.map(qNeg);
const pMul = (a: Poly, b: Poly): Poly => {
  const r: Poly = Array.from({ length: a.length + b.length - 1 }, () => Q0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) r[i + j] = qAdd(r[i + j], qMul(a[i], b[j]));
  return pTrim(r);
};
const pEval = (p: Poly, x: QQ): QQ => p.reduceRight((acc, c) => qAdd(qMul(acc, x), c), Q0);
function pDivmod(a: Poly, b: Poly): { q: Poly; r: Poly } {
  let r = [...a];
  const db = pDeg(b);
  const q: Poly = Array.from({ length: Math.max(1, a.length - db) }, () => Q0);
  while (pDeg(r) >= db && pDeg(r) >= 0) {
    const shift = pDeg(r) - db;
    const c = qDiv(r[r.length - 1], b[b.length - 1]);
    q[shift] = c;
    const sub: Poly = Array.from({ length: shift }, () => Q0).concat(b.map((x) => qMul(x, c)));
    r = pTrim(pAdd(r, pNeg(sub)));
    if (pDeg(r) < 0) break;
  }
  return { q: pTrim(q), r: pTrim(r) };
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const supStr = (n: number) => String(n).split('').map((c) => SUP[+c]).join('');
function pStr(p: Poly, v = 'x'): string {
  const terms: string[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const c = p[i];
    if (qZero(c)) continue;
    const neg = c.n < 0n;
    const ac = neg ? qNeg(c) : c;
    const isOne = ac.n === 1n && ac.d === 1n;
    let body: string;
    if (i === 0) body = qStr(ac);
    else {
      const cs = isOne ? '' : ac.d === 1n ? qStr(ac) : `(${qStr(ac)})`;
      body = cs + v + (i > 1 ? supStr(i) : '');
    }
    terms.push((terms.length ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + body);
  }
  return terms.length ? terms.join('') : '0';
}
/** Primitive integer polynomial (clear denominators, divide content) and the scalar relating it to p. */
function primitive(p: Poly): { prim: Poly; scale: QQ } {
  let l = 1n;
  for (const c of p) l = (l * c.d) / gcdB(l, c.d);
  const ints = p.map((c) => (c.n * l) / c.d);
  let g = 0n;
  for (const c of ints) g = gcdB(g, c);
  g = g || 1n;
  const lead = ints[ints.length - 1];
  const s = lead < 0n ? -g : g;
  return { prim: ints.map((c) => mkQ(c / s)), scale: mkQ(s, l) };
}
const divisors = (n: bigint): bigint[] => {
  n = n < 0n ? -n : n;
  const out: bigint[] = [];
  if (n === 0n) return [1n];
  const lim = n > 10n ** 10n ? 10n ** 5n : n;
  for (let i = 1n; i * i <= lim && i <= 100000n; i++) if (n % i === 0n) out.push(i, n / i);
  return [...new Set(out)];
};
/** Pull rational linear factors (qx − p) out of p. Returns content, factors and the remaining cofactor. */
function factorLinear(p: Poly): { content: QQ; factors: { lin: Poly; root: QQ; mult: number }[]; rest: Poly } {
  const { prim, scale } = primitive(p);
  let cur = prim;
  const factors: { lin: Poly; root: QQ; mult: number }[] = [];
  let guard = 0;
  while (pDeg(cur) >= 1 && guard++ < 30) {
    const lead = cur[cur.length - 1].n;
    const last = cur[0].n;
    let found: QQ | null = null;
    if (last === 0n) found = Q0;
    else {
      outer: for (const pp of divisors(last))
        for (const qq of divisors(lead))
          for (const sgn of [1n, -1n]) {
            const r = mkQ(sgn * pp, qq);
            if (qZero(pEval(cur, r))) {
              found = r;
              break outer;
            }
          }
    }
    if (!found) break;
    const lin: Poly = [qNeg(found).n === 0n ? Q0 : mkQ(-found.n, 1n), mkQ(found.d, 1n)];
    const { q } = pDivmod(cur, lin);
    const ex = factors.find((f) => qZero(qSub(f.root, found as QQ)));
    if (ex) ex.mult++;
    else factors.push({ lin, root: found, mult: 1 });
    cur = primitive(q).prim;
    // fold the scalar dropped by primitive() back into content
    const { scale: s2 } = primitive(q);
    scale.n *= s2.n;
    scale.d *= s2.d;
  }
  return { content: mkQ(scale.n, scale.d), factors, rest: cur };
}
function factorStr(p: Poly): string {
  const { content, factors, rest } = factorLinear(p);
  const parts: string[] = [];
  for (const f of factors) {
    const s = `(${pStr(f.lin)})`;
    parts.push(f.mult > 1 ? s + supStr(f.mult) : s);
  }
  if (pDeg(rest) >= 1) parts.push(`(${pStr(rest)})`);
  const c = content;
  const cs = c.n === 1n && c.d === 1n ? '' : c.n === -1n && c.d === 1n ? '−' : c.d === 1n ? qStr(c) : `(${qStr(c)})`;
  if (!parts.length) return pStr(p);
  return cs + parts.join('');
}
/** multiplicity of the root r in p (p ≠ 0) and the cofactor with p = (x−r)^m · cof */
function rootMult(p: Poly, r: QQ): { m: number; cof: Poly } {
  let cur = p;
  let m = 0;
  const lin: Poly = [qNeg(r), Q1];
  while (pDeg(cur) >= 1 && qZero(pEval(cur, r))) {
    cur = pDivmod(cur, lin).q;
    m++;
    if (m > 60) break;
  }
  if (pDeg(cur) === 0 && qZero(cur[0])) return { m: 99, cof: [Q0] };
  return { m, cof: cur };
}

/* ───────────────────────── AST helpers ───────────────────────── */
const N = (v: QQ): Node => ({ t: 'n', v });
const num = (k: number): Node => N(mkQ(BigInt(Math.round(k))));
const V = (): Node => ({ t: 'v', n: 'x' });
const B = (o: string, l: Node, r: Node): Node => ({ t: 'b', o, l, r });
const F = (n: string, a: Node): Node => ({ t: 'f', n, a });
const G = (a: Node): Node => ({ t: 'g', a });
const E = (): Node => ({ t: 'c', n: 'e' });
const half = (): Node => N(mkQ(1n, 2n));

const hasX = (n: Node): boolean =>
  n.t === 'v' ? true : n.t === 'n' || n.t === 'c' ? false : n.t === 'g' || n.t === 'f' ? hasX(n.a as Node) : hasX(n.l as Node) || hasX(n.r as Node);

function mapNode(n: Node, fn: (m: Node) => Node | null): Node {
  const r = fn(n);
  if (r) return r;
  if (n.t === 'g') return G(mapNode(n.a as Node, fn));
  if (n.t === 'f') return F(n.n as string, mapNode(n.a as Node, fn));
  if (n.t === 'b') return B(n.o as string, mapNode(n.l as Node, fn), mapNode(n.r as Node, fn));
  return n;
}
const subst = (n: Node, rep: Node): Node => mapNode(n, (m) => (m.t === 'v' ? rep : null));
const isSqrt = (n: Node): boolean => n.t === 'b' && n.o === '^' && (n.r as Node).t === 'n' && qZero(qSub((n.r as Node).v as QQ, mkQ(1n, 2n)));
const containsFn = (n: Node, names: string[]): boolean =>
  n.t === 'f' ? names.includes(n.n as string) || containsFn(n.a as Node, names) : n.t === 'g' ? containsFn(n.a as Node, names) : n.t === 'b' ? containsFn(n.l as Node, names) || containsFn(n.r as Node, names) : false;

function toPoly(n: Node): Poly | null {
  switch (n.t) {
    case 'n':
      return [n.v as QQ];
    case 'v':
      return [Q0, Q1];
    case 'g': {
      const a = toPoly(n.a as Node);
      return a && pNeg(a);
    }
    case 'b': {
      const l = toPoly(n.l as Node);
      if (!l) return null;
      if (n.o === '^') {
        const r = n.r as Node;
        if (r.t !== 'n' || (r.v as QQ).d !== 1n) return null;
        const k = Number((r.v as QQ).n);
        if (k < 0 || k > 16) return null;
        let acc: Poly = [Q1];
        for (let i = 0; i < k; i++) acc = pMul(acc, l);
        return acc;
      }
      const r = toPoly(n.r as Node);
      if (!r) return null;
      if (n.o === '+') return pAdd(l, r);
      if (n.o === '-') return pAdd(l, pNeg(r));
      if (n.o === '*') return pMul(l, r);
      if (n.o === '/') {
        if (r.length === 1 && !qZero(r[0])) return l.map((c) => qDiv(c, r[0]));
        return null;
      }
      return null;
    }
    default:
      return null;
  }
}
/** rational function p/q (polynomials in x) from an AST, or null */
function toRational(n: Node): { p: Poly; q: Poly } | null {
  const isZeroP = (a: Poly) => pDeg(a) < 0;
  switch (n.t) {
    case 'n':
      return { p: [n.v as QQ], q: [Q1] };
    case 'v':
      return { p: [Q0, Q1], q: [Q1] };
    case 'g': {
      const a = toRational(n.a as Node);
      return a && { p: pNeg(a.p), q: a.q };
    }
    case 'b': {
      const l = toRational(n.l as Node);
      if (!l) return null;
      if (n.o === '^') {
        const r = n.r as Node;
        if (r.t !== 'n' || (r.v as QQ).d !== 1n) return null;
        const k = Number((r.v as QQ).n);
        if (Math.abs(k) > 16) return null;
        let P: Poly = [Q1];
        let Qd: Poly = [Q1];
        for (let i = 0; i < Math.abs(k); i++) {
          P = pMul(P, l.p);
          Qd = pMul(Qd, l.q);
        }
        if (k >= 0) return { p: P, q: Qd };
        return isZeroP(P) ? null : { p: Qd, q: P };
      }
      const r = toRational(n.r as Node);
      if (!r) return null;
      if (n.o === '+') return { p: pAdd(pMul(l.p, r.q), pMul(r.p, l.q)), q: pMul(l.q, r.q) };
      if (n.o === '-') return { p: pAdd(pMul(l.p, r.q), pNeg(pMul(r.p, l.q))), q: pMul(l.q, r.q) };
      if (n.o === '*') return { p: pMul(l.p, r.p), q: pMul(l.q, r.q) };
      if (n.o === '/') return isZeroP(r.p) ? null : { p: pMul(l.p, r.q), q: pMul(l.q, r.p) };
      return null;
    }
    default:
      return null;
  }
}
/** factors of a product tree */
function factorsOf(n: Node, out: Node[] = []): Node[] {
  if (n.t === 'b' && n.o === '*') {
    factorsOf(n.l as Node, out);
    factorsOf(n.r as Node, out);
  } else out.push(n);
  return out;
}
const prodOf = (fs: Node[]): Node => (fs.length ? fs.reduce((a, b) => B('*', a, b)) : num(1));
/** A factor that may be cancelled between numerator and denominator without changing the domain:
    polynomials/rational expressions and positive-constant-base exponentials. */
function safeFactor(n: Node): boolean {
  if (toRational(n) !== null) return true;
  if (n.t === 'b' && n.o === '^' && !hasX(n.l as Node)) {
    const bv = evalC(n.l as Node);
    return Number.isFinite(bv) && bv > 0;
  }
  return false;
}
/** Normalise the AST: e^(−u) → 1/e^u, a^(u+c) → a^c·a^u, u·(a/b) → (u·a)/b, (a/b)/(c/d) → (a·d)/(b·c),
    and cancel identical safe factors between numerator and denominator. */
function normalize(n: Node): Node {
  if (n.t === 'g') return G(normalize(n.a as Node));
  if (n.t === 'f') return F(n.n as string, normalize(n.a as Node));
  if (n.t !== 'b') return n;
  const l = normalize(n.l as Node);
  const r = normalize(n.r as Node);
  const o = n.o as string;
  if (o === '^') {
    if (r.t === 'g' && hasX(r)) return B('/', num(1), B('^', l, r.a as Node));
    if (!hasX(l) && r.t === 'b' && (r.o === '+' || r.o === '-') && !hasX(r.r as Node) && (r.r as Node).t === 'n') {
      const pow2 = B('^', l, r.r as Node);
      const base = B('^', l, r.l as Node);
      return r.o === '+' ? B('*', base, pow2) : B('/', base, pow2);
    }
    return B(o, l, r);
  }
  if (o === '*') {
    if (r.t === 'b' && r.o === '/') return normalize(B('/', B('*', l, r.l as Node), r.r as Node));
    if (l.t === 'b' && l.o === '/') return normalize(B('/', B('*', l.l as Node, r), l.r as Node));
  }
  if (o === '/') {
    if (l.t === 'b' && l.o === '/') return normalize(B('/', l.l as Node, B('*', l.r as Node, r)));
    if (r.t === 'b' && r.o === '/') return normalize(B('/', B('*', l, r.r as Node), r.l as Node));
    const nf = factorsOf(l);
    const df = factorsOf(r);
    if (nf.length > 1 || df.length > 1) {
      const keyed = (x: Node) => pp(x);
      let changed = false;
      for (let i = nf.length - 1; i >= 0; i--) {
        if (!safeFactor(nf[i]) || !hasX(nf[i])) continue;
        const j = df.findIndex((d) => keyed(d) === keyed(nf[i]));
        if (j >= 0) {
          nf.splice(i, 1);
          df.splice(j, 1);
          changed = true;
        }
      }
      if (changed) return B('/', prodOf(nf), prodOf(df));
    }
  }
  return B(o, l, r);
}
const polyNode = (p: Poly): Node => {
  let acc: Node | null = null;
  for (let i = p.length - 1; i >= 0; i--) {
    if (qZero(p[i])) continue;
    const pw: Node = i === 0 ? N(p[i]) : i === 1 ? B('*', N(p[i]), V()) : B('*', N(p[i]), B('^', V(), num(i)));
    acc = acc ? B('+', acc, pw) : pw;
  }
  return acc || num(0);
};

const S = (n: Node): Node => cas().simp(n);

/** Pretty printer for AST nodes: √, superscripts, π, implicit multiplication, proper minus sign. */
function pp(n: Node, p = 0): string {
  let s: string;
  let q = 5;
  const isAtomStr = (t: string) => /^[A-Za-zπ0-9.]+$/.test(t);
  switch (n.t) {
    case 'n': {
      const v = n.v as QQ;
      s = v.d === 1n ? v.n.toString().replace('-', '−') : `${v.n.toString().replace('-', '−')}/${v.d}`;
      q = v.d !== 1n ? 2 : v.n < 0n ? 3 : 5;
      break;
    }
    case 'v':
      s = 'x';
      break;
    case 'c':
      s = n.n === 'pi' ? 'π' : 'e';
      break;
    case 'g':
      s = '−' + pp(n.a as Node, 3);
      q = 3;
      break;
    case 'f':
      s = n.n === 'abs' ? `|${pp(n.a as Node, 0)}|` : `${n.n}(${pp(n.a as Node, 0)})`;
      break;
    default: {
      const o = n.o as string;
      const l = n.l as Node;
      const r = n.r as Node;
      if (o === '+') {
        s = pp(l, 1) + ' + ' + pp(r, 2);
        q = 1;
      } else if (o === '-') {
        s = pp(l, 1) + ' − ' + pp(r, 2);
        q = 1;
      } else if (o === '*') {
        const rs = pp(r, r.t === 'b' && r.o === '*' ? 2 : 3);
        const ls = pp(l, l.t === 'n' && (l.v as QQ).d !== 1n ? 3 : 2);
        const implicit = (l.t === 'n' || l.t === 'c') && /^[A-Za-zπ(√|]/.test(rs);
        s = ls + (implicit ? '' : '·') + rs;
        q = 2;
      } else if (o === '/') {
        s = pp(l, 2) + '/' + pp(r, 3);
        q = 2;
      } else {
        if (isSqrt(n)) {
          const b = pp(l, 0);
          s = isAtomStr(b) ? `√${b}` : `√(${b})`;
          q = 5;
        } else if (r.t === 'n' && (r.v as QQ).d === 1n && (r.v as QQ).n >= 2n && (r.v as QQ).n <= 9n) {
          s = pp(l, 5) + supStr(Number((r.v as QQ).n));
          q = 4;
        } else if (l.t === 'c' && l.n === 'e') {
          s = `e^(${pp(r, 0)})`;
          if (isAtomStr(pp(r, 0))) s = `e^${pp(r, 0)}`;
          q = 4;
        } else {
          const es = pp(r, 5);
          s = pp(l, 5) + '^' + (isAtomStr(es) ? es : `(${pp(r, 0)})`);
          q = 4;
        }
      }
    }
  }
  return q < p ? `(${s})` : s;
}
export const show = (n: Node): string => pp(S(n));
const evalAt = (n: Node, x: number): number => {
  try {
    return cas().evalN(n, { x });
  } catch {
    return NaN;
  }
};
const evalC = (n: Node): number => evalAt(n, 0);

/** Replace values that are numerically 0 / small rationals by exact numbers (closed forms like sin π, cos π, sin(π/6)). */
function nice(n: Node): Node {
  let s: Node;
  try {
    s = S(n);
  } catch {
    return n;
  }
  if (s.t === 'n') return s;
  const v = evalC(s);
  if (!Number.isFinite(v)) return s;
  if (Math.abs(v) < 1e-12) return num(0);
  if (s.t === 'g' || s.t === 'v') return s;
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(v * q);
    if (Math.abs(v - p / q) < 1e-12 * Math.max(1, Math.abs(v)) && !hasX(s)) {
      return N(mkQ(BigInt(p), BigInt(q)));
    }
  }
  return s;
}

/* ───────────────────────── limit values ───────────────────────── */
export type LV =
  | { k: 'fin'; v: Node }
  | { k: 'inf'; s: 1 | -1 }
  | { k: 'pole' } // ±∞ depending on the side (two-sided only)
  | { k: 'osc' } // bounded, no limit (oscillation)
  | { k: 'dne'; why: string }
  | { k: 'unk'; why: string };

const fin = (v: Node): LV => ({ k: 'fin', v: nice(v) });
const INF = (s: 1 | -1): LV => ({ k: 'inf', s });
const UNK = (why: string): LV => ({ k: 'unk', why });
const finVal = (l: LV & { k: 'fin' }): number => evalC(l.v);
const isFinZero = (l: LV): boolean => l.k === 'fin' && Math.abs(finVal(l)) < 1e-12;
const finSign = (l: LV & { k: 'fin' }): number => {
  const v = finVal(l);
  return Math.abs(v) < 1e-12 ? 0 : v > 0 ? 1 : -1;
};

export function fmtLV(l: LV): string {
  switch (l.k) {
    case 'fin': {
      const s = show(l.v);
      const v = evalC(l.v);
      const exact = l.v.t === 'n';
      return exact || !Number.isFinite(v) ? s : `${s} ≈ ${Number(v.toPrecision(10))}`;
    }
    case 'inf':
      return l.s > 0 ? '+∞' : '−∞';
    case 'pole':
      return '±∞ (depends on side)';
    case 'osc':
      return 'oscillates (no limit)';
    case 'dne':
      return 'does not exist';
    default:
      return 'unsupported';
  }
}

export interface Step {
  title: string;
  body: string;
  depth: number;
}
interface Ctx {
  a: number;
  aNode: Node;
  aq: QQ | null;
  inf: 0 | 1 | -1;
  side: 'both' | 'left' | 'right';
  steps: Step[];
  budget: number;
  depth: number;
  quiet: number;
}
const log = (c: Ctx, title: string, body: string): void => {
  if (c.quiet === 0) c.steps.push({ title, body, depth: c.depth });
};
const tick = (c: Ctx): boolean => --c.budget > 0;

/* ───────────────────────── sign analysis (numerical sampling used ONLY for signs) ───────────────────────── */
function samplePts(c: Ctx, side: 'left' | 'right'): number[] {
  if (c.inf !== 0) return [1e3, 1e5, 1e7].map((m) => (c.inf > 0 ? m : -m));
  const sc = Math.max(1, Math.abs(c.a));
  const s = side === 'left' ? -1 : 1;
  return [1e-3, 1e-5, 1e-7].map((h) => c.a + s * h * sc);
}
/** sign of node on one side of the approach point; 0 if it changes sign / unreliable */
function signOn(c: Ctx, n: Node, side: 'left' | 'right'): number {
  const pts = samplePts(c, side);
  const signs = pts.map((x) => {
    const v = evalAt(n, x);
    return Number.isFinite(v) ? (v > 0 ? 1 : v < 0 ? -1 : 0) : NaN;
  });
  if (signs.some((s) => Number.isNaN(s) || s === 0)) return 0;
  return signs.every((s) => s === signs[0]) ? signs[0] : 0;
}
/** exact sign of a polynomial near a rational point on a side (multiplicity analysis), else null */
function polySignNear(c: Ctx, p: Poly, side: 'left' | 'right'): number | null {
  if (c.inf !== 0) {
    const d = pDeg(p);
    if (d < 0) return null;
    const lead = qSign(p[p.length - 1]);
    return c.inf > 0 ? lead : lead * (d % 2 === 0 ? 1 : -1);
  }
  if (!c.aq) return null;
  if (pDeg(p) < 0) return null;
  const { m, cof } = rootMult(p, c.aq);
  if (m >= 99) return null;
  const cs = qSign(pEval(cof, c.aq));
  const sd = side === 'left' ? -1 : 1;
  return cs * (m % 2 === 0 ? 1 : sd);
}
function nodeSign(c: Ctx, n: Node, side: 'left' | 'right'): number {
  const p = toPoly(n);
  if (p) {
    const e = polySignNear(c, p, side);
    if (e !== null) return e;
  }
  return signOn(c, n, side);
}
/** ±∞ result for "nonzero/ 0" given numerator limit sign and the denominator node (→0) */
function poleFrom(c: Ctx, numSign: number, den: Node): LV {
  const sides: ('left' | 'right')[] = c.inf !== 0 ? ['right'] : c.side === 'both' ? ['left', 'right'] : [c.side as 'left' | 'right'];
  const res = sides.map((s) => numSign * nodeSign(c, den, s));
  if (res.some((r) => r === 0)) return UNK('Could not determine the sign of the denominator near the limit point.');
  if (res.every((r) => r === res[0])) return INF(res[0] as 1 | -1);
  return { k: 'pole' };
}

/* ───────────────────────── function / operator rules on limit values ───────────────────────── */
function applyFn(c: Ctx, name: string, a: LV, node: Node): LV {
  if (a.k === 'unk') return a;
  if (a.k === 'dne') return a;
  if (a.k === 'pole') {
    if (name === 'sin' || name === 'cos') return { k: 'osc' };
    return a;
  }
  if (a.k === 'osc') {
    if (name === 'sin' || name === 'cos' || name === 'tanh' || name === 'atan') return { k: 'osc' };
    if (name === 'abs') return { k: 'osc' };
    return UNK(`${name} of an oscillating quantity.`);
  }
  if (a.k === 'inf') {
    switch (name) {
      case 'sin':
      case 'cos':
        return { k: 'osc' };
      case 'tan':
        return { k: 'dne', why: 'tan oscillates without bound as its argument → ±∞.' };
      case 'atan':
        return fin(B('*', num(a.s), B('/', { t: 'c', n: 'pi' }, num(2))));
      case 'tanh':
        return fin(num(a.s));
      case 'sinh':
        return INF(a.s);
      case 'cosh':
      case 'abs':
        return INF(1);
      case 'ln':
      case 'log':
        return a.s > 0 ? INF(1) : UNK('Logarithm of negative values is not real.');
      default:
        return UNK(`${name} at infinity`);
    }
  }
  // finite argument
  const v = finVal(a);
  const arg = a.v;
  const side = (): number => {
    const sd: ('left' | 'right')[] = c.inf !== 0 ? ['right'] : c.side === 'both' ? ['left', 'right'] : [c.side as 'left' | 'right'];
    const ss = sd.map((s) => signOn(c, node.a as Node, s));
    return ss.every((s) => s === ss[0]) ? ss[0] : 0;
  };
  switch (name) {
    case 'abs': {
      if (Math.abs(v) < 1e-12) return fin(num(0));
      return fin(v < 0 ? G(arg) : arg);
    }
    case 'ln':
    case 'log': {
      if (v > 1e-12) return fin(F(name, arg));
      if (Math.abs(v) <= 1e-12) {
        const s = side();
        if (s > 0) return INF(-1);
        return UNK(`The argument of ${name} must approach 0 from the positive side (ln 0 is undefined).`);
      }
      return UNK(`${name} of a negative number is not real.`);
    }
    case 'asin':
    case 'acos':
      if (Math.abs(v) > 1 + 1e-12) return UNK(`${name} is only defined on [−1, 1].`);
      return fin(F(name, arg));
    case 'tan': {
      if (Math.abs(Math.cos(v)) < 1e-9) {
        // tan(u) with u → π/2 + kπ : sign from the sides of the whole expression
        const sd: ('left' | 'right')[] = c.inf !== 0 ? ['right'] : c.side === 'both' ? ['left', 'right'] : [c.side as 'left' | 'right'];
        const ss = sd.map((s) => signOn(c, node, s));
        if (ss.some((s) => s === 0)) return UNK('Could not determine the sign of tan near its pole.');
        if (ss.every((s) => s === ss[0])) return INF(ss[0] as 1 | -1);
        return { k: 'pole' };
      }
      return fin(F('tan', arg));
    }
    default:
      return fin(F(name, arg));
  }
}

function isBoundedNode(n: Node): boolean {
  if (!hasX(n)) return true;
  if (n.t === 'f') return ['sin', 'cos', 'tanh', 'atan'].includes(n.n as string);
  if (n.t === 'g') return isBoundedNode(n.a as Node);
  if (n.t === 'b' && n.o === '^' && !hasX(n.l as Node) && Math.abs(evalC(n.l as Node)) <= 1 + 1e-12) return true;
  if (n.t === 'b' && (n.o === '*' || n.o === '+' || n.o === '-')) return isBoundedNode(n.l as Node) && isBoundedNode(n.r as Node);
  if (n.t === 'b' && n.o === '/' && !hasX(n.r as Node)) return isBoundedNode(n.l as Node);
  return false;
}

/* ───────────────────────── core solver ───────────────────────── */
function solve(c: Ctx, n: Node): LV {
  if (!tick(c)) return UNK('The computation exceeded its work limit.');
  switch (n.t) {
    case 'n':
    case 'c':
      return fin(n);
    case 'v':
      return c.inf !== 0 ? INF(c.inf) : fin(c.aNode);
    case 'g': {
      const a = solve(c, n.a as Node);
      if (a.k === 'fin') return fin(G(a.v));
      if (a.k === 'inf') return INF((a.s * -1) as 1 | -1);
      return a;
    }
    case 'f': {
      const a = solve(c, n.a as Node);
      return applyFn(c, n.n as string, a, n);
    }
    default:
      return solveBinary(c, n);
  }
}

function floatToQ(a: number): QQ {
  if (Number.isInteger(a)) return mkQ(BigInt(a));
  // exact dyadic expansion is not wanted; use a nearby short rational for display purposes only
  for (let q = 1; q <= 1000; q++) if (Math.abs(a * q - Math.round(a * q)) < 1e-12) return mkQ(BigInt(Math.round(a * q)), BigInt(q));
  return mkQ(BigInt(Math.round(a * 1e9)), 1000000000n);
}

function solveBinary(c: Ctx, n: Node): LV {
  const o = n.o as string;
  const l0 = n.l as Node;
  const r0 = n.r as Node;

  // squeeze shortcuts that need no sub-limit of the bounded factor
  if (o === '*') {
    const sq = trySqueezeProduct(c, n);
    if (sq) return sq;
  }
  if (o === '/') {
    const sq = trySqueezeQuotient(c, n);
    if (sq) return sq;
  }
  if (o === '^') return solvePower(c, n);

  const L = solve(c, l0);
  const R = solve(c, r0);
  if (L.k === 'unk') return L;
  if (R.k === 'unk') return R;
  if (L.k === 'pole' || R.k === 'pole') return { k: 'pole' };
  if (L.k === 'dne') return L;
  if (R.k === 'dne') return R;

  if (L.k === 'osc' || R.k === 'osc') {
    const other = L.k === 'osc' ? R : L;
    if (o === '+' || o === '-') {
      if (other.k === 'fin') return { k: 'osc' };
      return UNK('Sum of an oscillating quantity and an unbounded one.');
    }
    return UNK('Oscillating factor with no controlling limit (use the squeeze theorem manually).');
  }

  switch (o) {
    case '+':
    case '-': {
      const sgn = o === '+' ? 1 : -1;
      if (L.k === 'fin' && R.k === 'fin') return fin(B(o, L.v, R.v));
      if (L.k === 'fin' && R.k === 'inf') return INF((R.s * sgn) as 1 | -1);
      if (L.k === 'inf' && R.k === 'fin') return INF(L.s);
      if (L.k === 'inf' && R.k === 'inf') {
        if (L.s === R.s * sgn) return INF(L.s);
        return indetSum(c, n, L, R);
      }
      return UNK('Unsupported sum.');
    }
    case '*': {
      if (L.k === 'fin' && R.k === 'fin') return fin(B('*', L.v, R.v));
      if (L.k === 'inf' && R.k === 'inf') return INF((L.s * R.s) as 1 | -1);
      const f = (L.k === 'fin' ? L : R) as LV & { k: 'fin' };
      const i = (L.k === 'inf' ? L : R) as LV & { k: 'inf' };
      const s = finSign(f);
      if (s === 0) return indetProduct(c, n, l0, r0);
      return INF((s * i.s) as 1 | -1);
    }
    case '/': {
      if (L.k === 'fin' && R.k === 'fin') {
        const z = isFinZero(R);
        if (!z) return fin(B('/', L.v, R.v));
        if (isFinZero(L)) return indetQuotient(c, n, '0/0');
        return poleFrom(c, finSign(L), r0);
      }
      if (L.k === 'fin' && R.k === 'inf') return fin(num(0));
      if (L.k === 'inf' && R.k === 'fin') {
        if (isFinZero(R)) {
          const p = poleFrom(c, L.s, r0);
          return p;
        }
        return INF((L.s * finSign(R)) as 1 | -1);
      }
      return indetQuotient(c, n, '∞/∞');
    }
    default:
      return UNK('Unsupported operator.');
  }
}

function solvePower(c: Ctx, n: Node): LV {
  const base = n.l as Node;
  const ex = n.r as Node;
  // negative constant exponent → reciprocal (keeps pole handling in one place)
  if (ex.t === 'n' && (ex.v as QQ).n < 0n) {
    return solve(c, B('/', num(1), B('^', base, N(qNeg(ex.v as QQ)))));
  }
  if (ex.t === 'g' && !hasX(ex.a as Node) && evalC(ex.a as Node) > 0) {
    return solve(c, B('/', num(1), B('^', base, ex.a as Node)));
  }
  const L = solve(c, base);
  const R = solve(c, ex);
  if (L.k === 'unk') return L;
  if (R.k === 'unk') return R;
  if (L.k === 'dne') return L;
  if (R.k === 'dne') return R;
  if (L.k === 'pole' || R.k === 'pole') return { k: 'pole' };
  if (L.k === 'osc' || R.k === 'osc') return UNK('Power with an oscillating base or exponent.');

  const baseExpIsE = base.t === 'c' && base.n === 'e';
  if (L.k === 'fin' && R.k === 'fin') {
    const b = finVal(L);
    const e = finVal(R);
    if (Math.abs(b) < 1e-12 && Math.abs(e) < 1e-12) return indetPower(c, n, '0^0');
    if (Math.abs(b) < 1e-12 && e < 0) return poleFrom(c, 1, base);
    if (b < 0 && !Number.isInteger(e)) return UNK('Negative base with a non-integer exponent is not real-valued.');
    const v = B('^', L.v, R.v);
    const val = evalC(v);
    if (!Number.isFinite(val)) return UNK('The power is undefined at the limit values.');
    return fin(v);
  }
  if (L.k === 'fin' && R.k === 'inf') {
    const b = finVal(L);
    if (b < -1e-12) {
      // (negative constant)^n with n → ∞ through integers (sequence context)
      if (Math.abs(b) < 1 - 1e-12) return fin(num(0));
      if (Math.abs(Math.abs(b) - 1) <= 1e-12) return { k: 'osc' };
      return { k: 'dne', why: 'a power of a number below −1 alternates in sign with growing size' };
    }
    if (Math.abs(b - 1) < 1e-12) return indetPower(c, n, '1^∞');
    if (Math.abs(b) < 1e-12) {
      const s = nodeSign(c, base, c.side === 'left' ? 'left' : 'right');
      if (s <= 0) return UNK('Base tends to 0 but its sign is not positive.');
      return R.s > 0 ? fin(num(0)) : INF(1);
    }
    if (b > 1) return R.s > 0 ? INF(1) : fin(num(0));
    return R.s > 0 ? fin(num(0)) : INF(1);
  }
  if (L.k === 'inf' && R.k === 'fin') {
    const e = finVal(R);
    if (Math.abs(e) < 1e-12) return indetPower(c, n, '∞^0');
    if (L.s < 0) {
      if (Number.isInteger(e) && e > 0) return INF((e % 2 === 0 ? 1 : -1) as 1 | -1);
      return UNK('A negative unbounded base raised to a non-integer power is not real-valued.');
    }
    return e > 0 ? INF(1) : fin(num(0));
  }
  if (L.k === 'inf' && R.k === 'inf') {
    if (L.s > 0) return R.s > 0 ? INF(1) : fin(num(0));
    return UNK('Negative unbounded base.');
  }
  void baseExpIsE;
  return UNK('Unsupported power.');
}

/* ───────────────────────── squeeze theorem ───────────────────────── */
function trySqueezeProduct(c: Ctx, n: Node): LV | null {
  const [u, w] = [n.l as Node, n.r as Node];
  const pairs: [Node, Node][] = [[u, w], [w, u]];
  for (const [bdd, other] of pairs) {
    if (!hasX(bdd) || !isBoundedNode(bdd) || !hasX(other)) continue;
    c.quiet++;
    const lo = solve(c, other);
    c.quiet--;
    if (isFinZero(lo)) {
      log(
        c,
        'Squeeze theorem',
        `The factor ${show(bdd)} is bounded: |${show(bdd)}| ≤ M. Hence 0 ≤ |${show(n)}| ≤ M·|${show(other)}|. Since ${show(other)} → 0, the right side → 0, so by the Squeeze Theorem ${show(n)} → 0.`
      );
      return fin(num(0));
    }
  }
  return null;
}
function trySqueezeQuotient(c: Ctx, n: Node): LV | null {
  const num_ = n.l as Node;
  const den = n.r as Node;
  if (!hasX(num_) || !isBoundedNode(num_)) return null;
  c.quiet++;
  const D = solve(c, den);
  c.quiet--;
  if (D.k === 'inf') {
    log(
      c,
      'Squeeze theorem',
      `The numerator ${show(num_)} is bounded (|${show(num_)}| ≤ M) while the denominator → ∞, so 0 ≤ |${show(n)}| ≤ M/|${show(den)}| → 0. By the Squeeze Theorem the limit is 0.`
    );
    return fin(num(0));
  }
  return null;
}

/* ───────────────────────── indeterminate forms ───────────────────────── */
function attempt(c: Ctx, fn: () => LV | null): LV | null {
  const saveLen = c.steps.length;
  const depth = c.depth;
  const r = fn();
  const ok = r && r.k !== 'unk' && r.k !== 'pole';
  if (!ok) {
    c.steps.length = saveLen;
    c.depth = depth;
  }
  return ok ? r : null;
}

function indetQuotient(c: Ctx, n: Node, form: string): LV {
  const nn = n.l as Node;
  const dd = n.r as Node;
  if (c.depth > 7) return UNK('Too many nested indeterminate forms.');
  log(c, `Indeterminate form ${form}`, `Substituting gives ${form}, which is not a value — more work is needed. ( ${show(nn)} ) / ( ${show(dd)} )`);
  const tryChain: [string, () => LV | null][] = [
    ['poly', () => techniquePolynomial(c, nn, dd)],
    ['rat', () => techniqueRationalize(c, nn, dd)],
    ['alg', () => (c.inf !== 0 ? techniqueDivideHighest(c, nn, dd, form) : null)],
    ['lhop', () => techniqueLHopital(c, nn, dd, form)],
    ['recip', () => (c.inf !== 0 && form === '0/0' ? techniqueReciprocal(c, n) : null)],
  ];
  for (const [, fn] of tryChain) {
    const r = attempt(c, fn);
    if (r) return r;
  }
  return UNK(`The ${form} form could not be resolved by factor/cancel, rationalization, highest-power division or L'Hôpital's rule.`);
}

function techniquePolynomial(c: Ctx, nn: Node, dd: Node): LV | null {
  const rn = toRational(nn);
  const rd = toRational(dd);
  if (!rn || !rd) return null;
  const pn = pMul(rn.p, rd.q);
  const pd = pMul(rn.q, rd.p);
  if (pDeg(pn) < 0 || pDeg(pd) < 0) return null;
  if (rn.q.length > 1 || rd.q.length > 1) {
    log(c, 'Combine into one rational function', `Clearing the inner fractions, N/D = (${pStr(pn)}) / (${pStr(pd)}).`);
  }
  if (c.inf === 0) {
    if (!c.aq) return null;
    const a = c.aq;
    const mn = rootMult(pn, a);
    const md = rootMult(pd, a);
    const as = qStr(a);
    const lin = a.n === 0n ? 'x' : a.n > 0n ? `(x − ${as})` : `(x + ${qStr(qNeg(a))})`;
    {
      const fl = (label: string, p: Poly): string => {
        const f = factorStr(p);
        return f.replace(/[()]/g, '') === pStr(p).replace(/[()]/g, '') ? `${label}: ${pStr(p)}  (already irreducible over ℚ)` : `${label}: ${pStr(p)} = ${f}`;
      };
      log(c, 'Factorize', `${fl('Numerator', pn)}\n${fl('Denominator', pd)}`);
    }
    log(c, 'Cancel the common factor', `Both contain ${lin}${mn.m > 1 || md.m > 1 ? ` (multiplicities ${mn.m} and ${md.m})` : ''}. Since x ≠ ${as} in a limit, cancelling ${lin}${Math.min(mn.m, md.m) > 1 ? supStr(Math.min(mn.m, md.m)) : ''} is legitimate: the reduced function equals the original for every x ≠ ${as}.`);
    const k = Math.min(mn.m, md.m);
    const nc = mn.m - k;
    const dc = md.m - k;
    const nv = pEval(mn.cof, a);
    const dv = pEval(md.cof, a);
    if (nc > 0 && dc === 0) {
      log(c, 'Evaluate', `The numerator still carries ${lin}${nc > 1 ? supStr(nc) : ''} → 0 while the denominator cofactor → ${qStr(dv)} ≠ 0, so the limit is 0.`);
      return fin(num(0));
    }
    if (nc === 0 && dc === 0) {
      const val = qDiv(nv, dv);
      log(c, 'Substitute x = ' + as, `After cancelling: (${pStr(mn.cof)})/(${pStr(md.cof)}) at x = ${as} gives ${qStr(nv)}/${qStr(dv)} = ${qStr(val)}.`);
      return fin(N(val));
    }
    // denominator still vanishes → pole
    const kk = dc;
    const cs = qSign(qDiv(nv, dv));
    log(c, 'Evaluate', `After cancelling, the denominator still has ${lin}${kk > 1 ? supStr(kk) : ''} → 0 while the numerator → ${qStr(nv)} ≠ 0, so the function is unbounded near ${as}.`);
    if (kk % 2 === 0) return INF(cs as 1 | -1);
    const sides: ('left' | 'right')[] = c.side === 'both' ? ['left', 'right'] : [c.side as 'left' | 'right'];
    const rs = sides.map((s) => cs * (s === 'left' ? -1 : 1));
    if (rs.every((r) => r === rs[0])) return INF(rs[0] as 1 | -1);
    return { k: 'pole' };
  }
  // x → ±∞
  const dn = pDeg(pn);
  const dd2 = pDeg(pd);
  const ln = pn[pn.length - 1];
  const ld = pd[pd.length - 1];
  log(
    c,
    'Divide by the highest power of x',
    `deg(numerator) = ${dn}, deg(denominator) = ${dd2}. Dividing every term of both by x${dd2 > 1 ? supStr(dd2) : dd2 === 1 ? '' : '⁰'} (the highest power in the denominator) leaves only the leading coefficients because each lower-order term c/x^k → 0.`
  );
  if (dn < dd2) {
    log(c, 'Compare degrees', `deg N < deg D ⇒ the quotient → 0.`);
    return fin(num(0));
  }
  if (dn === dd2) {
    const val = qDiv(ln, ld);
    log(c, 'Compare degrees', `Equal degrees ⇒ the limit is the ratio of leading coefficients = ${qStr(ln)}/${qStr(ld)} = ${qStr(val)}.`);
    return fin(N(val));
  }
  const sgn = qSign(qDiv(ln, ld)) * (c.inf < 0 ? ((dn - dd2) % 2 === 0 ? 1 : -1) : 1);
  log(c, 'Compare degrees', `deg N > deg D ⇒ |quotient| → ∞, with the sign of (${qStr(ln)}/${qStr(ld)})·x${supStr(dn - dd2)} as x → ${c.inf > 0 ? '+∞' : '−∞'}, i.e. ${sgn > 0 ? '+∞' : '−∞'}.`);
  return INF(sgn as 1 | -1);
}

/* rationalization: (A ± B) with a square root */
const sqBase = (n: Node): Node => (isSqrt(n) ? (n.l as Node) : B('^', n, num(2)));
function sqrtSum(n: Node): boolean {
  return n.t === 'b' && (n.o === '+' || n.o === '-') && (isSqrt(n.l as Node) || isSqrt(n.r as Node)) && !(n.l as Node).t.startsWith('zz');
}
function cancelPolys(a: Poly, b: Poly, c: Ctx): { a: Poly; b: Poly; k: number; lin: string } {
  if (c.inf === 0 && c.aq) {
    const ma = rootMult(a, c.aq);
    const mb = rootMult(b, c.aq);
    const k = Math.min(ma.m, mb.m);
    if (k > 0 && ma.m < 99 && mb.m < 99) {
      const lin: Poly = [qNeg(c.aq), Q1];
      let aa = a;
      let bb = b;
      for (let i = 0; i < k; i++) {
        aa = pDivmod(aa, lin).q;
        bb = pDivmod(bb, lin).q;
      }
      return { a: aa, b: bb, k, lin: pStr(lin) };
    }
  }
  return { a, b, k: 0, lin: '' };
}
function techniqueRationalize(c: Ctx, nn: Node, dd: Node): LV | null {
  const cases: { which: 'N' | 'D'; s: Node }[] = [];
  if (sqrtSum(nn)) cases.push({ which: 'N', s: nn });
  if (sqrtSum(dd)) cases.push({ which: 'D', s: dd });
  for (const { which, s } of cases) {
    const op = s.o as string;
    const u = s.l as Node;
    const w = s.r as Node;
    const conj = B(op === '+' ? '-' : '+', u, w);
    const prod = B('-', sqBase(u), sqBase(w));
    const prodPoly = toPoly(prod);
    log(
      c,
      'Rationalize (multiply by the conjugate)',
      `Multiply numerator and denominator by the conjugate ${show(conj)}. Using (p − q)(p + q) = p² − q², the product (${show(s)})(${show(conj)}) equals ${prodPoly ? pStr(prodPoly) : show(prod)}, which has no square root.`
    );
    let next: Node;
    if (which === 'N') {
      const dp = toPoly(dd);
      if (dp && prodPoly) {
        const cp = cancelPolys(prodPoly, dp, c);
        if (cp.k > 0) log(c, 'Cancel the common factor', `Cancel (${cp.lin})${cp.k > 1 ? supStr(cp.k) : ''} from top and bottom (allowed because x ≠ a in a limit).`);
        next = B('/', polyNode(cp.a), B('*', polyNode(cp.b), conj));
      } else next = B('/', prodPoly ? polyNode(prodPoly) : prod, B('*', dd, conj));
    } else {
      const np = toPoly(nn);
      if (np && prodPoly) {
        const cp = cancelPolys(np, prodPoly, c);
        if (cp.k > 0) log(c, 'Cancel the common factor', `Cancel (${cp.lin})${cp.k > 1 ? supStr(cp.k) : ''} from top and bottom (allowed because x ≠ a in a limit).`);
        next = B('/', B('*', polyNode(cp.a), conj), polyNode(cp.b));
      } else next = B('/', B('*', nn, conj), prodPoly ? polyNode(prodPoly) : prod);
    }
    log(c, 'Rewritten function', show(next));
    c.depth++;
    const r = solve(c, next);
    c.depth--;
    if (r.k === 'fin' || r.k === 'inf') {
      log(c, 'Result after rationalizing', fmtLV(r));
      return r;
    }
  }
  return null;
}

/* highest-power division for algebraic expressions at ±∞ */
function degOf(n: Node): number | null {
  switch (n.t) {
    case 'n':
    case 'c':
      return 0;
    case 'v':
      return 1;
    case 'g':
      return degOf(n.a as Node);
    case 'f':
      return null;
    default: {
      const l = degOf(n.l as Node);
      if (l === null) return null;
      if (n.o === '^') {
        const r = n.r as Node;
        if (r.t !== 'n') return hasX(r) ? null : null;
        return l * qNum(r.v as QQ);
      }
      const r = degOf(n.r as Node);
      if (r === null) return null;
      if (n.o === '+' || n.o === '-') return Math.max(l, r);
      if (n.o === '*') return l + r;
      if (n.o === '/') return l - r;
      return null;
    }
  }
}
const xPow = (e: number): Node => {
  if (Math.abs(e) < 1e-12) return num(1);
  return B('^', V(), N(floatToQ(e)));
};
/** node / x^k, distributed so that every piece has a visible limit (x → +∞ only) */
function distribute(n: Node, k: number): Node | null {
  switch (n.t) {
    case 'n':
    case 'c':
      return Math.abs(k) < 1e-12 ? n : B('/', n, xPow(k));
    case 'v':
      return xPow(1 - k);
    case 'g': {
      const a = distribute(n.a as Node, k);
      return a && G(a);
    }
    case 'f':
      return null;
    default: {
      const o = n.o as string;
      if (o === '+' || o === '-') {
        const l = distribute(n.l as Node, k);
        const r = distribute(n.r as Node, k);
        return l && r && B(o, l, r);
      }
      if (o === '*') {
        const dl = degOf(n.l as Node);
        if (dl === null) return null;
        const l = distribute(n.l as Node, dl);
        const r = distribute(n.r as Node, k - dl);
        return l && r && B('*', l, r);
      }
      if (o === '/') {
        const dl = degOf(n.l as Node);
        const dr = degOf(n.r as Node);
        if (dl === null || dr === null) return null;
        const l = distribute(n.l as Node, dl);
        const r = distribute(n.r as Node, dr);
        if (!l || !r) return null;
        const rest = dl - dr - k;
        const q = B('/', l, r);
        return Math.abs(rest) < 1e-12 ? q : B('*', q, xPow(rest));
      }
      if (o === '^') {
        const e = n.r as Node;
        if (e.t !== 'n') return null;
        const dp = degOf(n.l as Node);
        if (dp === null) return null;
        const inner = distribute(n.l as Node, dp);
        if (!inner) return null;
        const ev = qNum(e.v as QQ);
        const rest = dp * ev - k;
        const core = B('^', inner, e);
        return Math.abs(rest) < 1e-12 ? core : B('*', core, xPow(rest));
      }
      return null;
    }
  }
}
function techniqueDivideHighest(c: Ctx, nn: Node, dd: Node, form: string): LV | null {
  if (form !== '∞/∞') return null;
  let N1 = nn;
  let D1 = dd;
  let sign = 1;
  let trace = '';
  if (c.inf < 0) {
    // x → −∞ : substitute x = −t, t → +∞
    N1 = subst(nn, G(V()));
    D1 = subst(dd, G(V()));
    trace = 'Put x = −t so that t → +∞: ';
    sign = 1;
  }
  const dn = degOf(N1);
  const dd2 = degOf(D1);
  if (dn === null || dd2 === null) return null;
  if (hasFnOfX(N1) || hasFnOfX(D1)) return null;
  const k = Math.max(dn, dd2);
  const nD = distribute(N1, k);
  const dD = distribute(D1, k);
  if (!nD || !dD) return null;
  log(
    c,
    'Divide numerator and denominator by the highest power',
    `${trace}The dominant growth is x${k % 1 === 0 ? (k === 1 ? '' : supStr(k)) : '^' + k.toFixed(2)}. Divide the numerator and the denominator by it (for x > 0, √(x²) = x, so the power moves inside radicals as x^(2k)). Every remaining piece now has a finite limit.`
  );
  const save = c.inf;
  const saveA = c.a;
  c.inf = 1;
  c.depth++;
  const r = solve(c, B('/', nD, dD));
  c.depth--;
  c.inf = save;
  c.a = saveA;
  void sign;
  if (r.k === 'fin' || r.k === 'inf') {
    log(c, 'Evaluate', `Limit after division: ${fmtLV(r)}`);
    return r;
  }
  return null;
}
const hasFnOfX = (n: Node): boolean => (n.t === 'f' ? hasX(n.a as Node) : n.t === 'g' ? hasFnOfX(n.a as Node) : n.t === 'b' ? hasFnOfX(n.l as Node) || hasFnOfX(n.r as Node) : false);

/* L'Hôpital */
function techniqueLHopital(c: Ctx, nn: Node, dd: Node, form: string): LV | null {
  if (c.depth > 6) return null;
  const cs = cas();
  const dN = normalize(cs.diff(nn, 'x').res);
  const dD = normalize(cs.diff(dd, 'x').res);
  log(
    c,
    "L'Hôpital's rule",
    `The form is ${form}, and N, D are differentiable near the point. If lim N′/D′ exists (finite or ±∞) then lim N/D = lim N′/D′ — differentiate numerator and denominator SEPARATELY (not the quotient rule):\nN′ = ${show(dN)}\nD′ = ${show(dD)}`
  );
  // hypothesis check: D' must not vanish identically near the point
  const pts = samplePts(c, c.side === 'left' ? 'left' : 'right');
  const dv = pts.map((x) => evalAt(dD, x));
  if (dv.every((v) => v === 0)) return null;
  c.depth++;
  const r = solve(c, B('/', dN, dD));
  c.depth--;
  if (r.k === 'fin' || r.k === 'inf') {
    log(c, "Conclusion (L'Hôpital)", `lim N′/D′ = ${fmtLV(r)}, therefore lim N/D = ${fmtLV(r)}.`);
    return r;
  }
  return null;
}

/* reciprocal substitution x = 1/t for 0/0 at infinity */
function techniqueReciprocal(c: Ctx, n: Node): LV | null {
  if (c.inf === 0) return null;
  const rep = B('/', num(1), V());
  const m = S(subst(n, rep));
  log(c, 'Substitute x = 1/t', `With x = 1/t, x → ${c.inf > 0 ? '+∞' : '−∞'} becomes t → 0${c.inf > 0 ? '⁺' : '⁻'}. The function becomes ${show(m)}.`);
  const nc: Ctx = { ...c, inf: 0, a: 0, aNode: num(0), aq: Q0, side: c.inf > 0 ? 'right' : 'left', depth: c.depth + 1 };
  const r = solve(nc, m);
  c.budget = nc.budget;
  if (r.k === 'fin' || r.k === 'inf') return r;
  return null;
}

/* ∞ − ∞ */
function indetSum(c: Ctx, n: Node, _L: LV, _R: LV): LV {
  log(c, 'Indeterminate form ∞ − ∞', `Each term is unbounded and they oppose each other: ${show(n)}.`);
  const nn = n;
  // 1. rationalization when a square root is involved
  if (sqrtSum(nn)) {
    const r = attempt(c, () => techniqueRationalize(c, nn, num(1)));
    if (r) return r;
  }
  // 2. common denominator
  const o = n.o as string;
  const parts = (x: Node): [Node, Node] => (x.t === 'b' && x.o === '/' ? [x.l as Node, x.r as Node] : [x, num(1)]);
  const [a1, b1] = parts(n.l as Node);
  const [a2, b2] = parts(n.r as Node);
  if (!(b1.t === 'n' && b2.t === 'n')) {
    const numr = B(o, B('*', a1, b2), B('*', a2, b1));
    const den = B('*', b1, b2);
    log(c, 'Combine over a common denominator', `${show(n)} = [ ${show(numr)} ] / [ ${show(den)} ]`);
    const pn = toPoly(numr);
    const pd = toPoly(den);
    const next = pn && pd ? B('/', polyNode(pn), polyNode(pd)) : B('/', numr, den);
    c.depth++;
    const r = solve(c, next);
    c.depth--;
    if (r.k === 'fin' || r.k === 'inf') {
      log(c, 'Result', fmtLV(r));
      return r;
    }
  }
  // 3. polynomial at infinity
  const pw = toPoly(n);
  if (pw && c.inf !== 0 && pDeg(pw) >= 1) {
    const s = polySignNear(c, pw, 'right') as number;
    log(c, 'Dominant term', `${pStr(pw)} is dominated by its highest-degree term, so the limit is ${s > 0 ? '+∞' : '−∞'}.`);
    return INF(s as 1 | -1);
  }
  return UNK('∞ − ∞ could not be resolved (no square root to rationalize, no common-denominator form).');
}

/* 0 · ∞ */
function indetProduct(c: Ctx, n: Node, l: Node, r: Node): LV {
  log(c, 'Indeterminate form 0·∞', `One factor → 0 and the other is unbounded: ${show(n)}. Rewrite the product as a quotient (u·v = u / (1/v)).`);
  const lRat = toRational(l) !== null;
  const rRat = toRational(r) !== null;
  const optA = B('/', l, B('/', num(1), r)); // numerator l
  const optB = B('/', r, B('/', num(1), l)); // numerator r
  // keep the transcendental factor in the numerator and invert the rational one
  const options: Node[] = lRat && !rRat ? [optB, optA] : [optA, optB];
  for (const nx of options) {
    const res = attempt(c, () => {
      c.depth++;
      const q = solveQuotientAsIndeterminate(c, nx);
      c.depth--;
      return q;
    });
    if (res) return res;
  }
  return UNK('0·∞ could not be resolved.');
}
function solveQuotientAsIndeterminate(c: Ctx, q: Node): LV {
  const nn = q.l as Node;
  const dd = q.r as Node;
  const NL = solve(c, nn);
  const DL = solve(c, dd);
  const form = isFinZero(NL) && isFinZero(DL) ? '0/0' : NL.k === 'inf' && DL.k === 'inf' ? '∞/∞' : null;
  if (!form) return solve(c, q);
  return indetQuotient(c, q, form);
}

/* 1^∞, 0^0, ∞^0 */
function indetPower(c: Ctx, n: Node, form: string): LV {
  const base = n.l as Node;
  const ex = n.r as Node;
  log(c, `Indeterminate form ${form}`, `Substituting gives ${form}. Take logarithms: if y = u^v then ln y = v·ln u, and y = e^(ln y) by continuity of e^x.`);
  const t = B('*', ex, F('ln', base));
  log(c, 'Reduce to a product', `ln y = ${show(t)}`);
  c.depth++;
  const r = solve(c, t);
  c.depth--;
  if (r.k === 'fin') {
    const res = fin(B('^', E(), r.v));
    log(c, 'Exponentiate', `lim ln y = ${fmtLV(r)} ⇒ lim y = e^(${show(r.v)}) = ${fmtLV(res)}`);
    return res;
  }
  if (r.k === 'inf') {
    log(c, 'Exponentiate', `lim ln y = ${fmtLV(r)} ⇒ lim y = ${r.s > 0 ? '+∞' : '0'}`);
    return r.s > 0 ? INF(1) : fin(num(0));
  }
  return UNK(`${form} could not be resolved.`);
}

/* ───────────────────────── input parsing ───────────────────────── */
export interface ParsedInput {
  expr: string;
  point: string | null;
  side: 'both' | 'left' | 'right' | null;
  variable: string;
}
const SUPERS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
export function normalizeExpr(s: string): string {
  let t = String(s).trim();
  t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^' + m.split('').map((c) => SUPERS[c]).join(''));
  t = t.replace(/√\s*\(/g, 'sqrt(').replace(/√\s*([A-Za-z0-9.]+)/g, 'sqrt($1)');
  t = t.replace(/∛\s*\(/g, '(').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/');
  t = t.replace(/\bln\s*\|/g, 'ln(').replace(/\^\s*\{([^}]*)\}/g, '^($1)');
  return t;
}
export function parseLimitNotation(raw: string): ParsedInput | null {
  const s = raw.trim();
  const m = /^lim(?:it)?\s*(?:_\{?|\(|\s)\s*([a-zA-Z])\s*(?:→|->|=>|to)\s*([^)}\s]+?)\s*(\^?\s*[+\-−⁺⁻])?\s*[)}]?\s*(.+)$/i.exec(s.replace(/\u2192/g, '→'));
  if (!m) return null;
  let side: 'both' | 'left' | 'right' = 'both';
  let pt = m[2];
  let sg = m[3] || '';
  const tail = /([+\-−⁺⁻])$/.exec(pt);
  if (!sg && tail && pt.length > 1 && !/^[+-]?(inf|∞)/i.test(pt)) {
    // e.g. 0+ / 2- glued to the point
    sg = tail[1];
    pt = pt.slice(0, -1);
  }
  if (sg) side = /[+⁺]/.test(sg) ? 'right' : 'left';
  return { expr: m[4], point: pt, side, variable: m[1].toLowerCase() };
}

export interface PointSpec {
  a: number;
  aNode: Node;
  aq: QQ | null;
  inf: 0 | 1 | -1;
  text: string;
}
export function parsePoint(raw: string): PointSpec {
  const t = raw.trim().replace(/[−–]/g, '-').replace(/\s+/g, '');
  const lower = t.toLowerCase();
  if (/^(\+?(inf|infinity|∞))$/.test(lower)) return { a: Infinity, aNode: num(0), aq: null, inf: 1, text: '+∞' };
  if (/^(-(inf|infinity|∞))$/.test(lower)) return { a: -Infinity, aNode: num(0), aq: null, inf: -1, text: '−∞' };
  if (!t) throw new Error('Enter the value x approaches (a number, π, e, a fraction, ∞ or −∞).');
  const node = cas().parse(normalizeExpr(t));
  if (hasX(node)) throw new Error('The approach point must be a constant, not an expression in x.');
  const v = evalC(node);
  if (!Number.isFinite(v)) throw new Error('The approach point is not a finite real number.');
  let aq: QQ | null = null;
  try {
    aq = cas().evalQ(node, {});
  } catch {
    aq = null;
  }
  return { a: v, aNode: node, aq, inf: 0, text: show(node) };
}

/* ───────────────────────── public API ───────────────────────── */
export interface LimitResult {
  status: 'value' | 'infinite' | 'dne' | 'unsupported' | 'error';
  display: string; // e.g. "4", "+∞", "does not exist"
  exact: boolean;
  num: number | null;
  method: string;
  steps: Step[];
  left?: string;
  right?: string;
  headline: string;
  notes: string[];
  ast?: Node;
  point?: PointSpec;
  side: 'both' | 'left' | 'right';
}

function renameVar(n: Node, from: string): Node {
  if (from === 'x') return n;
  return mapNode(n, (m) => (m.t === 'v' && m.n === from ? V() : null));
}

function definedOn(c: Ctx, f: Node, side: 'left' | 'right'): boolean {
  const pts = samplePts(c, side);
  return pts.every((x) => !Number.isNaN(evalAt(f, x)));
}

function resolveAbs(c: Ctx, f: Node, side: 'left' | 'right', notes: string[]): Node | null {
  let bad = false;
  const out = mapNode(f, (m) => {
    if (m.t === 'f' && m.n === 'abs' && hasX(m.a as Node)) {
      const inner = resolveAbs(c, m.a as Node, side, notes);
      if (!inner) {
        bad = true;
        return m;
      }
      const sgn = nodeSign(c, inner, side);
      if (sgn === 0) {
        bad = true;
        return m;
      }
      notes.push(`${side === 'left' ? 'Left' : 'Right'} of the point, ${show(inner)} ${sgn > 0 ? '> 0' : '< 0'}, so |${show(inner)}| = ${sgn > 0 ? show(inner) : '−(' + show(inner) + ')'}.`);
      return sgn > 0 ? inner : G(inner);
    }
    return null;
  });
  return bad ? null : out;
}

function methodOf(steps: Step[]): string {
  const t = steps.map((s) => s.title).join('|');
  if (/L'Hôpital/.test(t)) return "L'Hôpital's rule";
  if (/Squeeze/.test(t)) return 'Squeeze theorem';
  if (/Rationalize/.test(t)) return 'Rationalization';
  if (/Cancel the common factor|Factorize/.test(t)) return 'Factorize & cancel';
  if (/highest power|Compare degrees/.test(t)) return 'Highest-power division';
  if (/common denominator/.test(t)) return 'Common denominator';
  if (/Exponentiate/.test(t)) return 'Logarithm / exponential rewrite';
  if (/Substitute x = 1\/t/.test(t)) return 'Reciprocal substitution';
  return 'Direct substitution / limit laws';
}

function runSide(base: { a: number; aNode: Node; aq: QQ | null; inf: 0 | 1 | -1 }, f: Node, side: 'both' | 'left' | 'right', depthStart = 0): { lv: LV; steps: Step[]; ctx: Ctx } {
  const ctx: Ctx = { a: base.a, aNode: base.aNode, aq: base.aq, inf: base.inf, side, steps: [], budget: 6000, depth: depthStart, quiet: 0 };
  const lv = solve(ctx, f);
  return { lv, steps: ctx.steps, ctx };
}

function lvEqual(a: LV, b: LV): boolean {
  if (a.k !== b.k) return false;
  if (a.k === 'fin' && b.k === 'fin') return Math.abs(evalC(a.v) - evalC(b.v)) <= 1e-10 * Math.max(1, Math.abs(evalC(a.v)));
  if (a.k === 'inf' && b.k === 'inf') return a.s === b.s;
  return a.k === 'osc';
}

function substitutionStep(c: Ctx, f: Node): string {
  if (c.inf !== 0) {
    return `As x → ${c.inf > 0 ? '+∞' : '−∞'} every occurrence of x is unbounded; examine each part of ${show(f)}.`;
  }
  try {
    return `Direct substitution x = ${show(c.aNode)}:  ${show(subst(f, c.aNode)).replace(/\s+/g, ' ')}`;
  } catch {
    return 'Direct substitution is not possible (division by 0).';
  }
}

/** Main entry: compute a limit and return a fully worked, honest result. */
export function computeLimit(exprRaw: string, pointRaw: string, side: 'both' | 'left' | 'right' = 'both', varName = 'x'): LimitResult {
  let f0: Node;
  try {
    f0 = renameVar(cas().parse(normalizeExpr(exprRaw)), varName);
  } catch (e) {
    return {
      status: 'error',
      display: 'error',
      exact: false,
      num: null,
      method: '—',
      steps: [],
      headline: `Cannot read the expression: ${(e as Error).message}`,
      notes: [],
      side,
    };
  }
  return computeLimitNode(f0, pointRaw, side);
}

/** Same as computeLimit but for an already parsed AST (variable must be x). */
export function computeLimitNode(f0: Node, pointRaw: string, side: 'both' | 'left' | 'right' = 'both'): LimitResult {
  const fail = (msg: string, status: LimitResult['status'] = 'error'): LimitResult => ({
    status,
    display: status === 'unsupported' ? 'unsupported' : 'error',
    exact: false,
    num: null,
    method: '—',
    steps: [],
    headline: msg,
    notes: [],
    side,
  });
  let f: Node = normalize(f0);
  let pt: PointSpec;
  const vs = new Set<string>();
  const collect = (n: Node) => {
    if (n.t === 'v') vs.add(n.n as string);
    else if (n.t === 'g' || n.t === 'f') collect(n.a as Node);
    else if (n.t === 'b') {
      collect(n.l as Node);
      collect(n.r as Node);
    }
  };
  collect(f);
  if (vs.size > 1 || (vs.size === 1 && !vs.has('x'))) return fail(`Use a single variable (x). Found: ${[...vs].join(', ')}.`);
  if (!vs.size) return fail('The expression does not contain the variable x — its limit is just its value.', 'unsupported');
  try {
    pt = parsePoint(pointRaw);
  } catch (e) {
    return fail((e as Error).message);
  }
  const sd: 'both' | 'left' | 'right' = pt.inf !== 0 ? 'both' : side;
  const notes: string[] = [];
  const steps: Step[] = [];
  const dir = (s: string) => (pt.inf !== 0 ? '' : s === 'left' ? '⁻' : s === 'right' ? '⁺' : '');
  const head = (s: string) => `lim  x→${pt.text}${dir(s)}  ${show(f)}`;

  const base = { a: pt.a, aNode: pt.aNode, aq: pt.aq, inf: pt.inf };
  const hasAbs = containsFn(f, ['abs']);

  const finishOne = (lv: LV, st: Step[], s: 'both' | 'left' | 'right'): LimitResult => buildResult(lv, st, s);

  function buildResult(lv: LV, st: Step[], s: 'both' | 'left' | 'right', extra?: Partial<LimitResult>): LimitResult {
    const pre: Step[] = show(f0) !== show(f) ? [{ title: 'Rewrite', body: `${show(f0)}  =  ${show(f)}  (negative exponents / products with fractions written as a single quotient)`, depth: 0 }] : [];
    st = pre.concat(st);
    const common = { steps: st, method: methodOf(st), notes, ast: f, point: pt, side: s } as const;
    if (lv.k === 'fin') {
      const v = evalC(lv.v);
      return { status: 'value', display: fmtLV(lv), exact: true, num: v, headline: `${head(s)} = ${fmtLV(lv)}`, ...common, ...extra };
    }
    if (lv.k === 'inf') return { status: 'infinite', display: fmtLV(lv), exact: true, num: lv.s * Infinity, headline: `${head(s)} = ${fmtLV(lv)}`, ...common, ...extra };
    if (lv.k === 'osc') {
      return { status: 'dne', display: 'does not exist', exact: true, num: null, headline: `${head(s)} does not exist (oscillation)`, ...common, ...extra };
    }
    if (lv.k === 'dne') return { status: 'dne', display: 'does not exist', exact: true, num: null, headline: `${head(s)} does not exist — ${lv.why}`, ...common, ...extra };
    if (lv.k === 'pole') return { status: 'dne', display: 'does not exist', exact: true, num: null, headline: `${head(s)} does not exist`, ...common, ...extra };
    return { status: 'unsupported', display: 'unsupported', exact: false, num: null, headline: `Unsupported: ${lv.why}`, ...common, ...extra };
  }

  // one-sided helper that handles abs
  const sideRun = (s: 'left' | 'right'): { lv: LV; steps: Step[] } => {
    const c0: Ctx = { a: pt.a, aNode: pt.aNode, aq: pt.aq, inf: pt.inf, side: s, steps: [], budget: 1, depth: 0, quiet: 0 };
    if (!definedOn(c0, f, s)) {
      return { lv: { k: 'dne', why: `the function is not real-valued just to the ${s} of ${pt.text}` }, steps: [] };
    }
    let g = f;
    const st: Step[] = [];
    if (hasAbs) {
      const nts: string[] = [];
      const r = resolveAbs(c0, f, s, nts);
      if (!r) return { lv: UNK('Could not resolve the absolute value near the point.'), steps: [] };
      g = r;
      st.push({ title: 'Remove the absolute value', body: nts.join('\n') + `\nSo near ${pt.text} on this side the function equals ${show(g)}.`, depth: 0 });
    }
    const res = runSide(base, g, s);
    st.push({ title: 'Direct substitution', body: substitutionStep(res.ctx, g), depth: 0 }, ...res.steps);
    return { lv: res.lv, steps: st };
  };

  // ── infinite approach point or explicit one-sided limit
  if (pt.inf !== 0 || sd !== 'both') {
    const dirSide: 'left' | 'right' = sd === 'left' ? 'left' : 'right';
    const out = pt.inf !== 0 ? runInf() : sideRun(dirSide);
    return finishOne(out.lv, out.steps, sd);
  }

  function runInf(): { lv: LV; steps: Step[] } {
    const c0: Ctx = { a: pt.a, aNode: pt.aNode, aq: null, inf: pt.inf, side: 'right', steps: [], budget: 1, depth: 0, quiet: 0 };
    if (!definedOn(c0, f, 'right')) return { lv: { k: 'dne', why: 'the function is not real-valued for large |x| in this direction' }, steps: [] };
    const res = runSide(base, f, 'both');
    let lv = res.lv;
    const st: Step[] = [{ title: 'Behaviour of each part', body: substitutionStep(res.ctx, f), depth: 0 }, ...res.steps];
    if (lv.k === 'osc') {
      st.push({
        title: 'No limit: oscillation',
        body: `${show(f)} stays bounded but keeps oscillating as x → ${pt.text}, so it cannot approach a single number (compare two sequences along which it takes different values).`,
        depth: 0,
      });
    }
    if (lv.k === 'unk' || lv.k === 'pole') lv = lv.k === 'pole' ? UNK('Sign-dependent infinity at ±∞ was not resolved.') : lv;
    return { lv, steps: st };
  }

  // ── two-sided, finite point
  {
    const c0: Ctx = { a: pt.a, aNode: pt.aNode, aq: pt.aq, inf: 0, side: 'both', steps: [], budget: 1, depth: 0, quiet: 0 };
    const defL = definedOn(c0, f, 'left');
    const defR = definedOn(c0, f, 'right');
    if (!defL || !defR) {
      const only = defR ? 'right' : defL ? 'left' : 'neither';
      const d = sideRun(defR ? 'right' : 'left');
      const sideTxt = only === 'neither' ? 'The function is not real-valued on either side of the point.' : `f is real-valued only on the ${only} of ${pt.text}, so the two-sided limit cannot exist (a two-sided limit needs both one-sided limits).`;
      const lres = only === 'neither' ? null : d.lv;
      const r = buildResult({ k: 'dne', why: sideTxt }, d.steps, 'both', {
        left: only === 'right' ? 'not defined' : lres ? fmtLV(lres) : 'not defined',
        right: only === 'left' ? 'not defined' : lres ? fmtLV(lres) : 'not defined',
      });
      if (only !== 'neither' && lres) {
        r.notes = [...notes, `The ${only}-hand limit is ${fmtLV(lres)}.`];
      }
      return r;
    }
  }

  if (!hasAbs) {
    const res = runSide(base, f, 'both');
    if (res.lv.k === 'fin' || res.lv.k === 'inf' || res.lv.k === 'osc' || res.lv.k === 'dne') {
      const st: Step[] = [{ title: 'Direct substitution', body: substitutionStep(res.ctx, f), depth: 0 }, ...res.steps];
      if (res.lv.k === 'osc') {
        const arg = findOscArgument(f);
        st.push({
          title: 'No limit: two sequences',
          body: oscillationProof(f, pt, arg),
          depth: 0,
        });
      }
      return buildResult(res.lv, st, 'both');
    }
  }

  // split into left / right
  const L = sideRun('left');
  const R = sideRun('right');
  const st: Step[] = [];
  st.push({ title: 'Two-sided limit ⇒ examine both sides', body: 'A two-sided limit exists exactly when the left-hand and right-hand limits both exist and are equal.', depth: 0 });
  st.push({ title: `Left-hand limit  x → ${pt.text}⁻`, body: '', depth: 0 });
  st.push(...L.steps.map((s) => ({ ...s, depth: s.depth + 1 })));
  st.push({ title: `  = ${fmtLV(L.lv)}`, body: '', depth: 1 });
  st.push({ title: `Right-hand limit  x → ${pt.text}⁺`, body: '', depth: 0 });
  st.push(...R.steps.map((s) => ({ ...s, depth: s.depth + 1 })));
  st.push({ title: `  = ${fmtLV(R.lv)}`, body: '', depth: 1 });
  const lt = fmtLV(L.lv);
  const rt = fmtLV(R.lv);
  const okL = L.lv.k === 'fin' || L.lv.k === 'inf';
  const okR = R.lv.k === 'fin' || R.lv.k === 'inf';
  if (okL && okR && lvEqual(L.lv, R.lv)) {
    st.push({ title: 'Conclusion', body: `Left and right limits agree (${lt}), so the two-sided limit exists and equals ${lt}.`, depth: 0 });
    return buildResult(L.lv, st, 'both', { left: lt, right: rt });
  }
  if (okL && okR) {
    st.push({
      title: 'Conclusion',
      body: `The one-sided limits differ (${lt} ≠ ${rt}), so the two-sided limit does not exist.`,
      depth: 0,
    });
    return buildResult({ k: 'dne', why: 'left and right limits differ' }, st, 'both', { left: lt, right: rt, notes: [...notes, `Left: ${lt}; right: ${rt}.`] });
  }
  if (L.lv.k === 'osc' || R.lv.k === 'osc') {
    st.push({ title: 'No limit: oscillation', body: oscillationProof(f, pt, findOscArgument(f)), depth: 0 });
    return buildResult({ k: 'osc' }, st, 'both', { left: lt, right: rt });
  }
  const bad = !okL ? L.lv : R.lv;
  if (bad.k === 'dne') return buildResult(bad, st, 'both', { left: lt, right: rt });
  return buildResult(bad, st, 'both', { left: lt, right: rt });
}

function findOscArgument(f: Node): Node | null {
  let found: Node | null = null;
  const walk = (n: Node) => {
    if (found) return;
    if (n.t === 'f' && (n.n === 'sin' || n.n === 'cos') && hasX(n.a as Node)) {
      found = n;
      return;
    }
    if (n.t === 'g' || n.t === 'f') walk(n.a as Node);
    else if (n.t === 'b') {
      walk(n.l as Node);
      walk(n.r as Node);
    }
  };
  walk(f);
  return found;
}
function oscillationProof(f: Node, pt: PointSpec, osc: Node | null): string {
  if (!osc) return `${show(f)} oscillates and does not settle near ${pt.text}.`;
  const fn = osc.n as string;
  const val = (x: number) => evalAt(f, x);
  // two sequences tending to the point along which f takes (numerically) different values
  const target = pt.inf !== 0 ? null : pt.a;
  const seqs: { label: string; xs: number[] }[] = [];
  if (target !== null) {
    const ks = [10, 100, 1000, 10000];
    seqs.push({ label: `x ₙ = ${fn === 'sin' ? '1/(nπ)' : '1/(2nπ + π/2)'}`, xs: ks.map((n) => target + (fn === 'sin' ? 1 / (n * Math.PI) : 1 / (2 * n * Math.PI + Math.PI / 2))) });
    seqs.push({ label: `yₙ = ${fn === 'sin' ? '1/(2nπ + π/2)' : '1/(2nπ)'}`, xs: ks.map((n) => target + (fn === 'sin' ? 1 / (2 * n * Math.PI + Math.PI / 2) : 1 / (2 * n * Math.PI))) });
  }
  let body = `${show(f)} keeps oscillating, so it cannot converge to a single number. Formal argument (sequential criterion): if lim f(x) = L existed, then f(xₙ) → L for EVERY sequence xₙ → ${pt.text}. Exhibit two sequences with different limiting values:`;
  for (const s of seqs) body += `\n  ${s.label} → ${pt.text}: f ≈ ${s.xs.map((x) => Number(val(x).toPrecision(4))).join(', ')}`;
  body += '\nThe values along the two sequences settle at different numbers, contradicting a unique limit.';
  return body;
}

/* ───────────────────────── numeric evidence table (never a proof) ───────────────────────── */
export interface TableRow {
  x: number;
  fx: number;
}
export function evidenceTable(exprRaw: string, pointRaw: string, side: 'left' | 'right'): TableRow[] {
  const f = cas().parse(normalizeExpr(exprRaw));
  const pt = parsePoint(pointRaw);
  const rows: TableRow[] = [];
  for (let k = 1; k <= 8; k++) {
    const x = pt.inf !== 0 ? pt.inf * Math.pow(10, k) : pt.a + (side === 'left' ? -1 : 1) * Math.pow(10, -k) * Math.max(1, Math.abs(pt.a));
    rows.push({ x, fx: evalAt(f, x) });
  }
  return rows;
}

/* ───────────────────────── continuity analysis ───────────────────────── */
export interface ContinuityReport {
  kind: 'continuous' | 'removable' | 'jump' | 'infinite' | 'essential' | 'one-sided' | 'undefined' | 'unsupported';
  title: string;
  fa: string;
  left: string;
  right: string;
  detail: string;
  steps: Step[];
}
export function analyzeContinuity(exprRaw: string, pointRaw: string): ContinuityReport {
  const f = cas().parse(normalizeExpr(exprRaw));
  const pt = parsePoint(pointRaw);
  if (pt.inf !== 0) throw new Error('Continuity is examined at a finite point.');
  const fa = evalC(subst(f, pt.aNode));
  const faDefined = Number.isFinite(fa);
  const faTxt = faDefined ? String(Number(fa.toPrecision(10))) : 'undefined';
  const L = computeLimit(exprRaw, pointRaw, 'left');
  const R = computeLimit(exprRaw, pointRaw, 'right');
  const T = computeLimit(exprRaw, pointRaw, 'both');
  const steps: Step[] = [
    { title: 'Condition 1 — f(a) is defined', body: faDefined ? `f(${pt.text}) = ${faTxt}` : `f(${pt.text}) is undefined`, depth: 0 },
    { title: 'Condition 2 — lim x→a f(x) exists', body: `Left: ${L.display}   Right: ${R.display}   Two-sided: ${T.display}`, depth: 0 },
  ];
  const mk = (kind: ContinuityReport['kind'], title: string, detail: string): ContinuityReport => ({ kind, title, fa: faTxt, left: L.display, right: R.display, detail, steps });
  if (L.status === 'unsupported' || R.status === 'unsupported') return mk('unsupported', 'Unsupported expression', 'The engine could not evaluate one of the one-sided limits symbolically, so no classification is claimed.');
  const lfin = L.status === 'value';
  const rfin = R.status === 'value';
  if (L.status === 'dne' && /not real-valued/.test(L.headline) && rfin) return mk('one-sided', 'Defined only on one side', 'f is real-valued only to the right of a, so only right-continuity at a can be discussed.');
  if (R.status === 'dne' && /not real-valued/.test(R.headline) && lfin) return mk('one-sided', 'Defined only on one side', 'f is real-valued only to the left of a, so only left-continuity at a can be discussed.');
  if (L.status === 'infinite' || R.status === 'infinite') return mk('infinite', 'Infinite discontinuity', 'At least one one-sided limit is ±∞ (vertical asymptote), so f is not continuous at a.');
  if (L.status === 'dne' || R.status === 'dne') return mk('essential', 'Essential (oscillatory) discontinuity', 'A one-sided limit fails to exist without being infinite (for example because of oscillation).');
  if (lfin && rfin) {
    const lv = L.num as number;
    const rv = R.num as number;
    if (Math.abs(lv - rv) > 1e-9 * Math.max(1, Math.abs(lv))) return mk('jump', 'Jump discontinuity', `Both one-sided limits exist but differ: jump = ${Number((rv - lv).toPrecision(8))}.`);
    if (faDefined && Math.abs(fa - lv) < 1e-9 * Math.max(1, Math.abs(lv))) return mk('continuous', 'Continuous at a', 'All three conditions hold: f(a) is defined, the limit exists, and lim f(x) = f(a).');
    return mk('removable', 'Removable discontinuity', faDefined ? `The limit is ${L.display} but f(a) = ${faTxt}; redefining f(a) = ${L.display} removes the discontinuity.` : `The limit is ${L.display} but f(a) is undefined; defining f(a) = ${L.display} removes the discontinuity (a "hole").`);
  }
  return mk('unsupported', 'Unsupported expression', 'Could not classify.');
}

/* ───────────────────────── ε–δ helpers ───────────────────────── */
/** Largest δ (numerically, by bisection on a grid) such that 0<|x−a|<δ ⇒ |f(x)−L|<ε. Evidence only. */
export function deltaForEpsilon(f: (x: number) => number, a: number, L: number, eps: number, deltaMax = 5, grid = 400, iters = 50): number {
  const ok = (d: number): boolean => {
    const n = grid;
    for (let i = 1; i <= n; i++) {
      const h = (d * i) / n;
      for (const x of [a - h, a + h]) {
        const y = f(x);
        if (Number.isFinite(y) && Math.abs(y - L) >= eps) return false;
        if (!Number.isFinite(y) && Number.isNaN(y) === false) return false;
      }
    }
    return true;
  };
  let lo = 0;
  let hi = deltaMax;
  if (ok(hi)) return hi;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    if (ok(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/* ───────────────────────── helpers for UI modules ───────────────────────── */
export interface CompiledFn {
  f: (x: number) => number;
  node: Node;
  text: string;
}
/** Parse an expression in x and return a numeric function (NaN where undefined). */
export function compileFn(exprRaw: string): CompiledFn {
  const node = cas().parse(normalizeExpr(exprRaw));
  const vs = new Set<string>();
  const walk = (n: Node) => {
    if (n.t === 'v') vs.add(n.n as string);
    else if (n.t === 'g' || n.t === 'f') walk(n.a as Node);
    else if (n.t === 'b') {
      walk(n.l as Node);
      walk(n.r as Node);
    }
  };
  walk(node);
  for (const v of vs) if (v !== 'x') throw new Error(`Use the variable x only (found ${v}).`);
  return { f: (x: number) => evalAt(node, x), node, text: show(node) };
}
/** Polynomial coefficients [c0, c1, …] as numbers if the expression is a polynomial in x, else null. */
export function polyCoeffs(exprRaw: string): { coeffs: QQ[]; text: string } | null {
  const node = cas().parse(normalizeExpr(exprRaw));
  const p = toPoly(node);
  return p ? { coeffs: p, text: pStr(p) } : null;
}
export const qToString = qStr;
export const qToNumber = qNum;
/** Substitute x → (x + k) etc. is not needed by UI; expose a generic substitution for sequences a(n+1). */
export function substituteX(node: Node, rep: Node): Node {
  return subst(node, rep);
}
export function mkBinary(o: string, l: Node, r: Node): Node {
  return B(o, l, r);
}
export function mkNum(k: number): Node {
  return num(k);
}
export function mkVar(): Node {
  return V();
}
export function mkFn(name: string, a: Node): Node {
  return F(name, a);
}
export function nodeText(n: Node): string {
  return show(n);
}

/* ───────────────────────── sequence / series tests (exact via the limit engine) ───────────────────────── */
export interface SeriesTests {
  term: LimitResult; // lim a_n
  absTerm: LimitResult; // lim |a_n|
  ratio: LimitResult; // lim |a_{n+1}/a_n|
  root: LimitResult; // lim |a_n|^{1/n}
}
/** Limits (as n → ∞, n written as x) needed for term / ratio / root tests, computed symbolically. */
export function seriesTests(exprRaw: string): SeriesTests {
  const f0 = normalizeExprNode(exprRaw);
  const absF = F('abs', f0);
  const next = subst(f0, B('+', V(), num(1)));
  return {
    term: computeLimitNode(f0, 'inf'),
    absTerm: computeLimitNode(absF, 'inf'),
    ratio: computeLimitNode(F('abs', B('/', next, f0)), 'inf'),
    root: computeLimitNode(B('^', absF, B('/', num(1), V())), 'inf'),
  };
}
function normalizeExprNode(exprRaw: string): Node {
  return cas().parse(normalizeExpr(exprRaw));
}
/** Limit of a sequence given by a formula in n (written with x). */
export function sequenceLimit(exprRaw: string): LimitResult {
  return computeLimit(exprRaw, 'inf');
}
export function derivNodeText(exprRaw: string): string {
  const node = normalizeExprNode(exprRaw);
  return show(cas().diff(node, 'x').res);
}
export function derivFn(exprRaw: string): (x: number) => number {
  const d = cas().diff(normalizeExprNode(exprRaw), 'x').res;
  return (x: number) => evalAt(d, x);
}
/** exact rational evaluation of an expression at x = integer; returns [num, den] strings or null */
export function evalExactAt(exprRaw: string, k: number): { n: bigint; d: bigint } | null {
  const node = normalizeExprNode(exprRaw);
  try {
    return cas().evalQ(node, { x: mkQ(BigInt(k)) });
  } catch {
    return null;
  }
}
export function parseNodeText(exprRaw: string, replaceXWith: string): string {
  const node = normalizeExprNode(exprRaw);
  const rep = normalizeExprNode(replaceXWith);
  return show(subst(node, rep));
}
