/* Shared pedagogical helpers, types, quiz engine, and local progress persistence
   for MATHNEX engineering modules (CS1033, MT1023, TE1010). */

export interface MnxBus {
  $: (id: string) => HTMLElement | null;
  el: (tag: string, cls?: string, txt?: string) => HTMLElement;
  toast: (msg: string) => void;
  cp: (txt: string) => void;
  stat: (ok: boolean) => void;
  store: { get: <T = unknown>(k: string) => T | null; set: (k: string, v: unknown) => void };
  fmtN: (n: number, p?: number) => string;
  cfg: { fmt: string; prec: number };
  RM: boolean;
  pushHist: (entry: { mod: string; title: string; txt: string; state?: unknown }) => void;
  registerRestore: (mod: string, fn: (state: unknown) => void) => void;
  switchMod: (m: string, opts?: { silent?: boolean }) => void;
  VALID_MODS: string[];
  renderCallout: (kind: 'error' | 'warn' | 'ok', label: string, msg: string, hint?: string) => HTMLElement;
  renderEmptyState: (icon: string, title: string, desc: string, btnText?: string, onBtn?: () => void) => HTMLElement;
  dialog: {
    confirm: (opts: Record<string, unknown>) => Promise<boolean>;
    info: (opts: Record<string, unknown>) => Promise<void>;
  };
}

export interface MxGraphController {
  render: () => void;
  fitView: () => void;
  resetView: () => void;
  setViewport: (x0: number, x1: number, y0: number, y1: number, isDefault?: boolean) => void;
}

export interface MxGraphApi {
  create: (cfg: {
    canvas: HTMLCanvasElement | string;
    readEl?: HTMLElement | string | null;
    toolEl?: HTMLElement | string | null;
    aspectLock?: boolean;
    defaultSnap?: boolean;
    supportsCurves?: boolean;
    exportName?: string;
    onFit?: () => void;
    buildScene: (pal: Record<string, string>) => Record<string, unknown>;
  }) => MxGraphController | null;
  math: {
    fmt: (n: number, p?: number) => string;
    getPalette: () => Record<string, string>;
  };
}

declare global {
  interface Window {
    __mnx?: MnxBus;
    MXGraph?: MxGraphApi;
    __progInit?: () => void;
    __materialsInit?: () => void;
    __fibreInit?: () => void;
  }
}

export const PROGRESS_KEY = 'mathnexEduProgress';

export interface ModProgressState {
  reviewedTopics: string[];
  quizBest: Record<string, { score: number; total: number; lastUpdated: string }>;
  completedExercises: string[];
}

export type EduProgressMap = Record<string, ModProgressState>;

export function loadEduProgress(mod: string): ModProgressState {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EduProgressMap;
      if (parsed && parsed[mod]) {
        return {
          reviewedTopics: Array.isArray(parsed[mod].reviewedTopics) ? parsed[mod].reviewedTopics : [],
          quizBest: parsed[mod].quizBest && typeof parsed[mod].quizBest === 'object' ? parsed[mod].quizBest : {},
          completedExercises: Array.isArray(parsed[mod].completedExercises) ? parsed[mod].completedExercises : [],
        };
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return { reviewedTopics: [], quizBest: {}, completedExercises: [] };
}

export function saveEduProgress(mod: string, state: ModProgressState): void {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    const map: EduProgressMap = raw ? JSON.parse(raw) : {};
    map[mod] = state;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    // storage unavailable
  }
}

export function toggleTopicReviewed(mod: string, topicId: string): boolean {
  const st = loadEduProgress(mod);
  const idx = st.reviewedTopics.indexOf(topicId);
  let active = false;
  if (idx >= 0) {
    st.reviewedTopics.splice(idx, 1);
  } else {
    st.reviewedTopics.push(topicId);
    active = true;
  }
  saveEduProgress(mod, st);
  return active;
}

export function markExerciseCompleted(mod: string, exId: string): void {
  const st = loadEduProgress(mod);
  if (!st.completedExercises.includes(exId)) {
    st.completedExercises.push(exId);
    saveEduProgress(mod, st);
  }
}

export function recordQuizResult(mod: string, quizId: string, score: number, total: number): void {
  const st = loadEduProgress(mod);
  const prev = st.quizBest[quizId];
  const bestScore = prev ? Math.max(prev.score, score) : score;
  st.quizBest[quizId] = {
    score: bestScore,
    total,
    lastUpdated: new Date().toLocaleDateString(),
  };
  saveEduProgress(mod, st);
}

export function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fmtSI(v: number, digits = 4): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-3) return v.toExponential(Math.max(1, digits - 1));
  return Number(v.toPrecision(digits)).toString();
}

export interface SubTabDef {
  id: string;
  label: string;
  meta?: string;
}

