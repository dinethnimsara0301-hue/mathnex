/* MATHNEX Service Worker.
   1. Caches Clang WebAssembly assets (legacy, only if present under /clang/).
   2. Caches the Pyodide runtime (cache-first) so Python Studio can restart quickly/offline after first load.
   3. Provides the blocking-input channel for Python Studio: the Python worker issues a synchronous XHR to
      /__mnx_input__/<id>; the page answers it with postMessage({type:'mnx-input-reply', id, value|eof}).
   Leaves Vite dev/module files untouched so live updates never serve stale source modules. */

const CLANG_CACHE = 'mathnex-clang-v1';
const PYODIDE_CACHE = 'mathnex-pyodide-v1';
const STUDIO_CACHE = 'mathnex-pystudio-v1';
const KEEP = [CLANG_CACHE, PYODIDE_CACHE, STUDIO_CACHE];
const INPUT_PREFIX = '/__mnx_input__/';
const INPUT_TIMEOUT_MS = 4 * 60 * 1000;

const waiting = new Map();   // id -> resolve(reply)
const early = new Map();     // replies that arrived before the request

self.addEventListener('install', (event) => { event.waitUntil(self.skipWaiting()); });

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('mathnex-') && !KEEP.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

self.addEventListener('message', (event) => {
  const d = event.data || {};
  if (d.type === 'mnx-hello') {
    if (event.source) event.source.postMessage({ type: 'mnx-hello-ack', v: 1 });
  } else if (d.type === 'mnx-input-reply') {
    const reply = { eof: !!d.eof, value: d.value == null ? '' : String(d.value) };
    const resolve = waiting.get(d.id);
    if (resolve) { waiting.delete(d.id); resolve(reply); } else early.set(d.id, reply);
  } else if (d.type === 'mnx-input-cancel') {
    for (const [id, resolve] of waiting) { resolve({ eof: true, value: '' }); waiting.delete(id); }
    early.clear();
  }
  /* 'mnx-ping' only exists to keep this worker alive while the user types. */
});

function cacheFirst(cacheName, req) {
  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(req);
    if (cached) return cached;
    const response = await fetch(req);
    if (response && (response.ok || response.type === 'opaque')) cache.put(req, response.clone()).catch(() => {});
    return response;
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin && url.pathname.startsWith(INPUT_PREFIX)) {
    const id = Number(url.pathname.slice(INPUT_PREFIX.length));
    event.respondWith(new Promise((resolve) => {
      const ready = early.get(id);
      if (ready) { early.delete(id); resolve(jsonResponse(ready)); return; }
      const timer = setTimeout(() => { waiting.delete(id); resolve(jsonResponse({ eof: true, value: '' })); }, INPUT_TIMEOUT_MS);
      waiting.set(id, (reply) => { clearTimeout(timer); resolve(jsonResponse(reply)); });
    }));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith('/clang/')) {
    event.respondWith(cacheFirst(CLANG_CACHE, req));
    return;
  }
  if ((url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/pyodide/')) ||
      (url.hostname === 'unpkg.com' && url.pathname.startsWith('/pyodide@'))) {
    event.respondWith(cacheFirst(PYODIDE_CACHE, req));
    return;
  }
});
