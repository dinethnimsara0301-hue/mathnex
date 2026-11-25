# MATHNEX — Android / Termux run guide

## Important
This is a Vite + React + TypeScript project. Do not open `index.html` directly from the Downloads app.
Run the Vite server from Termux, then open the local address in Chrome.

## First-time setup (Android)
1. Extract this ZIP.
2. In Termux, allow storage access if needed:
   `termux-setup-storage`
3. Copy the extracted folder from shared storage into Termux's private home folder.
   Example, if the extracted folder is `MATHNEX` in Downloads:
   `cp -r ~/storage/downloads/MATHNEX ~/MATHNEX`
4. Enter the private copy:
   `cd ~/MATHNEX`
5. Install dependencies (the legacy peer flag is needed for the dependency peer-version set in this project):
   `npm install --legacy-peer-deps`
6. Start the dev server:
   `npm run dev`
7. Open this exact URL in Chrome:
   `http://127.0.0.1:4173/`

## Each later run
Open Termux and run:
`cd ~/MATHNEX`
`npm run dev`
Then open `http://127.0.0.1:4173/`.

## Notes
- Keep Termux running while using the site. Closing the Termux session stops the local server.
- This project uses Vite to compile `src/main.tsx` and the TypeScript modules. Directly opening `index.html` with `file://` will not run those modules.
- Python Studio downloads the Pyodide WebAssembly runtime from a public CDN the first time it starts, so an internet connection is required for that initial runtime download. The app's other local features do not need a Gemini API key for the basic local interactions.
- Port 4173 is fixed with `--strictPort`; if it is already occupied, stop the earlier server with Ctrl+C before starting a new one.

## New in this version
Modules 13 (Limits & Continuity) and 14 (Real Analysis) are fully offline and need no extra setup. See `MATHNEX_LIMITS_ANALYSIS_REPORT.md`.
