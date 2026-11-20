/* TEST STUB for Pyodide: same JS API surface the worker uses, but Python code is executed by a real CPython 3.12
   subprocess behind /shim/* (see server.py). It exercises harness + worker + input channels + UI, NOT Pyodide/WASM. */
const BASE = location.href.startsWith('blob:http') ? new URL(location.href.slice(5)).origin : 'http://localhost:8765';
async function loadPyodide() {
  let bridge = null, harness = null; const files = {};
  const post = (path, body) => fetch(BASE + path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
  const api = {
    version: 'shim',
    registerJsModule(name, obj) { bridge = obj; },
    runPython(src) { if (src.includes('sys.version')) return '3.12.3'; harness = src; },
    FS: { writeFile(n, c) { files[n] = c; }, unlink(n) { delete files[n]; } },
    async loadPackagesFromImports() {},
    globals: { get(name) {
      return async (code, filename, names) => {
        const { sid } = await post('/shim/start', { harness, code, filename, names, files });
        for (;;) {
          const { events } = await post('/shim/poll', { sid });
          for (const ev of events) {
            if (ev.t === 'emit') bridge.emit(ev.kind, ev.text);
            else if (ev.t === 'input') { const v = bridge.read_input(); await post('/shim/input', { sid, value: v }); }
            else if (ev.t === 'done') return JSON.stringify(ev.result);
          }
        }
      };
    } }
  };
  return api;
}
