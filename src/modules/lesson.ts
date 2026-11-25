/* Shared chapter renderer implementing the MATHNEX 12-part teaching system:
   objectives · theory · definitions · formulas · worked examples · graphical explanation · engineering applications ·
   beginner / intermediate / advanced exercises · interactive quiz · chapter assessment.
   Progress is stored with the existing MATHNEX education progress store (mathnexEduProgress). */

import './mathpro.css';
import { esc, loadEduProgress, markExerciseCompleted, renderQuizSuite, saveEduProgress, type QuizQuestion } from './shared';
import { rich, richBlock, formulaBlock } from './mxrich';

export interface WorkedExample {
  title: string;
  problem: string;
  steps: string[];
  answer: string;
  why?: string;
}
export interface Exercise {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'University';
  q: string;
  hint?: string;
  sol: string;
}
export interface ChapterData {
  id: string;
  code: string;
  title: string;
  blurb: string;
  objectives: string[];
  theory: { h: string; body: string }[];
  definitions: { name: string; text: string }[];
  formulas: { name: string; f: string }[];
  examples: WorkedExample[];
  graphical: { text: string; demo: string };
  applications: { h: string; text: string }[];
  exercises: Exercise[];
  quiz: QuizQuestion[];
  test: QuizQuestion[];
}

export type DemoMounter = (host: HTMLElement) => void;

export interface LessonHost {
  mod: string; // progress namespace
  chapters: ChapterData[];
  demos: Record<string, DemoMounter>;
  container: HTMLElement;
  onChange?: () => void;
}

const LEVEL_ORDER: Exercise['level'][] = ['Beginner', 'Intermediate', 'Advanced', 'University'];
const LEVEL_CLASS: Record<string, string> = { Beginner: 'lv-b', Intermediate: 'lv-i', Advanced: 'lv-a', University: 'lv-u' };

function rng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}
/** Deterministic option shuffle so correct answers are not always in the same position (stable across reloads). */
export function shuffleQuestions(qs: QuizQuestion[], seed: string): QuizQuestion[] {
  return qs.map((q) => {
    if (q.kind !== 'mcq' || !q.options) return q;
    const r = rng(seed + q.id);
    const idx = q.options.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return { ...q, options: idx.map((i) => (q.options as string[])[i]), correctIndex: idx.indexOf(q.correctIndex as number) };
  });
}

export function chapterStats(mod: string, ch: ChapterData) {
  const p = loadEduProgress(mod);
  const exDone = ch.exercises.filter((e) => p.completedExercises.includes(`${mod}:${e.id}`)).length;
  const q = p.quizBest[`${ch.id}-quiz`];
  const t = p.quizBest[`${ch.id}-test`];
  const complete = p.reviewedTopics.includes(ch.id);
  return { exDone, exTotal: ch.exercises.length, q, t, complete };
}

export function overallProgress(mod: string, chapters: ChapterData[]): { done: number; total: number; pct: number } {
  const p = loadEduProgress(mod);
  const done = chapters.filter((c) => p.reviewedTopics.includes(c.id)).length;
  return { done, total: chapters.length, pct: Math.round((done / Math.max(1, chapters.length)) * 100) };
}

function setComplete(mod: string, id: string, on: boolean): void {
  const p = loadEduProgress(mod);
  const i = p.reviewedTopics.indexOf(id);
  if (on && i < 0) p.reviewedTopics.push(id);
  if (!on && i >= 0) p.reviewedTopics.splice(i, 1);
  saveEduProgress(mod, p);
}

export function renderLessonHome(h: LessonHost, open: (id: string) => void): void {
  const c = h.container;
  c.replaceChildren();
  const ov = overallProgress(h.mod, h.chapters);
  const top = document.createElement('div');
  top.className = 'lsn-overall';
  top.innerHTML = `
    <div class="lsn-ring" style="--p:${ov.pct}"><b>${ov.pct}%</b></div>
    <div><b>${ov.done} / ${ov.total} chapters completed</b><br><small class="muted">Progress, exercises and quiz scores are saved on this device.</small></div>`;
  c.appendChild(top);
  const grid = document.createElement('div');
  grid.className = 'lsn-grid';
  h.chapters.forEach((ch) => {
    const st = chapterStats(h.mod, ch);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lsn-card' + (st.complete ? ' done' : '');
    b.innerHTML = `
      <span class="lsn-code">${esc(ch.code)}</span>
      <span class="lsn-title">${esc(ch.title)}</span>
      <span class="lsn-blurb">${esc(ch.blurb)}</span>
      <span class="lsn-meta">
        <i>${st.complete ? '✓ Completed' : 'Not completed'}</i>
        <i>Exercises ${st.exDone}/${st.exTotal}</i>
        <i>Quiz ${st.q ? `${st.q.score}/${st.q.total}` : '—'}</i>
        <i>Test ${st.t ? `${st.t.score}/${st.t.total}` : '—'}</i>
      </span>`;
    b.onclick = () => open(ch.id);
    grid.appendChild(b);
  });
  c.appendChild(grid);
}

