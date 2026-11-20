/**
 * MATHNEX Python Programming Studio.
 * Real Python 3 (Pyodide / WebAssembly) running in a Web Worker. See public/py-worker.js and public/py-harness.py.
 */
import './prog.css';
import { PyEditor } from './pyeditor';
import WORKER_SRC from './pysrc/worker.js?raw';
import HARNESS_SRC from './pysrc/harness.py?raw';

const STORE_KEY = 'mathnexPythonStudio_v2';
const LEGACY_KEY = 'mathnexPythonStudio_v1';
const MAX_OUTPUT_CHARS = 400_000;
const SAB_BYTES = 8 + 65536;

interface PFile { id: string; name: string; code: string }
interface Persisted { files: PFile[]; active: string; limit: number }
type Mode = 'sab' | 'sw' | 'replay';
type State = 'loading' | 'ready' | 'running' | 'input' | 'restarting' | 'error';
type Kind = 'stdout' | 'stderr' | 'meta' | 'stdin' | 'ok' | 'bad';
interface RunResult { status: 'ok' | 'error' | 'exit' | 'crash' | 'need-input'; file: string | null; line: number | null; etype: string | null; code: number }

const STARTER = `# Welcome to MATHNEX Python Studio
# Write Python code and press Run (Ctrl+Enter).

name = input("Enter your name: ")
for i in range(1, 4):
    print(f"{i}. Hello, {name}!")
`;

const TEMPLATES: { label: string; name: string; code: string }[] = [
  { label: 'Hello World', name: 'hello.py', code: 'print("Welcome to MATHNEX Python Studio")\n' },
  { label: 'Input & Output', name: 'io_demo.py', code: 'name = input("Enter your name: ")\nage = int(input("Enter your age: "))\n\nprint("Hello", name)\nprint("Your age is", age)\nprint(f"In 10 years you will be {age + 10}.")\n' },
  { label: 'Loops & Functions', name: 'functions.py', code: 'def square(n):\n    return n * n\n\ndef factorial(n):\n    result = 1\n    for k in range(2, n + 1):\n        result *= k\n    return result\n\nfor i in range(1, 11):\n    print(i, square(i), factorial(i))\n' },
  { label: 'Lists, Dicts & Sets', name: 'collections_demo.py', code: 'numbers = [10, 20, 30, 40]\nprint("sum:", sum(numbers), "mean:", sum(numbers) / len(numbers))\n\npoint = (3, 4)\nprint("tuple:", point)\n\nmarks = {"Maths": 82, "Physics": 74, "Chemistry": 91}\nfor subject, mark in sorted(marks.items(), key=lambda kv: -kv[1]):\n    print(f"{subject:<10} {mark:>3}")\n\nprint("unique:", sorted({1, 2, 2, 3, 3, 3}))\n' },
  { label: 'Classes (OOP)', name: 'classes.py', code: 'class Vector:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n\n    def __add__(self, other):\n        return Vector(self.x + other.x, self.y + other.y)\n\n    def length(self):\n        return (self.x ** 2 + self.y ** 2) ** 0.5\n\n    def __repr__(self):\n        return f"Vector({self.x}, {self.y})"\n\na, b = Vector(3, 4), Vector(1, 2)\nprint(a + b, a.length())\n' },
  { label: 'Exceptions & Files', name: 'files_errors.py', code: 'try:\n    print(10 / 0)\nexcept ZeroDivisionError:\n    print("Division by zero is not allowed")\n\n# Files live in the browser\'s in-memory file system (cleared when the runtime restarts)\nwith open("notes.txt", "w") as f:\n    f.write("line one\\nline two\\n")\n\nwith open("notes.txt") as f:\n    for line in f:\n        print(line.strip())\n' },
  { label: 'Quadratic solver', name: 'quadratic.py', code: 'import cmath\n\na = float(input("a = "))\nb = float(input("b = "))\nc = float(input("c = "))\n\nd = b * b - 4 * a * c\nroot1 = (-b + cmath.sqrt(d)) / (2 * a)\nroot2 = (-b - cmath.sqrt(d)) / (2 * a)\nprint("discriminant:", d)\nprint("roots:", root1, root2)\n' },
  { label: 'Numerical integration', name: 'integrate.py', code: 'import math\n\ndef simpson(f, a, b, n=1000):\n    h = (b - a) / n\n    total = f(a) + f(b)\n    for i in range(1, n):\n        total += (4 if i % 2 else 2) * f(a + i * h)\n    return total * h / 3\n\nprint("integral of sin(x) from 0 to pi =", simpson(math.sin, 0, math.pi))\nprint("integral of x**2 from 0 to 3   =", simpson(lambda x: x * x, 0, 3))\n' },
  { label: 'Matrix (pure Python)', name: 'matrix.py', code: 'A = [[1, 2], [3, 4]]\nB = [[5, 6], [7, 8]]\n\ndef matmul(X, Y):\n    return [[sum(x * y for x, y in zip(row, col)) for col in zip(*Y)] for row in X]\n\ndef det2(M):\n    return M[0][0] * M[1][1] - M[0][1] * M[1][0]\n\nprint("A x B =", matmul(A, B))\nprint("det(A) =", det2(A))\n' },
  { label: 'NumPy (loads package)', name: 'numpy_demo.py', code: '# NumPy is downloaded on first use (internet needed once).\nimport numpy as np\n\nA = np.array([[2.0, 1.0], [1.0, 3.0]])\nb = np.array([1.0, 2.0])\nprint("solution:", np.linalg.solve(A, b))\nprint("eigenvalues:", np.linalg.eigvals(A))\n' }
];

