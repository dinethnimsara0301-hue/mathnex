import fs from 'fs';
import { OUT, SITE_URL, playwright } from './env.mjs';
const { chromium } = await playwright();
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(SITE_URL); await p.waitForTimeout(1000);
await p.addScriptTag({content: fs.readFileSync(OUT+'/le.js','utf8')});
await p.evaluate(()=>LE.setCAS(window.__mnx.CAS));
const exprs=[];
const pts=['0','1','2','-1','3','1/2','pi/2','pi'];
const bases=['(x^2-1)/(x-1)','(x^3-x)/(x^2-x)','sin(x)/x','sin(2x)/sin(3x)','(1-cos(x))/x^2','(exp(x)-1)/x','ln(x)/(x-1)','(sqrt(x+3)-2)/(x-1)','(x^2-4x+3)/(x^2-3x+2)','tan(x)/x','(exp(2x)-1)/(exp(x)-1)','x*sin(1/x)','(sin(x))^2/x^2','(x^2-pi^2)/sin(x)','(cos(x))/(x-pi/2)','(1+x)^(1/x)','x^x','(x-1)/ln(x)','sqrt(x)-sqrt(x-1)','1/x-1/(x+1)','(2^x-1)/x','atan(x)/x','sinh(x)/x','(exp(x)-exp(-x))/(2x)','abs(x-1)/(x-1)','(x^2-2x+1)/(x-1)^2','sqrt(x^2+1)-x','(3x^2+x)/(x^2+5)','(x^3+1)/(2x^3-x)','x/(x^2+1)','(2x+1)/(3x-2)','exp(-x)*x','x*exp(-x^2)','ln(x)/sqrt(x)','(1+1/x)^(2x)','(1-1/x)^x','sqrt(4x^2+x)-2x','x*(sqrt(x^2+1)-x)','(x+1)/(x-1)','x^2*sin(1/x)','cos(1/x)*x','(sin(x)-x)/x^3','(tan(x)-x)/x^3','(x-sin(x))/x^3','(1-cos(x))/x','ln(1+x^2)/x^2','(exp(x)-1-x-x^2/2)/x^3'];
const cases=[]; for(const e of bases){ for(const pt of pts) cases.push([e,pt]); for(const pt of ['inf','-inf']) cases.push([e,pt]); }
const res = await p.evaluate((cases)=>{
  const ev=(s,x)=>{try{return window.__mnx.CAS.evalN(window.__mnx.CAS.parse(LE.normalizeExpr(s)),{x})}catch(e){return NaN}};
  const out=[];
  for(const [e,pt] of cases){
    let r; try{ r=LE.computeLimit(e,pt,'both'); }catch(err){ out.push({e,pt,problem:'THROW '+err.message}); continue; }
    if(r.status!=='value' && r.status!=='infinite') continue;
    const a = pt==='inf'?Infinity: pt==='-inf'?-Infinity : window.__mnx.CAS.evalN(window.__mnx.CAS.parse(pt),{});
    let samples;
    if(!isFinite(a)){ const s=a>0?1:-1; samples=[s*1e4,s*1e6,s*1e8].map(x=>ev(e,x)); }
    else { const h=[1e-4,1e-5,1e-6]; samples=[]; for(const hh of h){ samples.push(ev(e,a+hh)); samples.push(ev(e,a-hh)); } }
    const fin=samples.filter(Number.isFinite);
    if(!fin.length) continue;
    if(r.status==='value'){
      const L=r.num;
      // compare to the sample closest to the point (last of each side), allow slow convergence
      const near = isFinite(a)? [samples[4],samples[5]].filter(Number.isFinite) : [samples[2]].filter(Number.isFinite);
      const bad = near.some(v=>Math.abs(v-L)>Math.max(2e-3,2e-3*Math.abs(L)));
      if(bad) out.push({e,pt,engine:r.display,numeric:near,method:r.method});
    } else {
      const sgn=r.display.startsWith('+')?1:-1;
      const near=[samples[4],samples[5]].filter(Number.isFinite);
      if(isFinite(a)? near.some(v=>v*sgn<1e3) : (samples[2]*sgn<10)) out.push({e,pt,engine:r.display,numeric:near.length?near:samples,method:r.method});
    }
  }
  return out;
},cases);
console.log('cases',cases.length,'disagreements',res.length);
for(const r of res) console.log(JSON.stringify(r));
await b.close();