export function wireSubnav(
  navEl: HTMLElement,
  panelsRoot: HTMLElement,
  tabs: SubTabDef[],
  initialId: string,
  onSwitch?: (tabId: string) => void
): (tabId: string) => void {
  navEl.replaceChildren();
  const btns: Record<string, HTMLButtonElement> = {};
  const activate = (id: string) => {
    tabs.forEach((t) => {
      const active = t.id === id;
      const b = btns[t.id];
      if (b) {
        b.setAttribute('aria-selected', String(active));
        b.classList.toggle('active', active);
      }
      const p = panelsRoot.querySelector<HTMLElement>(`[data-subpanel="${t.id}"]`);
      if (p) p.hidden = !active;
    });
    if (onSwitch) onSwitch(id);
    window.dispatchEvent(new Event('resize'));
  };

  tabs.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.dataset.subtab = t.id;
    btn.textContent = t.label;
    btn.onclick = () => activate(t.id);
    btns[t.id] = btn;
    navEl.appendChild(btn);
  });

  activate(initialId);
  return activate;
}

export interface TheoryTopic {
  id: string;
  code: string;
  title: string;
  scope: 'Core' | 'Supplementary';
  outcome: string;
  summary: string;
  points: string[];
  codeOrFormula?: string;
  workedExample?: { title: string; body: string };
}

export function renderSyllabusBanner(opts: {
  courseCode: string;
  courseName: string;
  context: string;
  outcomes: string[];
}): string {
  return `
    <div class="edu-align-banner">
      <div class="edu-align-head">
        <div>
          <span class="badge-tag exact">Educationally Aligned Proposed Structure</span>
          <span class="badge-tag">${esc(opts.courseCode)} · ${esc(opts.courseName)}</span>
        </div>
        <small class="muted">${esc(opts.context)}</small>
      </div>
      <p class="note" style="margin:8px 0 6px">
        This outline maps core engineering principles and optional enrichment topics for independent study and verification. It is an educational module created for MATHNEX, not an official University of Moratuwa syllabus document, lecture handout, or past exam archive. Always cross-check exact exam scope with your module handbook.
      </p>
      <div class="edu-outcomes">
        <b>Target Learning Outcomes:</b>
        <ul>${opts.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

export function renderTheoryCatalog(
  container: HTMLElement,
  mod: string,
  topics: TheoryTopic[],
  onProgressChange?: () => void
): void {
  const prog = loadEduProgress(mod);
  container.replaceChildren();

  const filterBar = document.createElement('div');
  filterBar.className = 'edu-filter-bar';
  filterBar.innerHTML = `
    <div class="sc-seg" role="group" aria-label="Filter syllabus topics">
      <button type="button" data-tf="all" aria-pressed="true">All Topics (${topics.length})</button>
      <button type="button" data-tf="Core" aria-pressed="false">Core (${topics.filter((t) => t.scope === 'Core').length})</button>
      <button type="button" data-tf="Supplementary" aria-pressed="false">Supplementary (${topics.filter((t) => t.scope === 'Supplementary').length})</button>
    </div>
    <span class="edu-prog-summary" id="${esc(mod)}-topic-stat"></span>
  `;
  container.appendChild(filterBar);

  const list = document.createElement('div');
  list.className = 'edu-topic-grid';
  container.appendChild(list);

  const updateStat = () => {
    const cur = loadEduProgress(mod);
    const done = topics.filter((t) => cur.reviewedTopics.includes(t.id)).length;
    const statEl = container.querySelector(`#${mod}-topic-stat`);
    if (statEl) statEl.textContent = `Reviewed ${done} / ${topics.length} topics`;
  };

  let curFilter: 'all' | 'Core' | 'Supplementary' = 'all';

  const drawList = () => {
    list.replaceChildren();
    const cur = loadEduProgress(mod);
    const visible = topics.filter((t) => curFilter === 'all' || t.scope === curFilter);
    visible.forEach((t, idx) => {
      const done = cur.reviewedTopics.includes(t.id);
      const card = document.createElement('details');
      card.className = 'edu-topic-card' + (done ? ' is-done' : '');
      if (idx === 0) card.open = true;

      const summary = document.createElement('summary');
      summary.innerHTML = `
        <span class="edu-topic-code">${esc(t.code)}</span>
        <span class="edu-topic-title">${esc(t.title)}</span>
        <span class="badge-tag ${t.scope === 'Core' ? 'exact' : 'approx'}">${esc(t.scope)}</span>
        <span class="edu-done-flag">${done ? '✓ Reviewed' : 'Pending'}</span>
      `;
      card.appendChild(summary);

      const body = document.createElement('div');
      body.className = 'edu-topic-body';
      body.innerHTML = `
        <p class="edu-outcome-line"><b>Learning Outcome:</b> ${esc(t.outcome)}</p>
        <p>${esc(t.summary)}</p>
        <ul>${t.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        ${t.codeOrFormula ? `<pre class="edu-codeblock">${esc(t.codeOrFormula)}</pre>` : ''}
        ${
          t.workedExample
            ? `<div class="formula-card"><b>Worked Example — ${esc(t.workedExample.title)}:</b><br><span style="white-space:pre-wrap">${esc(t.workedExample.body)}</span></div>`
            : ''
        }
      `;

      const foot = document.createElement('div');
      foot.className = 'row';
      foot.style.marginTop = '10px';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = done ? '✓ Marked as Reviewed' : 'Mark Topic Reviewed';
      btn.onclick = () => {
        const nowDone = toggleTopicReviewed(mod, t.id);
        card.classList.toggle('is-done', nowDone);
        const flag = summary.querySelector('.edu-done-flag');
        if (flag) flag.textContent = nowDone ? '✓ Reviewed' : 'Pending';
        btn.textContent = nowDone ? '✓ Marked as Reviewed' : 'Mark Topic Reviewed';
        updateStat();
        if (onProgressChange) onProgressChange();
      };
      foot.appendChild(btn);
      body.appendChild(foot);
      card.appendChild(body);
      list.appendChild(card);
    });
    updateStat();
  };

  filterBar.querySelectorAll<HTMLButtonElement>('[data-tf]').forEach((b) => {
    b.onclick = () => {
      curFilter = (b.dataset.tf as 'all' | 'Core' | 'Supplementary') || 'all';
      filterBar.querySelectorAll<HTMLButtonElement>('[data-tf]').forEach((x) => {
        x.setAttribute('aria-pressed', String(x === b));
      });
      drawList();
    };
  });

  drawList();
  void prog;
}