function section(id: string, num: string, title: string, inner: string): string {
  return `<section class="lsn-sec" id="${esc(id)}"><h3><span class="n">${esc(num)}</span>${esc(title)}</h3>${inner}</section>`;
}

export function renderChapter(h: LessonHost, id: string, back: () => void, go: (id: string) => void): void {
  const idx = h.chapters.findIndex((c) => c.id === id);
  const ch = h.chapters[idx];
  const c = h.container;
  c.replaceChildren();
  if (!ch) return;
  const uid = (s: string) => `${h.mod}-${ch.id}-${s}`;

  const bar = document.createElement('div');
  bar.className = 'lsn-bar';
  bar.innerHTML = `
    <button type="button" data-a="back">← All chapters</button>
    <span class="lsn-crumb"><b>${esc(ch.code)}</b> · ${esc(ch.title)}</span>
    <span class="lsn-bar-nav">
      <button type="button" data-a="prev" ${idx === 0 ? 'disabled' : ''} aria-label="Previous chapter">‹</button>
      <button type="button" data-a="next" ${idx === h.chapters.length - 1 ? 'disabled' : ''} aria-label="Next chapter">›</button>
    </span>`;
  (bar.querySelector('[data-a="back"]') as HTMLButtonElement).onclick = back;
  (bar.querySelector('[data-a="prev"]') as HTMLButtonElement).onclick = () => idx > 0 && go(h.chapters[idx - 1].id);
  (bar.querySelector('[data-a="next"]') as HTMLButtonElement).onclick = () => idx < h.chapters.length - 1 && go(h.chapters[idx + 1].id);
  c.appendChild(bar);

  const nav = document.createElement('nav');
  nav.className = 'lsn-pills';
  nav.setAttribute('aria-label', 'Chapter sections');
  const names = ['Objectives', 'Theory', 'Definitions', 'Formulas', 'Examples', 'Graph', 'Applications', 'Exercises', 'Quiz', 'Assessment'];
  const keys = ['obj', 'theory', 'defs', 'forms', 'ex', 'graph', 'apps', 'exer', 'quiz', 'test'];
  names.forEach((n, i) => {
    const a = document.createElement('button');
    a.type = 'button';
    a.textContent = n;
    a.onclick = () => document.getElementById(uid(keys[i]))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nav.appendChild(a);
  });
  c.appendChild(nav);

  const body = document.createElement('div');
  body.className = 'lsn-body';

  const objHtml = `<ul class="mxr-ul">${ch.objectives.map((o) => `<li>${rich(o)}</li>`).join('')}</ul>`;
  const theoryHtml = ch.theory.map((t) => `<details class="lsn-det" open><summary>${rich(t.h)}</summary><div class="lsn-prose">${richBlock(t.body)}</div></details>`).join('');
  const defsHtml = `<div class="lsn-defs">${ch.definitions.map((d) => `<div class="lsn-def"><b>${rich(d.name)}</b><div>${rich(d.text)}</div></div>`).join('')}</div>`;
  const formsHtml = `<div class="lsn-forms">${ch.formulas.map((f) => `<div class="lsn-form"><small>${rich(f.name)}</small>${formulaBlock(f.f)}</div>`).join('')}</div>`;
  const exHtml = ch.examples
    .map(
      (e, i) => `<details class="lsn-det lsn-ex" ${i === 0 ? 'open' : ''}><summary>Example ${i + 1} — ${rich(e.title)}</summary>
        <div class="lsn-prose"><p><b>Problem.</b> ${rich(e.problem)}</p>
        <ol class="lsn-steps">${e.steps.map((s) => `<li>${rich(s)}</li>`).join('')}</ol>
        <div class="lsn-answer"><b>Answer.</b> ${rich(e.answer)}</div>
        ${e.why ? `<p class="lsn-why"><b>Why it works.</b> ${rich(e.why)}</p>` : ''}</div></details>`
    )
    .join('');
  const appsHtml = ch.applications.map((a) => `<div class="lsn-app"><b>${rich(a.h)}</b><div>${rich(a.text)}</div></div>`).join('');
  const p0 = loadEduProgress(h.mod);
  const exByLevel = LEVEL_ORDER.map((lv) => {
    const list = ch.exercises.filter((e) => e.level === lv);
    if (!list.length) return '';
    return `<h4 class="lsn-lv ${LEVEL_CLASS[lv]}">${lv}</h4>${list
      .map((e, i) => {
        const done = p0.completedExercises.includes(`${h.mod}:${e.id}`);
        return `<details class="lsn-det lsn-exr"><summary><span class="lsn-qn">${lv[0]}${i + 1}</span> ${rich(e.q)}</summary>
          <div class="lsn-prose">${e.hint ? `<p class="lsn-hint"><b>Hint.</b> ${rich(e.hint)}</p>` : ''}
          <details class="lsn-sol"><summary>Show worked solution</summary><div>${richBlock(e.sol)}</div></details>
          <label class="lsn-chk"><input type="checkbox" data-ex="${esc(e.id)}" ${done ? 'checked' : ''}> I solved this one</label></div></details>`;
      })
      .join('')}`;
  }).join('');

  body.innerHTML =
    section(uid('obj'), '01', 'Learning Objectives', objHtml) +
    section(uid('theory'), '02', 'Detailed Theory', theoryHtml) +
    section(uid('defs'), '03', 'Mathematical Definitions', defsHtml) +
    section(uid('forms'), '04', 'Important Formulas', formsHtml) +
    section(uid('ex'), '05', 'Step-by-Step Worked Examples', exHtml) +
    section(uid('graph'), '06', 'Graphical Explanation', `<div class="lsn-prose">${richBlock(ch.graphical.text)}</div><div class="lsn-demo" id="${uid('demo')}"></div>`) +
    section(uid('apps'), '07', 'Engineering Applications', appsHtml) +
    section(uid('exer'), '08', 'Exercises — Beginner → Intermediate → Advanced → University', exByLevel) +
    section(uid('quiz'), '09', 'Interactive Quiz (instant explanations)', `<div id="${uid('quizbox')}"></div>`) +
    section(uid('test'), '10', 'Chapter Assessment (pass mark 70 %)', `<div id="${uid('testbox')}"></div>`);
  c.appendChild(body);

  // exercise checkboxes
  body.querySelectorAll<HTMLInputElement>('input[data-ex]').forEach((inp) => {
    inp.onchange = () => {
      const exId = `${h.mod}:${inp.dataset.ex}`;
      const p = loadEduProgress(h.mod);
      const i = p.completedExercises.indexOf(exId);
      if (inp.checked && i < 0) markExerciseCompleted(h.mod, exId);
      if (!inp.checked && i >= 0) {
        p.completedExercises.splice(i, 1);
        saveEduProgress(h.mod, p);
      }
      refreshFoot();
      h.onChange?.();
    };
  });

  // demo
  const demoHost = document.getElementById(uid('demo'));
  const mount = h.demos[ch.graphical.demo];
  if (demoHost && mount) {
    try {
      mount(demoHost);
    } catch (e) {
      demoHost.textContent = `Interactive demo could not start: ${(e as Error).message}`;
    }
  }

  const completeIfPassed = () => {
    const p = loadEduProgress(h.mod);
    const t = p.quizBest[`${ch.id}-test`];
    if (t && t.score / t.total >= 0.7) {
      setComplete(h.mod, ch.id, true);
      refreshFoot();
    }
    h.onChange?.();
  };
  const qb = document.getElementById(uid('quizbox'));
  if (qb) renderQuizSuite(qb, h.mod, `${ch.id}-quiz`, shuffleQuestions(ch.quiz, `${ch.id}q`), () => h.onChange?.());
  const tb = document.getElementById(uid('testbox'));
  if (tb) renderQuizSuite(tb, h.mod, `${ch.id}-test`, shuffleQuestions(ch.test, `${ch.id}t`), completeIfPassed);

  const foot = document.createElement('div');
  foot.className = 'lsn-foot';
  c.appendChild(foot);
  function refreshFoot() {
    const st = chapterStats(h.mod, ch);
    foot.innerHTML = `
      <div><b>${st.complete ? '✓ Chapter completed' : 'Chapter in progress'}</b>
        <small class="muted"> · exercises ${st.exDone}/${st.exTotal} · quiz ${st.q ? `${st.q.score}/${st.q.total}` : '—'} · assessment ${st.t ? `${st.t.score}/${st.t.total}` : '—'}</small></div>
      <div class="row"><button type="button" class="primary" data-a="toggle">${st.complete ? 'Mark as not completed' : 'Mark chapter completed'}</button></div>`;
    (foot.querySelector('[data-a="toggle"]') as HTMLButtonElement).onclick = () => {
      setComplete(h.mod, ch.id, !chapterStats(h.mod, ch).complete);
      refreshFoot();
      h.onChange?.();
    };
  }
  refreshFoot();
}

/** Convenience: full chapter browser (home grid ⇄ chapter view). */
export function mountLessons(h: LessonHost, initial?: string): { open: (id: string | null) => void } {
  const open = (id: string | null) => {
    if (!id) {
      renderLessonHome(h, (cid) => open(cid));
    } else {
      renderChapter(h, id, () => open(null), (cid) => open(cid));
    }
    try {
      localStorage.setItem(`mathnexLast_${h.mod}`, id || '');
    } catch {
      /* ignore */
    }
  };
  open(initial && h.chapters.some((c) => c.id === initial) ? initial : null);
  return { open };
}
