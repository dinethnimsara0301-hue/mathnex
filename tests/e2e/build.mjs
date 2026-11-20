import { build } from '/opt/npm-tools/node_modules/esbuild/lib/main.js';
import fs from 'fs';
const P='/home/claude/proj', STAGE='/home/claude/test/stage', S='/home/claude/test/site';
fs.rmSync(STAGE,{recursive:true,force:true}); fs.rmSync(S,{recursive:true,force:true});
fs.cpSync(P+'/src',STAGE+'/src',{recursive:true}); fs.mkdirSync(S,{recursive:true}); fs.cpSync(P+'/public',S,{recursive:true});
// test-only: point the embedded worker at the CPython-backed Pyodide stand-in
let w=fs.readFileSync(STAGE+'/src/modules/pysrc/worker.js','utf8');
const i=w.indexOf('const SOURCES = ['), j=w.indexOf('];',i)+2;
w=w.slice(0,i)+"const SOURCES = [(self.location.href.startsWith('blob:http') ? new URL(self.location.href.slice(5)).origin : 'http://localhost:8765') + '/shim/'];"+w.slice(j);
fs.writeFileSync(STAGE+'/src/modules/pysrc/worker.js',w);
const rawPlugin={name:'raw',setup(b){
  b.onResolve({filter:/\?raw$/},a=>({path:new URL(a.path.replace(/\?raw$/,''),'file://'+a.resolveDir+'/').pathname,namespace:'raw'}));
  b.onLoad({filter:/.*/,namespace:'raw'},a=>({contents:'export default '+JSON.stringify(fs.readFileSync(a.path,'utf8')),loader:'js'}));
}};
await build({entryPoints:[STAGE+'/src/main.tsx'],bundle:true,format:'iife',outfile:S+'/main.bundle.js',loader:{'.css':'css'},target:'es2020',logLevel:'warning',plugins:[rawPlugin]});
const html=fs.readFileSync(P+'/index.html','utf8');
const tag='<script type="module" src="/src/main.tsx"></script>';
if(!html.includes(tag)) throw new Error('script tag not found');
fs.writeFileSync(S+'/index.html',html.replace(tag,'<link rel="stylesheet" href="/main.bundle.css"><script src="/main.bundle.js"></script>'));
// file:// variant (relative URLs)
fs.writeFileSync(S+'/index_file.html',html.replace(tag,'<link rel="stylesheet" href="./main.bundle.css"><script src="./main.bundle.js"></script>'));
fs.copyFileSync('/home/claude/test/shim_pyodide.js',S+'/shim_pyodide.js');
console.log('built');
