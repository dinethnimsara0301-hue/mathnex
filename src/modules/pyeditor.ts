/**
 * MATHNEX Python editor.
 *
 * A dependency-free code editor built on a native <textarea> (best IME / Android keyboard support)
 * with a synchronised syntax-highlight layer. Features: Python tokenizer & highlighting, line numbers,
 * current-line + error-line marking, auto-indent (incl. after ':' and between brackets), bracket and
 * quote auto-closing, smart backspace, Tab / Shift+Tab block indent, comment toggle, find & replace
 * (case / whole word / regex), safe code formatting and native undo/redo.
 */

export interface PyEditorOptions {
  onChange?: () => void;
  onRun?: () => void;
  onSave?: () => void;
}

interface Tok { s: number; e: number; c: string }
interface Match { s: number; e: number }

const KEYWORDS = new Set(['and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
const CONSTANTS = new Set(['True', 'False', 'None', '__name__', '__file__']);
const BUILTINS = new Set(['abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr', 'complex', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip', 'Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError', 'ZeroDivisionError', 'RuntimeError', 'NameError', 'AttributeError', 'ImportError', 'StopIteration', 'OSError', 'FileNotFoundError', 'KeyboardInterrupt', 'SystemExit', 'EOFError', 'AssertionError', 'NotImplementedError', 'ModuleNotFoundError']);

const PAIRS: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSERS = new Set([')', ']', '}']);
const TAB = '    ';

/* ------------------------------------------------------------------ tokenizer */
export function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  const n = src.length;
  let i = 0;
  let prevWord = '';
  let lineStart = true;
  const isIdStart = (ch: string) => /[A-Za-z_\u0080-\uffff]/.test(ch);
  const isIdChar = (ch: string) => /[\w\u0080-\uffff]/.test(ch);
  const strPrefix = /(?:[rRuUbBfF]{1,2})?('''|"""|'|")/y;
  const numRe = /(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?[jJ]?)/y;

  while (i < n) {
    const ch = src[i];
    if (ch === '\n') { i++; lineStart = true; continue; }
    if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }

    if (ch === '#') {
      let j = src.indexOf('\n', i); if (j < 0) j = n;
      toks.push({ s: i, e: j, c: 'c' }); i = j; lineStart = false; continue;
    }

    if (ch === '"' || ch === "'" || /[rRuUbBfF]/.test(ch)) {
      strPrefix.lastIndex = i;
      const m = strPrefix.exec(src);
      if (m && (i === 0 || !isIdChar(src[i - 1]))) {
        const quote = m[1];
        const prefix = m[0].slice(0, m[0].length - quote.length);
        const bodyStart = i + m[0].length;
        let j = bodyStart;
        const triple = quote.length === 3;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (triple) {
            if (src.startsWith(quote, j)) { j += 3; break; }
          } else {
            if (src[j] === quote) { j++; break; }
            if (src[j] === '\n') break;       // unterminated single-line string ends at EOL
          }
          j++;
        }
        if (j > n) j = n;
        if (/[fF]/.test(prefix)) pushFString(toks, src, i, bodyStart, j, quote.length);
        else toks.push({ s: i, e: j, c: 's' });
        i = j; lineStart = false; prevWord = ''; continue;
      }
    }

    if (ch === '@' && lineStart) {
      let j = i + 1;
      while (j < n && (isIdChar(src[j]) || src[j] === '.')) j++;
      toks.push({ s: i, e: j, c: 'd' }); i = j; lineStart = false; continue;
    }

    if (isIdStart(ch)) {
      let j = i + 1;
      while (j < n && isIdChar(src[j])) j++;
      const w = src.slice(i, j);
      let c = '';
      if (KEYWORDS.has(w)) c = 'k';
      else if (CONSTANTS.has(w)) c = 'cn';
      else if (prevWord === 'def') c = 'f';
      else if (prevWord === 'class') c = 'cl';
      else if (w === 'self' || w === 'cls') c = 'sf';
      else if (BUILTINS.has(w)) c = 'b';
      else {
        let k = j; while (k < n && (src[k] === ' ' || src[k] === '\t')) k++;
        if (src[k] === '(') c = 'fc';
      }
      if (c) toks.push({ s: i, e: j, c });
      prevWord = w; i = j; lineStart = false; continue;
    }

    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) {
      numRe.lastIndex = i;
      const m = numRe.exec(src);
      if (m && m[0].length) { toks.push({ s: i, e: i + m[0].length, c: 'n' }); i += m[0].length; lineStart = false; prevWord = ''; continue; }
    }

    i++; lineStart = false; prevWord = '';
  }
  return toks;
}

function pushFString(toks: Tok[], src: string, start: number, bodyStart: number, end: number, qLen: number) {
  const bodyEnd = src.startsWith(src.slice(bodyStart - qLen, bodyStart), end - qLen) && end - qLen >= bodyStart ? end - qLen : end;
  let segStart = start;
  let j = bodyStart;
  while (j < bodyEnd) {
    const ch = src[j];
    if (ch === '\\') { j += 2; continue; }
    if (ch === '{') {
      if (src[j + 1] === '{') { j += 2; continue; }
      let depth = 1; let k = j + 1;
      while (k < bodyEnd && depth > 0) {
        if (src[k] === '{') depth++;
        else if (src[k] === '}') depth--;
        k++;
      }
      if (segStart < j) toks.push({ s: segStart, e: j, c: 's' });
      toks.push({ s: j, e: k, c: 'fx' });
      segStart = k; j = k; continue;
    }
    j++;
  }
  if (segStart < end) toks.push({ s: segStart, e: end, c: 's' });
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderHtml(src: string, toks: Tok[], matches: Match[], current: number): string {
  const pieces: Tok[] = [];
  let pos = 0;
  for (const t of toks) {
    if (t.s > pos) pieces.push({ s: pos, e: t.s, c: '' });
    pieces.push(t); pos = t.e;
  }
  if (pos < src.length) pieces.push({ s: pos, e: src.length, c: '' });

  let out = '';
  let mi = 0;
  const cuts: number[] = [];
  for (const m of matches) { cuts.push(m.s, m.e); }
  for (const p of pieces) {
    let a = p.s;
    const pcuts = cuts.length ? cuts.filter((x) => x > p.s && x < p.e) : [];
    pcuts.push(p.e);
    for (const b of pcuts) {
      while (mi < matches.length && matches[mi].e <= a) mi++;
      const inMatch = mi < matches.length && matches[mi].s <= a && a < matches[mi].e;
      let html = esc(src.slice(a, b));
      if (p.c) html = '<span class="t-' + p.c + '">' + html + '</span>';
      if (inMatch) html = '<mark class="' + (mi === current ? 'pe-mc' : 'pe-m') + '">' + html + '</mark>';
      out += html; a = b;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ formatter */
/** Safe, semantics-preserving clean-up (never touches text inside strings). */
export function formatPython(input: string): string {
  const src = input.replace(/\r\n?/g, '\n');
  const strings = tokenize(src).filter((t) => t.c === 's' || t.c === 'fx');
  let si = 0;
  const insideString = (p: number) => {
    while (si < strings.length && strings[si].e <= p) si++;
    // tokens are sorted; look at the first token that ends after p
    for (let k = si; k < strings.length && strings[k].s < p; k++) if (strings[k].e > p) return true;
    return false;
  };
  const lines = src.split('\n');
  const out: string[] = [];
  let offset = 0; let blanks = 0;
  for (let idx = 0; idx < lines.length; idx++) {
    let line = lines[idx];
    const ls = offset; const le = offset + line.length;
    offset = le + 1;
    const startsInString = ls > 0 && insideString(ls - 1) && insideString(ls);
    const endsInString = insideString(le);
    if (!startsInString) {
      const lead = /^[ \t]*/.exec(line)![0];
      line = lead.replace(/\t/g, TAB) + line.slice(lead.length);
    }
    if (!endsInString && !startsInString) line = line.replace(/[ \t]+$/, '');
    if (line === '' && !startsInString && !endsInString) {
      blanks++; if (blanks > 2) continue;
    } else blanks = 0;
    out.push(line);
  }
  let text = out.join('\n').replace(/\n+$/, '');
  return text === '' ? '' : text + '\n';
}

/* ------------------------------------------------------------------ editor */
export class PyEditor {
  readonly ta: HTMLTextAreaElement;
  private host: HTMLElement;
  private opts: PyEditorOptions;
  private scroller!: HTMLElement;
  private hl!: HTMLElement;
  private gutter!: HTMLElement;
  private curLine!: HTMLElement;
  private errLine!: HTMLElement;
  private measure!: HTMLElement;
  private findBox!: HTMLElement;
  private fi!: HTMLInputElement;
  private ri!: HTMLInputElement;
  private fc!: HTMLElement;
  private toks: Tok[] = [];
  private internal = false;
  private trapTab = true;
  private lineCount = -1;
  private errorLine: number | null = null;
  private matches: Match[] = [];
  private current = -1;
  private flags = { cs: false, word: false, re: false };
  private lh = 21; private cw = 8; private padTop = 12; private padLeft = 12;
  private onSel: () => void;
  private ro: ResizeObserver | null = null;
  private metricsDirty = true;
  private layoutRaf = 0;
  private changeRaf = 0;

  constructor(host: HTMLElement, opts: PyEditorOptions = {}) {
    this.host = host; this.opts = opts;
    host.classList.add('pe');
    host.innerHTML = `
      <div class="pe-find" hidden>
        <div class="pe-row">
          <input class="pe-fi" type="text" placeholder="Find" aria-label="Find" autocomplete="off" autocapitalize="off" spellcheck="false">
          <span class="pe-fc" aria-live="polite">0/0</span>
          <button type="button" data-a="prev" title="Previous (Shift+Enter)" aria-label="Previous match">↑</button>
          <button type="button" data-a="next" title="Next (Enter)" aria-label="Next match">↓</button>
          <button type="button" data-a="cs" title="Match case" aria-pressed="false">Aa</button>
          <button type="button" data-a="word" title="Whole word" aria-pressed="false">W</button>
          <button type="button" data-a="re" title="Regular expression" aria-pressed="false">.*</button>
          <button type="button" data-a="tog" title="Toggle replace" aria-label="Toggle replace">⇄</button>
          <button type="button" data-a="close" title="Close (Esc)" aria-label="Close find">✕</button>
        </div>
        <div class="pe-row pe-repl" hidden>
          <input class="pe-ri" type="text" placeholder="Replace with" aria-label="Replace with" autocomplete="off" autocapitalize="off" spellcheck="false">
          <button type="button" data-a="rep">Replace</button>
          <button type="button" data-a="repall">Replace all</button>
        </div>
      </div>
      <div class="pe-scroller">
        <div class="pe-inner">
          <pre class="pe-gutter" aria-hidden="true"></pre>
          <div class="pe-code">
            <div class="pe-line pe-cur" aria-hidden="true"></div>
            <div class="pe-line pe-err" aria-hidden="true" hidden></div>
            <pre class="pe-hl" aria-hidden="true"></pre>
            <textarea class="pe-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Python code editor" inputmode="text"></textarea>
            <span class="pe-measure" aria-hidden="true">MMMMMMMMMMMMMMMMMMMM</span>
          </div>
        </div>
      </div>`;
    const q = <T extends HTMLElement>(s: string) => host.querySelector<T>(s)!;
    this.scroller = q('.pe-scroller'); this.hl = q('.pe-hl'); this.gutter = q('.pe-gutter');
    this.curLine = q('.pe-cur'); this.errLine = q('.pe-err'); this.measure = q('.pe-measure');
    this.ta = q<HTMLTextAreaElement>('.pe-ta'); this.findBox = q('.pe-find');
    this.fi = q<HTMLInputElement>('.pe-fi'); this.ri = q<HTMLInputElement>('.pe-ri'); this.fc = q('.pe-fc');

    this.ta.addEventListener('input', () => { if (!this.internal) this.scheduleChange(); });
    this.ta.addEventListener('beforeinput', (e) => this.onBeforeInput(e as InputEvent));
    this.ta.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.ta.addEventListener('keyup', () => this.scheduleLayout());
    this.ta.addEventListener('click', () => this.scheduleLayout());
    this.ta.addEventListener('focus', () => this.scheduleLayout());
    this.ta.addEventListener('paste', () => { /* normal paste; formatting handled in afterChange */ });
    this.onSel = () => { if (document.activeElement === this.ta) this.scheduleLayout(); };
    document.addEventListener('selectionchange', this.onSel);

    this.findBox.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button[data-a]') as HTMLElement | null;
      if (b) this.findAction(b.dataset.a!);
    });
    this.fi.addEventListener('input', () => { this.recomputeMatches(true); });
    this.fi.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.step(e.shiftKey ? -1 : 1); }
      else if (e.key === 'Escape') { e.preventDefault(); this.closeFind(); }
    });
    this.ri.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.replaceCurrent(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.closeFind(); }
    });

    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => { this.metricsDirty = true; this.scheduleLayout(); });
      this.ro.observe(this.scroller);
    }
    this.afterChange(false);
  }

  /* ---------- public API ---------- */
  getValue(): string { return this.ta.value; }

  setValue(text: string) {
    this.ta.value = text;
    this.errorLine = null;
    this.afterChange(false);
    this.scroller.scrollTop = 0; this.scroller.scrollLeft = 0;
    this.ta.setSelectionRange(0, 0);
    this.positionLines();
  }

  focus() { this.ta.focus({ preventScroll: true }); }
  destroy() { document.removeEventListener('selectionchange', this.onSel); this.ro?.disconnect(); if (this.layoutRaf) cancelAnimationFrame(this.layoutRaf); }

  setErrorLine(line: number | null) {
    this.errorLine = line && line > 0 ? line : null;
    this.renderGutter(true); this.positionLines();
    if (this.errorLine) this.revealLine(this.errorLine);
  }

  undo() { this.focus(); document.execCommand('undo'); }
  redo() { this.focus(); document.execCommand('redo'); }

  /** Insert text at the caret as if typed (used by the mobile symbol bar). */
  typeText(text: string) {
    this.focus();
    if (text.length === 1 && this.typeChar(text)) return;
    const { selectionStart: s, selectionEnd: e } = this.ta;
    this.replace(s, e, text);
  }

  tabKey(back: boolean) { this.focus(); this.handleTab(back); }

  format(): boolean {
    const before = this.ta.value;
    const after = formatPython(before);
    if (after === before) return false;
    const caret = this.ta.selectionStart;
    const lineNo = before.slice(0, caret).split('\n').length - 1;
    this.focus();
    this.replace(0, before.length, after, 0, 0);
    const lines = after.split('\n');
    let off = 0; for (let i = 0; i < Math.min(lineNo, lines.length - 1); i++) off += lines[i].length + 1;
    this.ta.setSelectionRange(off, off);
    return true;
  }

  toggleComment() { this.focus(); this.commentLines(); }

  openFind(withReplace = false) {
    this.findBox.hidden = false;
    (this.findBox.querySelector('.pe-repl') as HTMLElement).hidden = !withReplace;
    const sel = this.ta.value.slice(this.ta.selectionStart, this.ta.selectionEnd);
    if (sel && !sel.includes('\n')) this.fi.value = sel;
    this.fi.focus(); this.fi.select();
    this.recomputeMatches(false);
  }

  closeFind() {
    this.findBox.hidden = true; this.matches = []; this.current = -1;
    this.render(); this.focus();
  }

  /* ---------- rendering ---------- */
  /** Small documents re-render synchronously; big ones coalesce bursts of input events into one frame. */
  private scheduleChange() {
    if (this.ta.value.length < 8000) { this.afterChange(true); return; }
    if (this.changeRaf) return;
    this.changeRaf = requestAnimationFrame(() => { this.changeRaf = 0; this.afterChange(true); });
  }

  private scheduleLayout() {
    if (this.layoutRaf) return;
    this.layoutRaf = requestAnimationFrame(() => {
      this.layoutRaf = 0;
      this.positionLines();
      this.ensureCaretVisible();
    });
  }

  private metrics() {
    this.metricsDirty = false;
    const cs = getComputedStyle(this.ta);
    const lh = parseFloat(cs.lineHeight); if (lh > 0) this.lh = lh;
    const w = this.measure.getBoundingClientRect().width / 20; if (w > 0) this.cw = w;
    this.padTop = parseFloat(cs.paddingTop) || 0; this.padLeft = parseFloat(cs.paddingLeft) || 0;
  }

  private afterChange(userEdit: boolean) {
    if (userEdit && this.errorLine) { this.errorLine = null; this.lineCount = -1; }
    this.toks = tokenize(this.ta.value);
    if (!this.findBox.hidden && this.fi.value) this.recomputeMatches(false, true);
    this.render();
    this.renderGutter(false);
    this.scheduleLayout();
    if (userEdit) this.opts.onChange?.();
  }

  private render() {
    this.hl.innerHTML = renderHtml(this.ta.value, this.toks, this.matches, this.current) + '\n ';
  }

  private renderGutter(force: boolean) {
    const n = this.ta.value.split('\n').length;
    if (!force && n === this.lineCount) return;
    this.lineCount = n;
    let html = '';
    for (let i = 1; i <= n; i++) html += (i === this.errorLine ? '<span class="pe-gerr">' + i + '</span>' : i) + (i < n ? '\n' : '');
    this.gutter.innerHTML = html;
  }

  private lineCol(pos: number) {
    const v = this.ta.value;
    const ls = v.lastIndexOf('\n', pos - 1) + 1;
    let line = 0; for (let i = v.indexOf('\n'); i !== -1 && i < pos; i = v.indexOf('\n', i + 1)) line++;
    let col = 0; for (let i = ls; i < pos; i++) col = v[i] === '\t' ? col + (4 - (col % 4)) : col + 1;
    return { line, col };
  }

  private positionLines() {
    if (this.metricsDirty) this.metrics();
    const { line } = this.lineCol(this.ta.selectionEnd);
    this.curLine.style.top = this.padTop + line * this.lh + 'px';
    this.curLine.style.height = this.lh + 'px';
    this.curLine.hidden = this.ta.selectionStart !== this.ta.selectionEnd;
    if (this.errorLine) {
      this.errLine.hidden = false;
      this.errLine.style.top = this.padTop + (this.errorLine - 1) * this.lh + 'px';
      this.errLine.style.height = this.lh + 'px';
    } else this.errLine.hidden = true;
  }

  private onCaret() { this.scheduleLayout(); }

  private ensureCaretVisible() {
    const sc = this.scroller;
    if (!sc.clientHeight) return;
    const { line, col } = this.lineCol(this.ta.selectionEnd);
    const top = this.padTop + line * this.lh;
    const bottom = top + this.lh;
    if (top < sc.scrollTop) sc.scrollTop = Math.max(0, top - this.lh);
    else if (bottom + this.lh > sc.scrollTop + sc.clientHeight) sc.scrollTop = bottom + this.lh - sc.clientHeight;
    const gw = this.gutter.offsetWidth;
    const x = this.padLeft + col * this.cw;       // inside .pe-code
    const viewLeft = sc.scrollLeft; const viewRight = sc.scrollLeft + sc.clientWidth - gw;
    if (x < viewLeft + 8) sc.scrollLeft = Math.max(0, x - 40);
    else if (x + this.cw * 2 > viewRight) sc.scrollLeft = x + this.cw * 4 - (sc.clientWidth - gw);
  }

  private revealLine(line: number) {
    const sc = this.scroller; if (!sc.clientHeight) return;
    const top = this.padTop + (line - 1) * this.lh;
    if (top < sc.scrollTop || top + this.lh > sc.scrollTop + sc.clientHeight) sc.scrollTop = Math.max(0, top - sc.clientHeight / 3);
  }

  /* ---------- editing primitives ---------- */
  private replace(start: number, end: number, text: string, selStart?: number, selEnd?: number) {
    const ta = this.ta;
    const prev = document.activeElement as HTMLElement | null;
    if (prev !== ta) ta.focus({ preventScroll: true });
    this.internal = true;
    try {
      ta.setSelectionRange(start, end);
      let ok = false;
      try {
        if (text.length > 30000) throw new Error('large insert: use setRangeText');
        ok = text === '' ? (start === end ? true : document.execCommand('delete')) : document.execCommand('insertText', false, text);
      } catch { ok = false; }
      if (!ok) {
        ta.setRangeText(text, start, end, 'end');
        this.afterChange(true);
      }
      const p = start + text.length;
      ta.setSelectionRange(selStart ?? p, selEnd ?? selStart ?? p);
    } finally { this.internal = false; }
    if (prev && prev !== ta && prev.focus) prev.focus({ preventScroll: true } as FocusOptions);
    this.afterChange(true);
  }

  private nextChar(pos: number) { return this.ta.value[pos] ?? ''; }
  private prevChar(pos: number) { return pos > 0 ? this.ta.value[pos - 1] : ''; }

  private tokenAt(pos: number): Tok | null {
    for (const t of this.toks) { if (t.s < pos && pos <= t.e) return t; if (t.s >= pos) break; }
    return null;
  }

  private onBeforeInput(e: InputEvent) {
    if (this.internal || e.isComposing) return;
    const { selectionStart: s, selectionEnd: en } = this.ta;
    switch (e.inputType) {
      case 'insertLineBreak':
      case 'insertParagraph':
        e.preventDefault(); this.enter(); break;
      case 'insertText':
        if (e.data && e.data.length === 1 && this.typeChar(e.data)) e.preventDefault();
        break;
      case 'deleteContentBackward':
        if (s === en && this.backspace()) e.preventDefault();
        break;
    }
  }

  /** Returns true when the character was fully handled. */
  private typeChar(ch: string): boolean {
    const { selectionStart: s, selectionEnd: en, value: v } = this.ta;
    const isQuote = ch === '"' || ch === "'";
    if (s !== en && (PAIRS[ch] || isQuote)) {
      const close = isQuote ? ch : PAIRS[ch];
      this.replace(s, en, ch + v.slice(s, en) + close, s + 1, en + 1); return true;
    }
    if (s !== en) return false;
    const next = this.nextChar(s); const prev = this.prevChar(s);
    if ((CLOSERS.has(ch) || isQuote) && next === ch) { this.ta.setSelectionRange(s + 1, s + 1); this.onCaret(); return true; }
    const nextOk = /^[\s)\]},:;]?$/.test(next);
    if (PAIRS[ch] && nextOk) { this.replace(s, s, ch + PAIRS[ch], s + 1); return true; }
    if (isQuote && nextOk) {
      const tok = this.tokenAt(s);
      const inStringOrComment = !!tok && (tok.c === 's' || tok.c === 'c' || tok.c === 'fx');
      const before2 = s > 1 ? v[s - 2] : '';
      const wordBefore = /\w/.test(prev) && !(/[rRbBfFuU]/.test(prev) && !/\w/.test(before2));
      if (!inStringOrComment && !wordBefore && prev !== ch) { this.replace(s, s, ch + ch, s + 1); return true; }
    }
    return false;
  }

  private backspace(): boolean {
    const { selectionStart: s, value: v } = this.ta;
    if (s === 0) return false;
    const prev = v[s - 1]; const next = v[s] ?? '';
    if ((PAIRS[prev] && PAIRS[prev] === next) || ((prev === '"' || prev === "'") && next === prev)) {
      this.replace(s - 1, s + 1, '', s - 1); return true;
    }
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    const before = v.slice(ls, s);
    if (before.length > 1 && /^ +$/.test(before)) {
      const n = before.length % 4 || 4;
      this.replace(s - n, s, '', s - n); return true;
    }
    return false;
  }

  private enter() {
    const { selectionStart: s, selectionEnd: en, value: v } = this.ta;
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    const before = v.slice(ls, s);
    let indent = /^[ \t]*/.exec(before)![0];
    const tok = this.tokenAt(s);
    const inString = !!tok && tok.c === 's' && tok.e > s;
    let code = before;
    const comment = this.toks.find((t) => t.c === 'c' && t.s >= ls && t.s < s);
    if (comment) code = v.slice(ls, comment.s);
    code = code.replace(/\s+$/, '');
    const prev = v[s - 1] ?? ''; const next = v[s] ?? '';
    if (!inString) {
      if (/:$/.test(code)) indent += TAB;
      else if (/^(return|pass|break|continue|raise)\b/.test(code.trim()) && indent.length >= 4) indent = indent.slice(0, indent.length - 4);
      else if (PAIRS[prev] && s === en) indent += TAB;
    }
    if (!inString && PAIRS[prev] && PAIRS[prev] === next) {
      const base = /^[ \t]*/.exec(before)![0];
      const mid = '\n' + indent + (indent === base ? TAB : '');
      const text = mid + '\n' + base;
      this.replace(s, en, text, s + mid.length); return;
    }
    this.replace(s, en, '\n' + indent);
  }

  private onKeyDown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'Escape') { this.trapTab = false; return; }
    if (e.key === 'Tab' && !mod && !e.altKey) {
      if (!this.trapTab) { this.trapTab = true; return; }
      e.preventDefault(); this.handleTab(e.shiftKey); return;
    }
    this.trapTab = true;
    if (mod && e.key === 'Enter') { e.preventDefault(); this.opts.onRun?.(); }
    else if (mod && (e.key === 's' || e.key === 'S')) { e.preventDefault(); this.opts.onSave?.(); }
    else if (mod && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); this.openFind(false); }
    else if (mod && (e.key === 'h' || e.key === 'H')) { e.preventDefault(); this.openFind(true); }
    else if (mod && e.key === '/') { e.preventDefault(); this.commentLines(); }
    else if (e.key === 'F3') { e.preventDefault(); this.step(e.shiftKey ? -1 : 1); }
  }

  private lineRange() {
    const { selectionStart: s, selectionEnd: en, value: v } = this.ta;
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    const endIdx = en > s && v[en - 1] === '\n' ? en - 1 : en;
    let le = v.indexOf('\n', endIdx); if (le < 0) le = v.length;
    return { s, en, ls, le, v };
  }

  private handleTab(back: boolean) {
    const { s, en, v } = this.lineRange();
    const multi = v.slice(s, en).includes('\n');
    if (!back && !multi) {
      const ls = v.lastIndexOf('\n', s - 1) + 1;
      const col = s - ls;
      this.replace(s, en, ' '.repeat(4 - (col % 4))); return;
    }
    this.shiftLines(back ? -1 : 1);
  }

  private shiftLines(dir: 1 | -1) {
    const { s, en, ls, le, v } = this.lineRange();
    const lines = v.slice(ls, le).split('\n');
    let firstDelta = 0; let total = 0;
    const out = lines.map((line, i) => {
      let delta = 0; let res = line;
      if (dir > 0) { if (line.trim() !== '' || lines.length === 1) { res = TAB + line; delta = 4; } }
      else {
        const m = /^( {1,4}|\t)/.exec(line);
        if (m) { res = line.slice(m[0].length); delta = -m[0].length; }
      }
      if (i === 0) firstDelta = delta;
      total += delta; return res;
    });
    this.replace(ls, le, out.join('\n'), Math.max(ls, s + firstDelta), Math.max(ls, en + total));
  }

  private commentLines() {
    const { s, en, ls, le, v } = this.lineRange();
    const lines = v.slice(ls, le).split('\n');
    const content = lines.filter((l) => l.trim() !== '');
    const allCommented = content.length > 0 && content.every((l) => /^\s*#/.test(l));
    const minIndent = Math.min(...content.map((l) => /^ */.exec(l)![0].length), 1e9);
    let total = 0; let firstDelta = 0;
    const out = lines.map((line, i) => {
      let res = line; let delta = 0;
      if (line.trim() !== '') {
        if (allCommented) {
          const m = /^(\s*)# ?/.exec(line)!; res = m[1] + line.slice(m[0].length); delta = res.length - line.length;
        } else {
          const at = minIndent === 1e9 ? 0 : minIndent; res = line.slice(0, at) + '# ' + line.slice(at); delta = 2;
        }
      }
      if (i === 0) firstDelta = delta; total += delta; return res;
    });
    this.replace(ls, le, out.join('\n'), Math.max(ls, s + firstDelta), Math.max(ls, en + total));
  }

  /* ---------- find & replace ---------- */
  private buildRegex(global = true): RegExp | null {
    const q = this.fi.value;
    if (!q) return null;
    let pattern = this.flags.re ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (this.flags.word) pattern = '\\b(?:' + pattern + ')\\b';
    try { return new RegExp(pattern, (global ? 'g' : '') + (this.flags.cs ? '' : 'i') + 'm'); } catch { return null; }
  }

  private recomputeMatches(jump: boolean, keepIndex = false) {
    const re = this.buildRegex();
    this.fi.classList.toggle('bad', !!this.fi.value && !re);
    const prev = this.current;
    this.matches = [];
    if (re) {
      const v = this.ta.value; let m: RegExpExecArray | null;
      while ((m = re.exec(v)) && this.matches.length < 5000) {
        if (m[0] === '') { re.lastIndex++; continue; }
        this.matches.push({ s: m.index, e: m.index + m[0].length });
      }
    }
    if (keepIndex) this.current = Math.min(prev, this.matches.length - 1);
    else {
      const pos = this.ta.selectionStart;
      const idx = this.matches.findIndex((x) => x.s >= pos);
      this.current = this.matches.length ? (idx < 0 ? 0 : idx) : -1;
    }
    this.updateCount(); this.render();
    if (jump && this.current >= 0) this.selectMatch(this.current);
  }

  private updateCount() {
    this.fc.textContent = this.fi.value ? (this.matches.length ? this.current + 1 + '/' + this.matches.length : this.buildRegex() ? '0/0' : 'invalid') : '';
  }

  private selectMatch(i: number) {
    const m = this.matches[i]; if (!m) return;
    this.current = i; this.ta.setSelectionRange(m.s, m.e);
    this.updateCount(); this.render(); this.positionLines();
    const { line, col } = this.lineCol(m.s);
    const sc = this.scroller;
    const top = this.padTop + line * this.lh;
    if (top < sc.scrollTop || top + this.lh > sc.scrollTop + sc.clientHeight) sc.scrollTop = Math.max(0, top - sc.clientHeight / 3);
    const x = this.padLeft + col * this.cw;
    if (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 60) sc.scrollLeft = Math.max(0, x - 80);
  }

  private step(dir: 1 | -1) {
    if (!this.matches.length) { this.recomputeMatches(true); return; }
    const n = this.matches.length;
    this.selectMatch((this.current + dir + n) % n);
  }

  private replaceCurrent() {
    if (this.current < 0) { this.recomputeMatches(true); return; }
    const m = this.matches[this.current]; const re = this.buildRegex(false);
    if (!m || !re) return;
    const repl = this.flags.re ? this.ta.value.slice(m.s, m.e).replace(re, this.ri.value) : this.ri.value;
    const idx = this.current;
    this.replace(m.s, m.e, repl);
    this.recomputeMatches(false, true);
    if (this.matches.length) this.selectMatch(Math.min(idx, this.matches.length - 1));
  }

  private replaceAll() {
    const re = this.buildRegex(true); if (!re || !this.matches.length) return;
    const v = this.ta.value;
    const next = this.flags.re ? v.replace(re, this.ri.value) : v.replace(re, () => this.ri.value);
    if (next !== v) this.replace(0, v.length, next, 0, 0);
    this.recomputeMatches(false);
  }

  private findAction(a: string) {
    switch (a) {
      case 'prev': this.step(-1); break;
      case 'next': this.step(1); break;
      case 'cs': case 'word': case 're': {
        const k = a as 'cs' | 'word' | 're'; this.flags[k] = !this.flags[k];
        (this.findBox.querySelector(`[data-a="${a}"]`) as HTMLElement).setAttribute('aria-pressed', String(this.flags[k]));
        this.recomputeMatches(false); break;
      }
      case 'tog': { const r = this.findBox.querySelector('.pe-repl') as HTMLElement; r.hidden = !r.hidden; if (!r.hidden) this.ri.focus(); break; }
      case 'rep': this.replaceCurrent(); break;
      case 'repall': this.replaceAll(); break;
      case 'close': this.closeFind(); break;
    }
  }
}
