# Python Studio end-to-end tests (Playwright + Chromium)

These tests drive the real UI in headless Chromium. Python is executed by a **CPython 3.12 stand-in for Pyodide**
(`shim_pyodide.js` + `server.py`) because the WebAssembly runtime is downloaded from a CDN. They verify the harness,
worker protocol, input channels (service worker, SharedArrayBuffer, queued fallback), Stop/time-limit, editor, files,
and mobile layout. They do NOT verify Pyodide itself — run the app online and try the sample programs to cover that.

Paths inside the scripts (`/home/claude/...`, `/opt/npm-tools/...`) are from the sandbox where they were run; adjust them.
`python3 tests/test_harness.py` (plain CPython) tests `public/py-harness.py` on its own.