export interface QuizQuestion {
  id: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  kind: 'mcq' | 'numeric';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  correctIndex?: number;
  numericAnswer?: number;
  tolerance?: number; // relative or absolute depending on tolMode
  tolMode?: 'abs' | 'rel';
  unit?: string;
  explanation: string;
}

export function renderQuizSuite(
  container: HTMLElement,
  mod: string,
  quizId: string,
  questions: QuizQuestion[],
  onProgressChange?: () => void
): void {
  container.replaceChildren();
  let levelFilter: 'All' | 'Beginner' | 'Intermediate' | 'Advanced' = 'All';
  const answers: Record<string, string | number> = {};

  const top = document.createElement('div');
  top.className = 'edu-filter-bar';
  top.innerHTML = `
    <div class="sc-seg" role="group" aria-label="Filter difficulty">
      <button type="button" data-ql="All" aria-pressed="true">All (${questions.length})</button>
      <button type="button" data-ql="Beginner" aria-pressed="false">Beginner</button>
      <button type="button" data-ql="Intermediate" aria-pressed="false">Intermediate</button>
      <button type="button" data-ql="Advanced" aria-pressed="false">Advanced</button>
    </div>
    <div class="row">
      <button type="button" class="primary" data-qact="grade">Check All Answers</button>
      <button type="button" data-qact="reset">Reset Attempt</button>
    </div>
  `;
  container.appendChild(top);

  const summaryBox = document.createElement('div');
  summaryBox.className = 'resultbox';
  summaryBox.style.marginBottom = '12px';
  const savedBest = loadEduProgress(mod).quizBest[quizId];
  summaryBox.textContent = savedBest
    ? `Best recorded score: ${savedBest.score} / ${savedBest.total} (${Math.round((savedBest.score / savedBest.total) * 100)}%) · Last recorded ${savedBest.lastUpdated}`
    : 'Select options or enter numerical values, then press Check All Answers.';
  container.appendChild(summaryBox);

  const qList = document.createElement('div');
  qList.className = 'edu-quiz-list';
  container.appendChild(qList);

  const drawQuestions = (graded = false) => {
    qList.replaceChildren();
    const visible = questions.filter((q) => levelFilter === 'All' || q.level === levelFilter);
    visible.forEach((q, idx) => {
      const item = document.createElement('div');
      item.className = 'edu-q-item';
      const head = document.createElement('div');
      head.className = 'edu-q-head';
      head.innerHTML = `
        <span class="badge-tag">Q${idx + 1} · ${esc(q.level)}</span>
        <span class="muted" style="font-size:12px">${esc(q.category)}</span>
      `;
      item.appendChild(head);

      const promptEl = document.createElement('p');
      promptEl.className = 'edu-q-prompt';
      promptEl.textContent = q.prompt;
      item.appendChild(promptEl);

      if (q.codeSnippet) {
        const pre = document.createElement('pre');
        pre.className = 'edu-codeblock';
        pre.textContent = q.codeSnippet;
        item.appendChild(pre);
      }

      if (q.kind === 'mcq' && q.options) {
        const optsWrap = document.createElement('div');
        optsWrap.className = 'edu-q-opts';
        q.options.forEach((opt, oi) => {
          const label = document.createElement('label');
          label.className = 'edu-q-opt';
          const inp = document.createElement('input');
          inp.type = 'radio';
          inp.name = `${quizId}-${q.id}`;
          inp.value = String(oi);
          inp.checked = answers[q.id] === oi;
          inp.onchange = () => {
            answers[q.id] = oi;
          };
          const span = document.createElement('span');
          span.textContent = opt;
          label.append(inp, span);
          if (graded) {
            if (oi === q.correctIndex) label.classList.add('is-correct');
            else if (answers[q.id] === oi && oi !== q.correctIndex) label.classList.add('is-wrong');
          }
          optsWrap.appendChild(label);
        });
        item.appendChild(optsWrap);
      } else if (q.kind === 'numeric') {
        const row = document.createElement('div');
        row.className = 'row';
        const lbl = document.createElement('label');
        lbl.className = 'field';
        lbl.textContent = `Answer${q.unit ? ` (${q.unit})` : ''}`;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = 'any';
        inp.value = answers[q.id] !== undefined ? String(answers[q.id]) : '';
        inp.placeholder = 'Enter numeric value…';
        inp.oninput = () => {
          answers[q.id] = inp.value;
        };
        lbl.appendChild(inp);
        row.appendChild(lbl);
        item.appendChild(row);
      }

      if (graded) {
        let isCorrect = false;
        if (q.kind === 'mcq') {
          isCorrect = answers[q.id] === q.correctIndex;
        } else {
          const val = parseFloat(String(answers[q.id] ?? ''));
          const target = q.numericAnswer ?? 0;
          const tol = q.tolerance ?? 0.02;
          if (Number.isFinite(val)) {
            if (q.tolMode === 'abs') isCorrect = Math.abs(val - target) <= tol;
            else isCorrect = Math.abs(val - target) <= Math.max(Math.abs(target) * tol, 1e-6);
          }
        }
        const fb = document.createElement('div');
        fb.className = `mx-callout ${isCorrect ? 'mx-callout--ok' : 'mx-callout--error'}`;
        fb.innerHTML = `
          <div>
            <span class="mx-clbl">${isCorrect ? '✓ Correct' : '✗ Review Solution'}</span>
            <span>${esc(q.explanation)}</span>
          </div>
        `;
        item.appendChild(fb);
      }

      qList.appendChild(item);
    });
  };

  top.querySelectorAll<HTMLButtonElement>('[data-ql]').forEach((b) => {
    b.onclick = () => {
      levelFilter = (b.dataset.ql as typeof levelFilter) || 'All';
      top.querySelectorAll<HTMLButtonElement>('[data-ql]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      drawQuestions(false);
    };
  });

  const gradeBtn = top.querySelector<HTMLButtonElement>('[data-qact="grade"]');
  const resetBtn = top.querySelector<HTMLButtonElement>('[data-qact="reset"]');

  if (gradeBtn) {
    gradeBtn.onclick = () => {
      const visible = questions.filter((q) => levelFilter === 'All' || q.level === levelFilter);
      let score = 0;
      visible.forEach((q) => {
        if (q.kind === 'mcq') {
          if (answers[q.id] === q.correctIndex) score++;
        } else {
          const val = parseFloat(String(answers[q.id] ?? ''));
          const target = q.numericAnswer ?? 0;
          const tol = q.tolerance ?? 0.02;
          if (Number.isFinite(val)) {
            const ok =
              q.tolMode === 'abs'
                ? Math.abs(val - target) <= tol
                : Math.abs(val - target) <= Math.max(Math.abs(target) * tol, 1e-6);
            if (ok) score++;
          }
        }
      });
      if (levelFilter === 'All') {
        recordQuizResult(mod, quizId, score, visible.length);
        if (onProgressChange) onProgressChange();
      }
      const pct = visible.length ? Math.round((score / visible.length) * 100) : 0;
      summaryBox.className = `resultbox ${pct >= 70 ? 's-ok' : 's-err'}`;
      summaryBox.innerHTML = `<div class="answerline">${pct >= 70 ? '✓' : '!'} Assessment Score: ${score} / ${visible.length} (${pct}%)</div><span class="muted">Review detailed worked explanations below each question.</span>`;
      drawQuestions(true);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      Object.keys(answers).forEach((k) => delete answers[k]);
      summaryBox.className = 'resultbox';
      summaryBox.textContent = 'Attempt reset. Answer questions and press Check All Answers.';
      drawQuestions(false);
    };
  }

  drawQuestions(false);
}
