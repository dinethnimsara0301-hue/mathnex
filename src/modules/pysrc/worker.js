/* MATHNEX Python Studio - Web Worker.
   Loads Pyodide (CPython compiled to WebAssembly) and runs user code off the main thread.

   This file is embedded in the app (src/modules/prog.ts imports it with ?raw) and started from a Blob URL, so it
   also works when index.html is opened straight from disk (file://).

   input() support, chosen by the page:
     "sab"    SharedArrayBuffer + Atomics.wait   (page must be cross-origin isolated)
     "sw"     synchronous XHR answered by the service worker (sw.js)
     "replay" no blocking channel available: when input() has no queued answer the run stops with status
              "need-input"; the page asks the user, then re-runs the program feeding all answers so far and
              skipping the output that was already shown.
*/
'use strict';

const PY_VERSION = '0.27.7';
const SOURCES = [
  'https://cdn.jsdelivr.net/pyodide/v' + PY_VERSION + '/full/',
  'https://unpkg.com/pyodide@' + PY_VERSION + '/'
];

let pyodide = null;
let runFn = null;
let mode = 'replay';
let skip = 0;          // characters of program output to suppress (already shown in a previous replay)
let i32 = null;
let u8 = null;
let queued = [];
let reqId = 0;
let prevFiles = new Set();

const post = (m) => self.postMessage(m);
const status = (text) => post({ type: 'status', text: String(text) });

/* ---- bridge functions called from Python (see public/py-harness.py) ---- */
function emit(kind, text) {
  text = String(text);
  if (skip > 0) {
    if (text.length <= skip) { skip -= text.length; return; }
    text = text.slice(skip); skip = 0;
  }
  post({ type: 'out', kind: kind === 'stderr' ? 'stderr' : 'stdout', text: String(text) });
}

function readInput() {
  if (mode === 'replay') {
    if (!queued.length) return 'N';                 // harness raises _NeedInput and the run stops
    const answer = queued.shift();
    return answer === null ? 'E' : 'L:' + answer;
  }
  const id = ++reqId;
  if (mode === 'sab') {
    Atomics.store(i32, 0, 0);
    post({ type: 'input-request', id });
    Atomics.wait(i32, 0, 0);
    const state = Atomics.load(i32, 0);
    const len = Atomics.load(i32, 1);
    Atomics.store(i32, 0, 0);
    if (state === 2) return 'E';
    const copy = new Uint8Array(len);
    copy.set(u8.subarray(8, 8 + len));
    return 'L:' + new TextDecoder().decode(copy);
  }
  /* mode === 'sw' */
  post({ type: 'input-request', id });
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', self.location.origin + '/__mnx_input__/' + id, false);
    xhr.send();
    if (xhr.status !== 200) throw new Error('input channel returned HTTP ' + xhr.status);
    const reply = JSON.parse(xhr.responseText);
    return reply.eof ? 'E' : 'L:' + String(reply.value);
  } catch (err) {
    emit('stderr', '[input channel lost: ' + (err && err.message ? err.message : err) + ']\n');
    return 'E';
  }
}

/* ---- runtime start-up ---- */
async function init(msg) {
  mode = msg.mode || 'replay';
  if (mode === 'sab') {
    i32 = new Int32Array(msg.sab);
    u8 = new Uint8Array(msg.sab);
  }
  const errors = [];
  for (const base of SOURCES) {
    try {
      status('Downloading Python runtime…');
      importScripts(base + 'pyodide.js');
      status('Starting Python…');
      pyodide = await loadPyodide({ indexURL: base });
      break;
    } catch (err) {
      errors.push(base + ' → ' + (err && err.message ? err.message : err));
      pyodide = null;
    }
  }
  if (!pyodide) throw new Error('Could not load Pyodide.\n' + errors.join('\n'));

  pyodide.registerJsModule('mnx_bridge', { emit, flush: () => {}, read_input: readInput });
  if (!msg.harness) throw new Error('Internal error: harness source missing');
  pyodide.runPython(msg.harness);
  runFn = pyodide.globals.get('_mnx_run');
  const python = pyodide.runPython('import sys; sys.version.split()[0]');
  post({ type: 'ready', python, pyodide: pyodide.version });
}

function syncFiles(files) {
  const names = new Set(Object.keys(files));
  for (const old of prevFiles) {
    if (!names.has(old)) { try { pyodide.FS.unlink(old); } catch (e) { /* already gone */ } }
  }
  for (const name of names) pyodide.FS.writeFile(name, files[name]);
  prevFiles = names;
}

async function run(msg) {
  const { code, filename, files } = msg;
  try {
    syncFiles(files);
    post({ type: 'phase', phase: 'packages' });
    try {
      await pyodide.loadPackagesFromImports(code, {
        messageCallback: status,
        errorCallback: (m) => emit('stderr', '[package] ' + m + '\n')
      });
    } catch (err) {
      emit('stderr', '[package loading failed: ' + (err && err.message ? err.message : err) + ']\n');
    }
    post({ type: 'phase', phase: 'exec' });
    const t0 = performance.now();
    const raw = await runFn(code, filename, JSON.stringify(Object.keys(files)));
    post({ type: 'done', result: JSON.parse(raw), duration: performance.now() - t0 });
  } catch (err) {
    emit('stderr', String(err && err.message ? err.message : err) + '\n');
    post({ type: 'done', result: { status: 'crash', file: null, line: null, etype: 'RuntimeCrash', code: 1 }, duration: 0 });
  }
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'init') {
    init(msg).catch((err) => post({ type: 'init-error', message: String(err && err.message ? err.message : err) }));
  } else if (msg.type === 'run') {
    if (!pyodide) { post({ type: 'init-error', message: 'Runtime is not ready.' }); return; }
    queued = (msg.queued || []).slice();
    skip = msg.skip || 0;
    run(msg);
  }
};
