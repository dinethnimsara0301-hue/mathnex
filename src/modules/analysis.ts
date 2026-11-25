/* MATHNEX — Real Analysis module (Module 14). */
import { wireSubnav } from './shared';
import { mountLessons, type DemoMounter } from './lesson';
import { ANALYSIS_CHAPTERS_1 } from './analysisData1';
import { ANALYSIS_CHAPTERS_2 } from './analysisData2';
import {
  mountContinuityAnalysisLab,
  mountDifferentiationLab,
  mountProofStudio,
  mountRealSetExplorer,
  mountRiemannLab,
  mountSequenceExplorer,
  mountSeriesLab,
  mountSupInfTester,
} from './analysisDemos';
import { setCAS } from './limitsEngine';

const MOD = 'analysis';
let initialized = false;
const STATE_KEY = 'mathnexAnalysisState';

export const ANALYSIS_CHAPTERS = [...ANALYSIS_CHAPTERS_1, ...ANALYSIS_CHAPTERS_2];

function loadTab(): string | null {
  try {
    const r = localStorage.getItem(STATE_KEY);
    return r ? (JSON.parse(r) as { tab?: string }).tab || null : null;
  } catch {
    return null;
  }
}
function saveTab(tab: string): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ tab }));
  } catch {
    /* storage unavailable */
  }
}

export function initAnalysisModule(): void {
  if (initialized) return;
  const root = document.getElementById('mod-analysis');
  if (!root || !window.__mnx) return;
  const nav = root.querySelector<HTMLElement>('#anSubnav');
  const panels = root.querySelector<HTMLElement>('#anPanels');
  if (!nav || !panels) return;
  initialized = true;
  setCAS(window.__mnx.CAS as never);

  panels.innerHTML = `
    <div data-subpanel="chapters"><div id="anLessons"></div></div>
    <div data-subpanel="seq" hidden><section class="card"><h3><span class="n">03</span>Sequence Explorer — ε–N, monotone, Cauchy</h3><div id="anSeq"></div></section>
      <section class="card" style="margin-top:12px"><h3><span class="n">04</span>Supremum / Infimum Tester</h3><div id="anSup"></div></section></div>
    <div data-subpanel="series" hidden><section class="card"><h3><span class="n">05</span>Series Lab — partial sums &amp; convergence tests</h3><div id="anSeries"></div></section></div>
    <div data-subpanel="calc" hidden><section class="card"><h3><span class="n">06</span>Continuity, Differentiability &amp; Integration Labs</h3>
      <h4 style="margin:0 0 8px">Uniform continuity (ε–δ scan)</h4><div id="anCont"></div>
      <h4 style="margin:18px 0 8px">Rolle / MVT / Taylor</h4><div id="anDiff"></div>
      <h4 style="margin:18px 0 8px">Riemann sums &amp; the Fundamental Theorem</h4><div id="anRiem"></div></section></div>
    <div data-subpanel="proof" hidden><section class="card"><h3><span class="n">07</span>Proof Studio</h3><div id="anProof"></div></section>
      <section class="card" style="margin-top:12px"><h3><span class="n">08</span>Set Explorer (open, closed, bounded)</h3><div id="anSet"></div></section></div>`;
  const q = <T extends HTMLElement>(id: string) => panels.querySelector<T>(`#${id}`) as T;

  const demos: Record<string, DemoMounter> = {
    'an-real': mountRealSetExplorer,
    'an-supinf': mountSupInfTester,
    'an-seq': mountSequenceExplorer,
    'an-series': mountSeriesLab,
    'an-cont': mountContinuityAnalysisLab,
    'an-diff': mountDifferentiationLab,
    'an-riemann': mountRiemannLab,
    'an-proof': mountProofStudio,
  };
  mountLessons({ mod: MOD, chapters: ANALYSIS_CHAPTERS, demos, container: q('anLessons') });

  const mounted: Record<string, boolean> = {};
  const lazy = (tab: string) => {
    if (mounted[tab]) return;
    mounted[tab] = true;
    if (tab === 'seq') {
      mountSequenceExplorer(q('anSeq'));
      mountSupInfTester(q('anSup'));
    } else if (tab === 'series') mountSeriesLab(q('anSeries'));
    else if (tab === 'calc') {
      mountContinuityAnalysisLab(q('anCont'));
      mountDifferentiationLab(q('anDiff'));
      mountRiemannLab(q('anRiem'));
    } else if (tab === 'proof') {
      mountProofStudio(q('anProof'));
      mountRealSetExplorer(q('anSet'));
    }
  };
  const tabs = [
    { id: 'chapters', label: 'Chapters' },
    { id: 'seq', label: 'Sequences & Sup/Inf' },
    { id: 'series', label: 'Series Lab' },
    { id: 'calc', label: 'Continuity · Derivative · Integral' },
    { id: 'proof', label: 'Proof Studio' },
  ];
  const saved = loadTab();
  wireSubnav(nav, panels, tabs, saved && tabs.some((t) => t.id === saved) ? saved : 'chapters', (id) => {
    lazy(id);
    saveTab(id);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  });
}
