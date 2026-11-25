// Bundles the whole app (src/main.tsx) with esbuild into .out/site for browser tests. (The real build is `npm run build` = vite.)
import fs from 'fs';
import { ROOT, SITE, esbuild } from './env.mjs';
const { build } = await esbuild();
fs.rmSync(SITE, { recursive: true, force: true });
fs.mkdirSync(SITE, { recursive: true });
fs.cpSync(ROOT + '/public', SITE, { recursive: true });
const rawPlugin = { name: 'raw', setup(b) {
  b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: new URL(a.path.replace(/\?raw$/, ''), 'file://' + a.resolveDir + '/').pathname, namespace: 'raw' }));
  b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: 'export default ' + JSON.stringify(fs.readFileSync(a.path, 'utf8')), loader: 'js' }));
} };
await build({ entryPoints: [ROOT + '/src/main.tsx'], bundle: true, format: 'iife', outfile: SITE + '/main.bundle.js', loader: { '.css': 'css' }, target: 'es2020', logLevel: 'warning', plugins: [rawPlugin] });
const html = fs.readFileSync(ROOT + '/index.html', 'utf8');
const tag = '<script type="module" src="/src/main.tsx"></script>';
if (!html.includes(tag)) throw new Error('script tag not found');
fs.writeFileSync(SITE + '/index.html', html.replace(tag, '<link rel="stylesheet" href="./main.bundle.css"><script src="./main.bundle.js"></script>'));
console.log('built', SITE);
