// Builds a static test site from the project (esbuild stands in for `vite build` because the test sandbox has no npm access).
// Usage: node build_site.mjs <projectDir> <outDir>
import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'node:fs'; import path from 'node:path';
const [P, S] = [path.resolve(process.argv[2] || '.'), path.resolve(process.argv[3] || '/tmp/mx-site')];
fs.rmSync(S, { recursive: true, force: true }); fs.mkdirSync(S, { recursive: true });
fs.cpSync(P + '/public', S, { recursive: true });
const raw = { name: 'raw', setup(b) {
  b.onResolve({ filter: /\?raw$/ }, a => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
  b.onLoad({ filter: /.*/, namespace: 'raw' }, a => ({ contents: 'export default ' + JSON.stringify(fs.readFileSync(a.path, 'utf8')), loader: 'js' }));
} };
await build({ entryPoints: [P + '/src/main.tsx'], bundle: true, format: 'iife', outfile: S + '/main.bundle.js', loader: { '.css': 'css' }, target: 'es2020', logLevel: 'warning', plugins: [raw] });
const html = fs.readFileSync(P + '/index.html', 'utf8');
const tag = '<script type="module" src="/src/main.tsx"></script>';
if (!html.includes(tag)) throw new Error('module script tag not found');
fs.writeFileSync(S + '/index.html', html.replace(tag, '<link rel="stylesheet" href="./main.bundle.css"><script src="./main.bundle.js"></script>'));
console.log('built', S);
