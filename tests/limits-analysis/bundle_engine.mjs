import { ROOT, OUT, esbuild } from './env.mjs';
const { build } = await esbuild();
await build({ entryPoints: [ROOT + '/src/modules/limitsEngine.ts'], bundle: true, format: 'iife', globalName: 'LE', outfile: OUT + '/le.js', target: 'es2020', logLevel: 'warning' });
console.log('engine bundled');
