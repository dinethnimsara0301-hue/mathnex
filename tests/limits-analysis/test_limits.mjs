import fs from 'fs';
import { OUT, SITE_URL, TDIR, playwright } from './env.mjs';
const { chromium } = await playwright();
const b = await chromium.launch(); const p = await b.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
await p.goto(SITE_URL); await p.waitForTimeout(1200);
await p.addScriptTag({content: fs.readFileSync(OUT+'/le.js','utf8')});
await p.evaluate(()=>{ LE.setCAS(window.__mnx.CAS); });
const cases = JSON.parse(fs.readFileSync(TDIR+'/cases.json','utf8'));
let pass=0, fail=0;
for (const c of cases){
  const r = await p.evaluate(([e,pt,s])=>{ try{ const r=LE.computeLimit(e,pt,s); return {status:r.status,display:r.display,method:r.method,left:r.left,right:r.right,head:r.headline,nsteps:r.steps.length}; }catch(err){return {status:'THROW',display:String(err.stack||err)}} },[c.e,c.pt,c.s||'both']);
  const ok = r.status===c.status && (c.display===undefined || String(r.display).replace(/−/g,'-')===String(c.display).replace(/−/g,'-'));
  if(ok) pass++; else {fail++; console.log('FAIL',JSON.stringify(c),'=>',JSON.stringify(r));}
}
console.log(`pass ${pass} / ${pass+fail}`); console.log('pageerrors',errs);
if (process.argv[2]){ const r = await p.evaluate(([e,pt,s])=>{const r=LE.computeLimit(e,pt,s);return r.headline+'\n'+r.steps.map(s=>'  '.repeat(s.depth)+'• '+s.title+(s.body?': '+s.body:'')).join('\n')},[process.argv[2],process.argv[3],process.argv[4]||'both']); console.log(r);}
await b.close();
