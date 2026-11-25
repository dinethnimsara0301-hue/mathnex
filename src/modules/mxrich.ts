/* Lightweight offline math typography for MATHNEX learning modules.
   Syntax (applied after HTML-escaping, so content is always safe):
     ^{...}  superscript      _{...}  subscript
     \frac{a}{b}  stacked fraction        \sqrt{...}  radical with vinculum
     **bold**   *italic*   `code`   (single-line only)
   Everything else (ε δ ∀ ∃ ∈ ℝ ∑ ∫ → ≤ …) is plain Unicode. */

import { esc } from './shared';

function matchBrace(s: string, open: number): number {
  // s[open] === '{' ; returns index of the matching '}' or -1
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function conv(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      if (s.startsWith('\\frac{', i)) {
        const a0 = i + 5;
        const a1 = matchBrace(s, a0);
        if (a1 > 0 && s[a1 + 1] === '{') {
          const b1 = matchBrace(s, a1 + 1);
          if (b1 > 0) {
            out += `<span class="mxr-frac"><span class="mxr-n">${conv(s.slice(a0 + 1, a1))}</span><span class="mxr-d">${conv(s.slice(a1 + 2, b1))}</span></span>`;
            i = b1 + 1;
            continue;
          }
        }
      }
      if (s.startsWith('\\sqrt{', i)) {
        const a0 = i + 5;
        const a1 = matchBrace(s, a0);
        if (a1 > 0) {
          out += `<span class="mxr-sqrt"><span class="mxr-rad">√</span><span class="mxr-rcand">${conv(s.slice(a0 + 1, a1))}</span></span>`;
          i = a1 + 1;
          continue;
        }
      }
      out += c;
      i++;
      continue;
    }
    if ((c === '^' || c === '_') && s[i + 1] === '{') {
      const e = matchBrace(s, i + 1);
      if (e > 0) {
        const tag = c === '^' ? 'sup' : 'sub';
        out += `<${tag} class="mxr-s">${conv(s.slice(i + 2, e))}</${tag}>`;
        i = e + 1;
        continue;
      }
    }
    out += c;
    i++;
  }
  return out;
}

/** Inline rich text → safe HTML. */
export function rich(src: string): string {
  let h = conv(esc(src));
  h = h.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  h = h.replace(/(^|[^*\w])\*([^*\n]+)\*(?![*\w])/g, '$1<i>$2</i>');
  h = h.replace(/`([^`]+)`/g, '<code class="mxr-code">$1</code>');
  return h;
}

/** Multi-paragraph rich text: blank-line separated paragraphs, lines starting with "- " become bullets. */
export function richBlock(src: string): string {
  const blocks = src.split(/\n\s*\n/);
  return blocks
    .map((b) => {
      const lines = b.split('\n').map((l) => l.trimEnd()).filter((l) => l.length);
      if (!lines.length) return '';
      if (lines.every((l) => /^\s*-\s+/.test(l))) {
        return `<ul class="mxr-ul">${lines.map((l) => `<li>${rich(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${lines.map(rich).join('<br>')}</p>`;
    })
    .join('');
}

/** Display formula (centered, large). */
export function formulaBlock(src: string): string {
  return `<div class="mxr-formula">${rich(src)}</div>`;
}