const uid = () => Math.random().toString(36).slice(2, 10);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function initProgModule(): void {
  const section = document.getElementById('mod-prog');
  const mount = document.getElementById('pysMount');
  if (!section || !mount || mount.dataset.mounted === '1') return;
  mount.dataset.mounted = '1';

  /* ------------------------------------------------------------ DOM */
  mount.innerHTML = `
  <div class="pys" data-pane="editor">
    <div class="pys-top">
      <div class="pys-brand"><span class="pys-logo">M</span><div><b>MATHNEX</b> Python Studio<small id="pysVer">Python 3 · WebAssembly</small></div></div>
      <span class="pys-pill" id="pysStatus" data-state="loading" role="status"><i></i><span id="pysStatusText">Loading Python…</span></span>
      <div class="pys-run">
        <button type="button" id="pysRun" class="pys-primary" title="Run (Ctrl+Enter)">▶ Run</button>
        <button type="button" id="pysStop" class="pys-danger" title="Stop execution" disabled>■ Stop</button>
        <button type="button" id="pysSave" title="Save (Ctrl+S)">Save</button>
      </div>
    </div>
    <div class="pys-tools" role="toolbar" aria-label="File and editor tools">
      <button type="button" id="pysNew" title="New empty file">＋ New</button>
      <select id="pysTpl" aria-label="New file from template"><option value="">Templates…</option></select>
      <button type="button" id="pysOpen" title="Import .py files">Open</button>
      <button type="button" id="pysDownload" title="Download current file">Download</button>
      <button type="button" id="pysFormat" title="Clean up indentation and whitespace">Format</button>
      <button type="button" id="pysFind" title="Find & replace (Ctrl+F)">Find</button>
      <button type="button" id="pysReset" title="Restore the starter code">Reset</button>
      <button type="button" id="pysClear" title="Clear console output">Clear output</button>
      <label class="pys-limit">Limit <select id="pysLimit" aria-label="Execution time limit">
        <option value="10">10 s</option><option value="30">30 s</option><option value="60">60 s</option><option value="120">2 min</option><option value="300">5 min</option><option value="0">None</option></select></label>
      <input id="pysFile" type="file" accept=".py,.txt,text/x-python,text/plain" multiple hidden>
    </div>
    <div class="pys-files" id="pysFiles" role="tablist" aria-label="Open files"></div>
    <div class="pys-mtabs" role="tablist">
      <button type="button" data-pane="editor" role="tab" aria-selected="true">Editor</button>
      <button type="button" data-pane="console" role="tab" aria-selected="false">Console<i id="pysDot" hidden></i></button>
    </div>
    <div class="pys-main">
      <div class="pys-pane pys-editorpane">
        <div id="pysEditor" class="pys-editor"></div>
        <div class="pys-keys" id="pysKeys" aria-label="Quick symbols"></div>
      </div>
      <div class="pys-pane pys-consolepane">
        <div class="pys-console-head"><span>CONSOLE</span><span class="pys-hint" id="pysRunInfo">stdout · stderr · input()</span><button type="button" id="pysRetry" hidden>Retry runtime</button></div>
        <div class="pys-out" id="pysOut" role="log" aria-live="polite" tabindex="0"></div>
      </div>
    </div>
    <div class="pys-foot"><span id="pysFoot">Autosaves in this browser</span><span id="pysSaved"></span></div>
  </div>
  <div class="pys-note"><b>About this runtime:</b> Python 3 runs in your browser through Pyodide (WebAssembly) inside a Web Worker — no server, API key or AI service. The first start downloads the runtime from a public CDN (internet needed once; it is cached afterwards). Many packages ship with Pyodide (numpy, pandas, scipy, sympy, matplotlib…) and load on <code>import</code>; packages that need native CPython extensions, threads, sockets or a desktop GUI are not supported. Files are stored in an in-memory file system and reset when the runtime restarts. Stop restarts the runtime; time spent waiting for input does not count toward the time limit.</div>`;

  const $ = <T extends HTMLElement>(id: string) => mount.querySelector<T>('#' + id)!;
  const pys = mount.querySelector<HTMLElement>('.pys')!;
  const runBtn = $('pysRun') as HTMLButtonElement;
  const stopBtn = $('pysStop') as HTMLButtonElement;
  const out = $('pysOut');
  const pill = $('pysStatus');
  const pillText = $('pysStatusText');
  const filesBar = $('pysFiles');
  const limitSel = $('pysLimit') as HTMLSelectElement;
  const retryBtn = $('pysRetry') as HTMLButtonElement;
  const dot = $('pysDot');

  /* ------------------------------------------------------------ storage */
  let data: Persisted = { files: [], active: '', limit: 30 };
  const loadData = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && Array.isArray(raw.files) && raw.files.length) {
        data = {
          files: raw.files.filter((f: PFile) => f && typeof f.name === 'string' && typeof f.code === 'string').map((f: PFile) => ({ id: f.id || uid(), name: f.name, code: f.code })),
          active: raw.active,
          limit: Number(raw.limit) >= 0 ? Number(raw.limit) : 30
        };
      } else {
        const old = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if (old && typeof old.code === 'string') data.files = [{ id: uid(), name: 'main.py', code: old.code }];
      }
    } catch { /* storage unavailable or corrupt: start fresh */ }
    if (!data.files.length) data.files = [{ id: uid(), name: 'main.py', code: STARTER }];
    if (!data.files.some((f) => f.id === data.active)) data.active = data.files[0].id;
  };
  let saveTimer = 0;
  const persist = (announce = false): boolean => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      $('pysSaved').textContent = announce ? 'Saved ✓ ' + new Date().toLocaleTimeString() : 'Autosaved';
      return true;
    } catch {
      $('pysSaved').textContent = 'Browser storage unavailable — use Download to keep your code';
      return false;
    }
  };
  const scheduleSave = () => { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(() => persist(false), 400); };
  const active = () => data.files.find((f) => f.id === data.active)!;

  /* ------------------------------------------------------------ editor */
  const editor = new PyEditor($('pysEditor'), {
    onChange: () => { active().code = editor.getValue(); scheduleSave(); },
    onRun: () => runBtn.click(),
    onSave: () => { active().code = editor.getValue(); persist(true); }
  });

  const keys: [string, string, string][] = [['⇥', 'tab', 'Tab'], ['⇤', 'untab', 'Outdent'], ['(', '(', ''], [')', ')', ''], ['[', '[', ''], [']', ']', ''], ['{', '{', ''], ['}', '}', ''], [':', ':', ''], ['"', '"', ''], ["'", "'", ''], ['=', '=', ''], ['#', '#', 'Comment'], ['_', '_', ''], ['↶', 'undo', 'Undo'], ['↷', 'redo', 'Redo']];
  const keysBar = $('pysKeys');
  keys.forEach(([label, act, title]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.dataset.k = act; if (title) b.title = title; b.setAttribute('aria-label', title || label);
    keysBar.appendChild(b);
  });
  keysBar.addEventListener('mousedown', (e) => e.preventDefault());       // keep the editor focused (keyboard stays open)
  keysBar.addEventListener('pointerdown', (e) => e.preventDefault());
  keysBar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest('button[data-k]') as HTMLElement | null; if (!b) return;
    const k = b.dataset.k!;
    if (k === 'tab') editor.tabKey(false); else if (k === 'untab') editor.tabKey(true);
    else if (k === 'undo') editor.undo(); else if (k === 'redo') editor.redo();
    else editor.typeText(k);
  });

  /* ------------------------------------------------------------ console */
  let outChars = 0; let truncated = false; let lastKind = ''; let lastNode: Text | null = null;
  const pending: [string, string][] = []; let raf = 0;
  let inputEl: HTMLElement | null = null;
  const clearOut = () => { out.replaceChildren(); outChars = 0; truncated = false; lastKind = ''; lastNode = null; pending.length = 0; inputEl = null; };
  const flushOut = () => {
    raf = 0;
    for (const [raw, kind] of pending.splice(0)) {
      const program = kind === 'stdout' || kind === 'stderr' || kind === 'stdin';   // status lines (Finished / Stopped ...) are never dropped
      if (truncated && program) continue;
      let text = raw;
      let justTruncated = false;
      if (program && outChars + text.length > MAX_OUTPUT_CHARS) { text = text.slice(0, Math.max(0, MAX_OUTPUT_CHARS - outChars)); truncated = true; justTruncated = true; }
      if (program) outChars += text.length;
      if (text) {
        if (kind === lastKind && lastNode && lastNode.parentNode === out.lastElementChild) lastNode.appendData(text);
        else {
          const span = document.createElement('span'); span.className = 'o-' + kind;
          lastNode = document.createTextNode(text); span.appendChild(lastNode); out.appendChild(span); lastKind = kind;
        }
      }
      if (justTruncated) {
        const s = document.createElement('span'); s.className = 'o-meta';
        s.textContent = '\n[output truncated at ' + MAX_OUTPUT_CHARS.toLocaleString() + ' characters]\n';
        out.appendChild(s); lastNode = null; lastKind = '';
      }
    }
    out.scrollTop = out.scrollHeight;
  };
  const appendOut = (text: string, kind: Kind) => {
    pending.push([text, kind]);
    if (!raf) raf = requestAnimationFrame(flushOut);
  };
  const flushNow = () => { if (raf) cancelAnimationFrame(raf); flushOut(); };

  /* ------------------------------------------------------------ file bar */
  const validName = (raw: string) => {
    let n = raw.trim().replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
    if (!n) return '';
    if (!/\.py$/i.test(n)) n += '.py';
    return n;
  };
  const uniqueName = (name: string) => {
    if (!data.files.some((f) => f.name === name)) return name;
    const base = name.replace(/\.py$/i, '');
    let i = 1; while (data.files.some((f) => f.name === `${base}_${i}.py`)) i++;
    return `${base}_${i}.py`;
  };
  const renderFiles = () => {
    filesBar.replaceChildren();
    data.files.forEach((f) => {
      const tab = document.createElement('div');
      tab.className = 'pys-file' + (f.id === data.active ? ' on' : '');
      tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(f.id === data.active));
      const name = document.createElement('button'); name.type = 'button'; name.className = 'pys-fname'; name.textContent = f.name; name.dataset.id = f.id; name.title = 'Open ' + f.name;
      tab.appendChild(name);
      if (f.id === data.active) {
        const ren = document.createElement('button'); ren.type = 'button'; ren.className = 'pys-fact'; ren.dataset.act = 'rename'; ren.title = 'Rename'; ren.setAttribute('aria-label', 'Rename file'); ren.textContent = '✎';
        const del = document.createElement('button'); del.type = 'button'; del.className = 'pys-fact'; del.dataset.act = 'delete'; del.title = 'Delete file'; del.setAttribute('aria-label', 'Delete file'); del.textContent = '✕';
        tab.append(ren, del);
      }
      filesBar.appendChild(tab);
    });
  };
  const openFile = (id: string) => {
    if (!data.files.some((f) => f.id === id) || id === data.active) return;
    active().code = editor.getValue();
    data.active = id; editor.setValue(active().code); renderFiles(); persist(false);
  };
  const addFile = (name: string, code: string) => {
    active().code = editor.getValue();
    const f: PFile = { id: uid(), name: uniqueName(name), code };
    data.files.push(f); data.active = f.id; editor.setValue(code); renderFiles(); persist(false);
  };
  filesBar.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const open = t.closest('.pys-fname') as HTMLElement | null;
    if (open) { openFile(open.dataset.id!); return; }
    const act = (t.closest('.pys-fact') as HTMLElement | null)?.dataset.act;
    if (act === 'rename') {
      const n = validName(window.prompt('Rename file', active().name) || '');
      if (n && n !== active().name) { active().name = uniqueName(n); renderFiles(); persist(false); }
    } else if (act === 'delete') {
      if (!window.confirm(`Delete ${active().name}? This cannot be undone.`)) return;
      data.files = data.files.filter((f) => f.id !== data.active);
      if (!data.files.length) data.files = [{ id: uid(), name: 'main.py', code: STARTER }];
      data.active = data.files[0].id; editor.setValue(active().code); renderFiles(); persist(false);
    }
  });

  /* toolbar actions */
  const tpl = $('pysTpl') as HTMLSelectElement;
  TEMPLATES.forEach((t, i) => { const o = document.createElement('option'); o.value = String(i); o.textContent = t.label; tpl.appendChild(o); });
  tpl.addEventListener('change', () => { const t = TEMPLATES[Number(tpl.value)]; tpl.value = ''; if (t) addFile(t.name, t.code); });
  $('pysNew').addEventListener('click', () => { let i = 1; while (data.files.some((f) => f.name === `untitled${i}.py`)) i++; addFile(`untitled${i}.py`, '# New Python file\n'); editor.focus(); });
  $('pysOpen').addEventListener('click', () => ($('pysFile') as HTMLInputElement).click());
  ($('pysFile') as HTMLInputElement).addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement;
    for (const file of Array.from(input.files || [])) {
      if (file.size > 1_000_000) { appendOut(`Skipped ${file.name}: files over 1 MB are not supported.\n`, 'stderr'); continue; }
      try { addFile(validName(file.name) || 'imported.py', (await file.text()).replace(/\r\n?/g, '\n')); }
      catch { appendOut(`Could not read ${file.name}.\n`, 'stderr'); }
    }
    input.value = '';
  });
  $('pysDownload').addEventListener('click', () => {
    const blob = new Blob([editor.getValue()], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = active().name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  $('pysSave').addEventListener('click', () => { active().code = editor.getValue(); persist(true); });
  $('pysFormat').addEventListener('click', () => { if (!editor.format()) $('pysSaved').textContent = 'Already formatted'; });
  $('pysFind').addEventListener('click', () => editor.openFind(false));
  $('pysReset').addEventListener('click', () => {
    if (!window.confirm(`Replace the contents of ${active().name} with the starter code?`)) return;
    editor.setValue(STARTER); active().code = STARTER; persist(false);
  });
  $('pysClear').addEventListener('click', () => clearOut());
  limitSel.addEventListener('change', () => { data.limit = Number(limitSel.value); persist(false); });
  const setPane = (p: string) => {
    pys.dataset.pane = p;
    mount.querySelectorAll<HTMLElement>('.pys-mtabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pane === p)));
    if (p === 'console') dot.hidden = true;
  };
  mount.querySelectorAll<HTMLElement>('.pys-mtabs button').forEach((b) => b.addEventListener('click', () => setPane(b.dataset.pane as string)));

  /* ------------------------------------------------------------ runtime */
  let worker: Worker | null = null;
  let state: State = 'loading';
  let mode: Mode = 'replay';
  let sab: SharedArrayBuffer | null = null;
  let phase: 'packages' | 'exec' = 'exec';
  let waiting = false; let waitId = 0;
  let activeMs = 0; let lastTick = 0; let tickTimer = 0; let pingTimer = 0;
  let pendingRun = false; let bootToken = 0; let bootTimer = 0; let workerUrl = ''; let lastStatus = '';
  let answers: (string | null)[] = []; let progChars = 0; let lastRun: { code: string; files: Record<string, string> } = { code: '', files: {} };
  let runStart = 0; let runFile = 'main.py'; let readyText = 'Python ready';

  const setState = (s: State, text?: string) => {
    state = s; pill.dataset.state = s;
    const labels: Record<State, string> = { loading: 'Loading Python…', ready: readyText, running: 'Running…', input: 'Waiting for input', restarting: 'Restarting runtime…', error: 'Runtime error' };
    pillText.textContent = text || labels[s];
    const busy = s === 'running' || s === 'input';
    runBtn.disabled = busy; stopBtn.disabled = !busy;
    retryBtn.hidden = s !== 'error';
  };

  const swMessage = (m: Record<string, unknown>) => { try { navigator.serviceWorker?.controller?.postMessage(m); } catch { /* ignore */ } };

  async function pickMode(): Promise<Mode> {
    if (self.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') return 'sab';
    const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!('serviceWorker' in navigator) || !secure) return 'replay';
    try {
      await Promise.race([navigator.serviceWorker.ready, sleep(4000)]);
      if (!navigator.serviceWorker.controller) {
        await Promise.race([new Promise<void>((r) => navigator.serviceWorker.addEventListener('controllerchange', () => r(), { once: true })), sleep(2500)]);
      }
      if (!navigator.serviceWorker.controller) return 'replay';
      const ack = new Promise<boolean>((resolve) => {
        const h = (ev: MessageEvent) => { if (ev.data && ev.data.type === 'mnx-hello-ack') { navigator.serviceWorker.removeEventListener('message', h); resolve(true); } };
        navigator.serviceWorker.addEventListener('message', h);
        setTimeout(() => { navigator.serviceWorker.removeEventListener('message', h); resolve(false); }, 1500);
      });
      swMessage({ type: 'mnx-hello' });
      return (await ack) ? 'sw' : 'replay';
    } catch { return 'replay'; }
  }

  async function boot(restart: boolean) {
    const token = ++bootToken;
    if (worker) { worker.terminate(); worker = null; }
    if (workerUrl) { URL.revokeObjectURL(workerUrl); workerUrl = ''; }
    setState(restart ? 'restarting' : 'loading');
    mode = await pickMode();
    if (token !== bootToken) return;
    sab = mode === 'sab' ? new SharedArrayBuffer(SAB_BYTES) : null;
    let w: Worker;
    try {
      // The worker source is embedded and started from a Blob URL, so this also works from file:// and sub-paths.
      workerUrl = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
      w = new Worker(workerUrl);
    } catch (err) { fail('Could not start the Python worker: ' + (err as Error).message + '\n' + diag()); return; }
    worker = w;
    w.onmessage = (ev: MessageEvent) => { if (worker === w) onWorker(ev.data); };
    w.onerror = (ev) => { if (worker === w) fail('Python worker error: ' + (ev.message || 'script error') + '\n' + diag()); };
    w.postMessage({ type: 'init', mode, sab, harness: HARNESS_SRC });
    window.clearTimeout(bootTimer);
    bootTimer = window.setTimeout(() => {
      if (token === bootToken && (state === 'loading' || state === 'restarting')) fail('The Python runtime did not start within 90 seconds. It is downloaded from a CDN (cdn.jsdelivr.net) — check your internet connection, ad-blockers or firewall.\n' + diag());
    }, 90000);
  }

  const diag = () => `[diagnostics] page=${location.protocol} input-mode=${mode} secure-context=${window.isSecureContext} last-status="${lastStatus}"`;

  function fail(message: string) {
    window.clearTimeout(bootTimer);
    stopTimers(); waiting = false; removeInput();
    appendOut(message + (navigator.onLine === false ? '\nYou appear to be offline: the first start needs internet to download the runtime.' : '') + '\n', 'stderr');
    setState('error', 'Runtime could not start'); flushNow();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onWorker(m: any) {
    switch (m.type) {
      case 'status': lastStatus = m.text; if (state === 'loading' || state === 'restarting' || (state === 'running' && phase === 'packages')) pillText.textContent = m.text; break;
      case 'ready':
        window.clearTimeout(bootTimer);
        $('pysVer').textContent = `Python ${m.python} · Pyodide ${m.pyodide}`;
        readyText = `Python ${m.python} ready`;
        setState('ready');
        if (pendingRun) { pendingRun = false; startRun(); }
        break;
      case 'init-error': fail(m.message); break;
      case 'out': progChars += (m.text as string).length; appendOut(m.text, m.kind); break;
      case 'phase': phase = m.phase; lastTick = performance.now(); if (m.phase === 'exec' && state === 'running') pillText.textContent = 'Running…'; break;
      case 'input-request': requestInput(m.id); break;
      case 'done': finishRun(m.result as RunResult, m.duration as number); break;
    }
  }

  /* ---- interactive input ---- */
  function removeInput() {
    window.clearInterval(pingTimer);
    inputEl?.remove(); inputEl = null; waiting = false;
  }
  function requestInput(id: number, onAnswer?: (value: string | null) => void) {
    flushNow();
    waiting = true; waitId = id; setState('input');
    setPane('console');
    const wrap = document.createElement('span'); wrap.className = 'o-inline';
    const field = document.createElement('input');
    field.type = 'text'; field.className = 'pys-in'; field.setAttribute('aria-label', 'Program input'); field.enterKeyHint = 'send';
    field.autocomplete = 'off'; field.autocapitalize = 'off'; field.spellcheck = false;
    const send = document.createElement('button'); send.type = 'button'; send.className = 'pys-send'; send.textContent = '↵'; send.setAttribute('aria-label', 'Send input');
    const eof = document.createElement('button'); eof.type = 'button'; eof.className = 'pys-eof'; eof.textContent = 'EOF'; eof.title = 'End of input (raises EOFError)';
    wrap.append(field, send, eof);
    out.appendChild(wrap); inputEl = wrap; lastKind = ''; lastNode = null;
    const submit = (isEof: boolean) => {
      if (!waiting || inputEl !== wrap) return;
      const value = field.value;
      wrap.remove(); inputEl = null;
      appendOut(isEof ? '^D\n' : value + '\n', 'stdin'); flushNow();
      const answer = isEof ? null : value;
      if (onAnswer) onAnswer(answer); else reply(answer);
    };
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(false); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); submit(true); }
    });
    send.addEventListener('click', () => submit(false));
    eof.addEventListener('click', () => submit(true));
    out.scrollTop = out.scrollHeight;
    field.focus({ preventScroll: true });
    if (mode === 'sw') { window.clearInterval(pingTimer); pingTimer = window.setInterval(() => swMessage({ type: 'mnx-ping' }), 10000); }
  }
  function reply(value: string | null) {
    window.clearInterval(pingTimer);
    waiting = false; lastTick = performance.now();
    if (state === 'input') setState('running');
    if (mode === 'sab' && sab) {
      const i32 = new Int32Array(sab); const u8 = new Uint8Array(sab);
      if (value === null) Atomics.store(i32, 0, 2);
      else { const bytes = new TextEncoder().encode(value).slice(0, SAB_BYTES - 8); u8.set(bytes, 8); Atomics.store(i32, 1, bytes.length); Atomics.store(i32, 0, 1); }
      Atomics.notify(i32, 0);
    } else if (mode === 'sw') {
      swMessage({ type: 'mnx-input-reply', id: waitId, value: value ?? '', eof: value === null });
    }
  }

  /* ---- run / stop ---- */
  const limitMs = () => data.limit * 1000;
  function stopTimers() { window.clearInterval(tickTimer); window.clearInterval(pingTimer); tickTimer = 0; }
  function startTimer() {
    stopTimers(); activeMs = 0; lastTick = performance.now();
    tickTimer = window.setInterval(() => {
      const now = performance.now(); const dt = now - lastTick; lastTick = now;
      if (state !== 'running' || waiting || phase !== 'exec') return;
      activeMs += dt;
      if (limitMs() > 0 && activeMs > limitMs()) killRun(`Execution stopped: the ${data.limit}-second time limit was reached (time spent waiting for input is not counted). Check for an infinite loop, or raise the limit in the toolbar.`);
    }, 200);
  }

  function startRun() {
    if (!worker) return;
    active().code = editor.getValue(); persist(false);
    clearOut(); editor.setErrorLine(null);
    runFile = active().name; runStart = performance.now(); phase = 'exec';
    const files: Record<string, string> = {};
    data.files.forEach((f) => { files[f.name] = f.code; });
    setState('running'); setPane('console'); startTimer();
    $('pysRunInfo').textContent = 'running ' + runFile;
    lastRun = { code: editor.getValue(), files };
    answers = []; progChars = 0;
    worker.postMessage({ type: 'run', code: lastRun.code, filename: runFile, files, queued: [], skip: 0 });
  }

  /** Replay mode (no blocking channel): the program stopped at input(); ask, then re-run with all answers so far. */
  function replayNeedInput() {
    requestInput(0, (value) => {
      answers.push(value);
      waiting = false; lastTick = performance.now(); phase = 'packages';
      setState('running');
      worker?.postMessage({ type: 'run', code: lastRun.code, filename: runFile, files: lastRun.files, queued: answers.slice(), skip: progChars });
    });
  }

  runBtn.addEventListener('click', () => {
    if (state === 'running' || state === 'input') return;
    if (state === 'ready' && worker) { startRun(); return; }
    if (state === 'error') { pendingRun = true; void boot(false); return; }
    pendingRun = true; pillText.textContent = 'Starting Python… will run when ready';
  });
  stopBtn.addEventListener('click', () => killRun('Execution stopped by user.'));
  retryBtn.addEventListener('click', () => { void boot(false); });

  function killRun(message: string) {
    if (state !== 'running' && state !== 'input') return;
    stopTimers(); waiting = false; removeInput();
    swMessage({ type: 'mnx-input-cancel' });
    appendOut('\n■ ' + message + '\n', 'bad'); flushNow();
    $('pysRunInfo').textContent = 'stopped after ' + fmtMs(performance.now() - runStart);
    pendingRun = false;
    void boot(true);
  }

  const fmtMs = (ms: number) => (ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s');
  function finishRun(r: RunResult, duration: number) {
    if (r.status === 'need-input' && mode === 'replay') { flushNow(); replayNeedInput(); return; }
    stopTimers(); removeInput(); flushNow();
    const time = fmtMs(duration);
    if (r.status === 'ok') appendOut(`\n✓ Finished in ${time}\n`, 'ok');
    else if (r.status === 'exit') appendOut(`\nProcess exited with code ${r.code} · ${time}\n`, r.code === 0 ? 'ok' : 'bad');
    else {
      const where = r.file && r.line ? ` (${r.file}, line ${r.line})` : '';
      appendOut(`\n✗ ${r.etype || 'Error'}${where} · ${time}\n`, 'bad');
      if (r.line && r.file === runFile && active().name === runFile) editor.setErrorLine(r.line);
    }
    $('pysRunInfo').textContent = `last run ${time} · ${r.status}`;
    setState('ready');
    flushNow();
    if (pys.dataset.pane !== 'console') dot.hidden = false;
  }

  /* ------------------------------------------------------------ mobile keyboard handling */
  const vv = window.visualViewport;
  const syncViewport = () => { if (vv) pys.style.setProperty('--vvh', vv.height + 'px'); };
  if (vv) { vv.addEventListener('resize', syncViewport); syncViewport(); }
  editor.ta.addEventListener('focus', () => {
    if (window.matchMedia('(max-width: 820px)').matches) setTimeout(() => pill.scrollIntoView({ block: 'start', behavior: 'smooth' }), 250);
  });

  /* ------------------------------------------------------------ start */
  loadData();
  renderFiles();
  editor.setValue(active().code);
  limitSel.value = String(data.limit);
  window.addEventListener('pagehide', () => { active().code = editor.getValue(); persist(false); worker?.terminate(); });
  void boot(false);
}
