// Structural lint of all chapter content (12 chapters): required sections, exercise levels, quiz integrity.
import { ROOT, OUT, esbuild } from './env.mjs';
import { createRequire } from 'module';
import fs from 'fs';
const { build } = await esbuild();
fs.writeFileSync(OUT + '/data_entry.ts', `export {LIMIT_CHAPTERS} from '${ROOT}/src/modules/limitsData'; export {ANALYSIS_CHAPTERS_1} from '${ROOT}/src/modules/analysisData1'; export {ANALYSIS_CHAPTERS_2} from '${ROOT}/src/modules/analysisData2';`);
await build({ entryPoints: [OUT + '/data_entry.ts'], bundle: true, format: 'cjs', platform: 'node', outfile: OUT + '/data.cjs', logLevel: 'warning' });
const d = createRequire(import.meta.url)(OUT + '/data.cjs');
const chs = [...d.LIMIT_CHAPTERS, ...d.ANALYSIS_CHAPTERS_1, ...d.ANALYSIS_CHAPTERS_2];
let bad = 0, nQ = 0, nEx = 0; const ids = new Set();
for (const c of chs) {
  for (const k of ['objectives', 'theory', 'definitions', 'formulas', 'examples', 'applications', 'exercises', 'quiz', 'test']) if (!c[k] || !c[k].length) { console.log('EMPTY', c.id, k); bad++; }
  if (!c.graphical || !c.graphical.demo) { console.log('NODEMO', c.id); bad++; }
  const lv = new Set(c.exercises.map((e) => e.level));
  for (const L of ['Beginner', 'Intermediate', 'Advanced', 'University']) if (!lv.has(L)) { console.log('missing level', c.id, L); bad++; }
  for (const q of [...c.quiz, ...c.test]) { nQ++; if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length) || new Set(q.options).size !== q.options.length) { console.log('BAD QUESTION', c.id, q.id); bad++; } }
  for (const e of c.exercises) { if (ids.has(e.id)) { console.log('DUP', e.id); bad++; } ids.add(e.id); nEx++; }
}
console.log(`chapters ${chs.length} · questions ${nQ} · exercises ${nEx} · problems ${bad}`);
process.exit(bad ? 1 : 0);
