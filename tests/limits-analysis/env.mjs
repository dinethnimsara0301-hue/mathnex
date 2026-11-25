// Shared paths/loaders for the Limits & Real Analysis test-suite (no npm install needed if esbuild + playwright are
// available globally or via NPM_TOOLS=/path/containing/node_modules).
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
export const TDIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(TDIR, '../..');
export const OUT = path.join(TDIR, '.out');
fs.mkdirSync(OUT, { recursive: true });
export const SITE = path.join(OUT, 'site');
export const SITE_URL = pathToFileURL(path.join(SITE, 'index.html')).href;
const cands = (n, rel) => [process.env.NPM_TOOLS && path.join(process.env.NPM_TOOLS, 'node_modules', n, rel), '/opt/npm-tools/node_modules/' + n + '/' + rel].filter(Boolean);
async function load(name, rel) {
  for (const c of cands(name, rel)) if (fs.existsSync(c)) return import(pathToFileURL(c).href);
  return import(name);
}
export const esbuild = () => load('esbuild', 'lib/main.js');
export const playwright = () => load('playwright', 'index.mjs');
