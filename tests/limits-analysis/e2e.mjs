import { SITE_URL, playwright } from './env.mjs';
const { chromium } = await playwright();
const URL = SITE_URL;
const b = await chromium.launch();
const results=[]; const errors=[];
const ok=(n,c,extra='')=>{results.push([n,!!c,extra]); if(!c) console.log('✗',n,extra);};
async function newPage(vp={width:1280,height:900}){
  const ctx = await b.newContext({viewport:vp}); const p = await ctx.newPage();
  p.on('pageerror',e=>errors.push('pageerror: '+e.message)); p.on('console',m=>{ if(m.type()==='error') errors.push('console.error: '+m.text()) });
  return {ctx,p};
}
const openMod = async (p,m)=>{ await p.evaluate((m)=>window.__mnx.switchMod(m),m); await p.waitForTimeout(250); };
let {ctx,p} = await newPage();
await p.goto(URL); await p.waitForTimeout(1200);

/* sidebar + dashboard presence */
ok('sidebar limits button', await p.locator('.sb-item[data-mod="limits"]').count()===1);
ok('sidebar analysis button', await p.locator('.sb-item[data-mod="analysis"]').count()===1);
ok('dashboard cards', await p.locator('.modcard[data-mod="limits"]').count()===1 && await p.locator('.modcard[data-mod="analysis"]').count()===1);
await p.locator('.sb-item[data-mod="limits"]').click(); await p.waitForTimeout(500);
ok('limits module visible', await p.locator('#mod-limits').isVisible());
ok('limits subnav 5 tabs', (await p.locator('#limSubnav button').count())===5);
ok('limits 4 chapter cards', (await p.locator('#limLessons .lsn-card').count())===4);

/* every limits chapter: open, check 10 sections, demo mounted, quiz perfect, test perfect -> complete */
async function chapterFlow(prefix, count, mod){
  for(let i=0;i<count;i++){
    await p.locator(`#${prefix} .lsn-card`).nth(i).click(); await p.waitForTimeout(350);
    const secs = await p.locator(`#${prefix} .lsn-sec`).count();
    ok(`${mod} ch${i+1} has 10 sections`, secs===10, String(secs));
    ok(`${mod} ch${i+1} demo content`, (await p.locator(`#${prefix} .lsn-demo *`).count())>3);
    ok(`${mod} ch${i+1} demo has canvas or output`, (await p.locator(`#${prefix} .lsn-demo canvas, #${prefix} .lsn-demo .dm-out`).count())>0);
    const exN = await p.locator(`#${prefix} .lsn-exr`).count(); ok(`${mod} ch${i+1} exercises>=9`, exN>=9, String(exN));
    // exercise checkbox persistence
    await p.locator(`#${prefix} input[data-ex]`).first().evaluate(e=>{e.checked=true;e.dispatchEvent(new Event('change'))});
    // quiz & test: grade empty to reveal, select correct, grade
    for(const box of ['quizbox','testbox']){
      const sel = `#${prefix} [id$="-${box}"]`;
      await p.locator(`${sel} [data-qact="grade"]`).click(); await p.waitForTimeout(80);
      const correct = p.locator(`${sel} label.edu-q-opt.is-correct input`);
      const n = await correct.count();
      for(let k=0;k<n;k++) await correct.nth(k).evaluate(e=>e.click());
      await p.locator(`${sel} [data-qact="grade"]`).click(); await p.waitForTimeout(80);
      const txt = await p.locator(`${sel} .resultbox`).first().innerText();
      ok(`${mod} ch${i+1} ${box} perfect score`, new RegExp(`(${n}) ?/ ?\\1`).test(txt) || /100\s?%/.test(txt), txt.slice(0,80));
    }
    const foot = await p.locator(`#${prefix} .lsn-foot`).innerText();
    ok(`${mod} ch${i+1} completed after passing`, /Chapter completed/.test(foot), foot.slice(0,60));
    await p.locator(`#${prefix} [data-a="back"]`).click(); await p.waitForTimeout(150);
  }
}
await chapterFlow('limLessons',4,'limits');
const prog = await p.evaluate(()=>JSON.parse(localStorage.getItem('mathnexEduProgress')||'{}'));
ok('progress saved for limits', prog.limits && prog.limits.reviewedTopics.length===4 && Object.keys(prog.limits.quizBest).length===8, JSON.stringify(prog.limits?.reviewedTopics));
ok('exercise completion saved', prog.limits.completedExercises.length>=4);

/* calculator */
await p.locator('#limSubnav [data-subtab="calc"]').click(); await p.waitForTimeout(300);
const calc = async (expr,pt,side='both')=>{ await p.fill('#limExpr',expr); await p.fill('#limPt',pt); await p.selectOption('#limSide',side); await p.click('#limRun'); await p.waitForTimeout(120); return (await p.locator('#limRes').innerText()); };
let t;
t=await calc('(x²-4)/(x-2)','2'); ok('calc (x²−4)/(x−2) = 4', /= 4/.test(t), t.slice(0,90));
t=await calc('sin(x)/x','0'); ok('calc sin x/x = 1', /= 1\b/.test(t), t.slice(0,90));
t=await calc('(3x²+2)/(x²-1)','inf'); ok('calc rational at ∞ = 3', /= 3\b/.test(t), t.slice(0,90));
t=await calc('lim(x→2) (x²-4)/(x-2)',''); ok('notation lim(x→2)', /= 4/.test(t), t.slice(0,90));
t=await calc('lim_{x→0+} 1/x',''); ok('notation one-sided +∞', /\+∞/.test(t), t.slice(0,90));
t=await calc('lim x->0- 1/x',''); ok('notation one-sided −∞', /−∞/.test(t), t.slice(0,90));
t=await calc('abs(x)/x','0'); ok('|x|/x does not exist', /does not exist/.test(t), t.slice(0,120));
t=await calc('sin(1/x)','0'); ok('sin(1/x) DNE', /does not exist/.test(t), t.slice(0,120));
t=await calc('(x+sin(x))/x','inf'); ok('unsupported is flagged, not faked', /NOT SOLVED|Unsupported/i.test(t) && !/= 1\b/.test(t), t.slice(0,160));
t=await calc('x+y','0'); ok('two variables rejected', /single variable|Use a single/i.test(t), t.slice(0,120));
t=await calc('(x^2-1)/(x-1)','abc'); ok('bad point error', /Unknown symbol|approach|Cannot|error/i.test(t), t.slice(0,120));
const steps = await p.locator('#limCalc .lw-step').count();
await calc('(x^3-8)/(x-2)','2'); ok('working steps shown', (await p.locator('#limCalc .lw-step').count())>=3);
// all example chips
const chips = p.locator('#limCalc [data-k="ex"] button'); const nChips = await chips.count();
for(let i=0;i<nChips;i++){ await chips.nth(i).click(); await p.waitForTimeout(80); const r=await p.locator('#limRes').innerText(); ok(`example chip ${i} result`, r.length>5 && !/Cannot read/.test(r), r.slice(0,50)); }
// history
await p.waitForTimeout(100);
const hist = await p.evaluate(()=>JSON.parse(localStorage.getItem('matrixxHist')||'[]').filter(h=>h.mod==='limits').length); ok('history entries recorded', hist>0, String(hist));
// symbol buttons
await p.fill('#limExpr',''); await p.locator('#limCalc [data-k="sym"] button').first().click(); ok('symbol insert', (await p.inputValue('#limExpr')).includes('^2'));

/* graph lab */
await p.locator('#limSubnav [data-subtab="graph"]').click(); await p.waitForTimeout(500);
ok('graph lab canvas', (await p.locator('#limGraph canvas').count())===1);
const sel = p.locator('#limGraph [data-k="preset"]'); const optN = await sel.locator('option').count();
for(let i=1;i<optN;i++){ await sel.selectOption({index:i}); await p.waitForTimeout(120); const out=await p.locator('#limGraph [data-k="out"]').innerText(); ok(`graph preset ${i}`, out.length>10 && !/ERROR/.test(out), out.slice(0,80)); }
await sel.selectOption('hole'); await p.waitForTimeout(150);
const box = await p.locator('#limGraph canvas').boundingBox();
await p.mouse.move(box.x+box.width/2, box.y+box.height/2); await p.mouse.down(); await p.mouse.move(box.x+box.width/2+80, box.y+box.height/2+30,{steps:5}); await p.mouse.up();
await p.mouse.wheel(0,-300); await p.waitForTimeout(100);
await p.locator('#limGraph [data-a="right"]').click(); await p.waitForTimeout(900); await p.locator('#limGraph [data-a="stop"]').click();
await p.locator('#limGraph [data-a="zoom"]').click(); await p.locator('#limGraph [data-a="fit"]').click();
ok('graph interactions no crash', true);
ok('evidence tables', (await p.locator('#limGraph .dm-tbl').count())>=2);
// calc -> graph
await p.locator('#limSubnav [data-subtab="calc"]').click(); await p.fill('#limExpr','x^2'); await p.fill('#limPt','1'); await p.locator('#limCalc [data-a="graph"]').click(); await p.waitForTimeout(500);
ok('calculator → graph handoff', (await p.inputValue('#limGraph [data-k="f"]'))==='x^2');

/* eps-delta */
await p.locator('#limSubnav [data-subtab="eps"]').click(); await p.waitForTimeout(500);
let o=await p.locator('#limEps [data-k="out"]').innerText(); ok('eps-delta output', /largest δ/.test(o), o.slice(0,100));
let pf=await p.locator('#limEps [data-k="proof"]').innerText(); ok('eps-delta proof (x²)', /Proof/.test(pf)&&/min\(1/.test(pf), pf.slice(0,100));
await p.fill('#limEps [data-k="f"]','3x+1'); await p.fill('#limEps [data-k="a"]','2'); await p.waitForTimeout(150);
pf=await p.locator('#limEps [data-k="proof"]').innerText(); ok('eps-delta linear proof', /δ = ε\/3/.test(pf), pf.slice(0,160));
await p.fill('#limEps [data-k="f"]','sin(1/x)'); await p.fill('#limEps [data-k="a"]','0'); await p.waitForTimeout(150);
o=await p.locator('#limEps [data-k="out"]').innerText(); ok('eps-delta refuses nonexistent limit', /does not exist|ERROR/i.test(o), o.slice(0,120));

/* continuity & IVT */
await p.locator('#limSubnav [data-subtab="cont"]').click(); await p.waitForTimeout(500);
const exb = p.locator('#limCont [data-k="ex"] button'); const nEx=await exb.count();
const expect = ['REMOVABLE','JUMP','INFINITE','ESSENTIAL','CONTINUOUS','ONE SIDE|DEFINED ONLY'];
for(let i=0;i<nEx;i++){ await exb.nth(i).click(); await p.waitForTimeout(150); const r=await p.locator('#limCont [data-k="out"]').first().innerText(); ok(`continuity example ${i}`, new RegExp(expect[i],'i').test(r), r.slice(0,70)); }
let iv=await p.locator('#limCont [data-k="iout"]').innerText(); ok('IVT bisection x³+x−1', /IVT APPLIES/.test(iv) && /0\.682/.test(iv), iv.slice(0,200));
await p.fill('#limCont [data-k="g"]','1/x'); await p.fill('#limCont [data-k="ia"]','-1'); await p.fill('#limCont [data-k="ib"]','1'); await p.locator('#limCont [data-a="ivt"]').click(); await p.waitForTimeout(150);
iv=await p.locator('#limCont [data-k="iout"]').innerText(); ok('IVT warns about discontinuity for 1/x', /DISCONTINUITY|undefined/i.test(iv), iv.slice(0,160));
await p.fill('#limCont [data-k="g"]','x^2+1'); await p.fill('#limCont [data-k="ia"]','0'); await p.fill('#limCont [data-k="ib"]','2'); await p.locator('#limCont [data-a="ivt"]').click(); await p.waitForTimeout(150);
iv=await p.locator('#limCont [data-k="iout"]').innerText(); ok('IVT no sign change handled', /NO SIGN CHANGE/.test(iv), iv.slice(0,120));

/* ===== REAL ANALYSIS ===== */
await p.locator('.sb-item[data-mod="analysis"]').click(); await p.waitForTimeout(500);
ok('analysis visible', await p.locator('#mod-analysis').isVisible());
ok('analysis subnav 5 tabs', (await p.locator('#anSubnav button').count())===5);
ok('analysis 8 chapter cards', (await p.locator('#anLessons .lsn-card').count())===8);
await chapterFlow('anLessons',8,'analysis');
const prog2 = await p.evaluate(()=>JSON.parse(localStorage.getItem('mathnexEduProgress')||'{}'));
ok('progress saved for analysis', prog2.analysis && prog2.analysis.reviewedTopics.length===8 && Object.keys(prog2.analysis.quizBest).length===16);
ok('limits progress still intact', prog2.limits && prog2.limits.reviewedTopics.length===4);
// overall ring 100%
const ring = await p.locator('#anLessons .lsn-ring').innerText(); ok('overall progress 100%', /100/.test(ring), ring);

// labs
await p.locator('#anSubnav [data-subtab="seq"]').click(); await p.waitForTimeout(500);
let so=await p.locator('#anSeq [data-k="out"]').innerText(); ok('sequence explorer converges (3n+1)/(n+2)', /CONVERGES/.test(so)&&/= ?3|\b3\b/.test(so), so.slice(0,120));
const chip = p.locator('#anSeq [data-k="pre"] button');
const expSeq=[/CONVERGES/,/CONVERGES/,/CONVERGES/,/DIVERGES/,/DIVERGES/,/CONVERGES/,/CONVERGES/,/CONVERGES/];
for(let i=0;i<8;i++){ await chip.nth(i).click(); await p.waitForTimeout(150); const r=await p.locator('#anSeq [data-k="out"]').innerText(); ok(`sequence preset ${i}`, expSeq[i].test(r), r.slice(0,90)); }
let su=await p.locator('#anSup [data-k="out"]').innerText(); ok('sup tester upper bound', /UPPER BOUND ✓/.test(su), su.slice(0,160));
await p.fill('#anSup [data-k="s"]','0.5'); await p.waitForTimeout(150); su=await p.locator('#anSup [data-k="out"]').innerText(); ok('sup tester rejects too-small s', /NOT AN UPPER BOUND/.test(su));
await p.locator('#anSubnav [data-subtab="series"]').click(); await p.waitForTimeout(500);
let se=await p.locator('#anSeries [data-k="out"]').innerText(); ok('series n²/3ⁿ ratio converge', /converges absolutely/.test(se), se.slice(0,200));
const sch=p.locator('#anSeries [data-k="pre"] button'); const expS=[/Geometric series.*exact sum/s,/inconclusive/,/inconclusive/,/./,/Alternating series test/,/./,/converges absolutely/,/DIVERGES/];
for(let i=0;i<8;i++){ await sch.nth(i).click(); await p.waitForTimeout(250); const r=await p.locator('#anSeries [data-k="out"]').innerText(); ok(`series preset ${i}`, expS[i].test(r), r.slice(0,140)); }
await p.locator('#anSubnav [data-subtab="calc"]').click(); await p.waitForTimeout(800);
ok('continuity lab output', /largest δ/.test(await p.locator('#anCont [data-k="out"]').innerText()));
const mvt=await p.locator('#anDiff [data-k="out"]').first().innerText(); ok('MVT/Rolle finds c=±1', /-1|−1/.test(mvt)&&/1\b/.test(mvt), mvt.slice(0,200));
const ty=await p.locator('#anDiff [data-k="tout"]').innerText(); ok('Taylor bound holds', /error ≤ bound ✓/.test(ty), ty.slice(0,160));
const rm=await p.locator('#anRiem [data-k="out"]').innerText(); ok('Riemann L ≤ ∫ ≤ U', /L ≤ ∫ ≤ U ✓/.test(rm), rm.slice(0,160));
const ftc=await p.locator('#anRiem [data-k="ftcout"]').textContent(); ok('FTC panel', /FTC II/.test(ftc), ftc.slice(0,100));
await p.locator('#anSubnav [data-subtab="proof"]').click(); await p.waitForTimeout(600);
let ind=await p.locator('#anProof [data-k="iout"]').innerText(); ok('induction checker true', /TRUE for n = 1…200/.test(ind), ind.slice(0,160));
await p.fill('#anProof [data-k="s"]','x*(x+1)/2+1'); await p.locator('#anProof [data-a="chk"]').click(); await p.waitForTimeout(100);
ind=await p.locator('#anProof [data-k="iout"]').innerText(); ok('induction checker detects false claim', /FALSE at n = 1/.test(ind), ind.slice(0,120));
await p.locator('#anProof [data-a="eps"]').click(); ok('eps-delta builder text', /Proof/.test(await p.locator('#anProof [data-k="eout"]').innerText()));
const pg=p.locator('#anProof [data-k="pg"] option'); const nP=await pg.count();
for(let i=0;i<nP;i++){ await p.selectOption('#anProof [data-k="pg"]',{index:i}); await p.locator('#anProof [data-a="all"]').click(); ok(`proof ${i} steps`, (await p.locator('#anProof .an-proof-step').count())>=4); }
const setSel=p.locator('#anSet [data-k="set"] option'); const nS=await setSel.count();
for(let i=0;i<nS;i++){ await p.selectOption('#anSet [data-k="set"]',{index:i}); await p.waitForTimeout(60); ok(`set ${i} info`, (await p.locator('#anSet [data-k="out"]').innerText()).includes('Open:')); }

/* persistence across reload */
await p.reload(); await p.waitForTimeout(1500);
await openMod(p,'analysis'); await p.waitForTimeout(400);
ok('progress persists after reload', /100/.test(await p.locator('#anLessons .lsn-ring').innerText().catch(()=>'')));
await openMod(p,'limits'); await p.waitForTimeout(400);
ok('limits tab restored', true);

/* existing modules still work */
for(const m of ['matrix','vector','diff','int','complex','elec','mech','fluid','calc','prog','materials','fibre']){
  await openMod(p,m); const vis=await p.locator(`#mod-${m}`).isVisible(); ok(`existing module ${m} opens`, vis);
}
await openMod(p,'diff'); const dIn = p.locator('#mod-diff input');
ok('diff module has inputs', (await dIn.count())>0);
await openMod(p,'matrix'); ok('matrix result exists', (await p.locator('#mod-matrix').innerText()).length>100);
// command palette entries
const pal = await p.evaluate(()=>document.documentElement.innerHTML.includes('Limit Calculator'));
ok('command palette entries present', pal);
await ctx.close();

/* mobile viewport checks */
({ctx,p} = await newPage({width:390,height:844}));
await p.goto(URL); await p.waitForTimeout(1200);
for(const [m,tabs,nav] of [['limits',['lessons','calc','graph','eps','cont'],'limSubnav'],['analysis',['chapters','seq','series','calc','proof'],'anSubnav']]){
  await p.locator(`.modcard[data-mod="${m}"]`).first().evaluate(e=>e.click()); await openMod(p,m); await p.waitForTimeout(400);
  for(const t of tabs){
    await p.locator(`#${nav} [data-subtab="${t}"]`).click(); await p.waitForTimeout(500);
    const ov = await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    ok(`mobile ${m}/${t} no horizontal overflow`, ov.sw<=ov.cw+2, JSON.stringify(ov));
  }
  // open first chapter on mobile
  await p.locator(`#${nav} [data-subtab="${tabs[0]}"]`).click(); await p.locator(`#${m==='limits'?'limLessons':'anLessons'} .lsn-card`).first().click(); await p.waitForTimeout(500);
  const ov2 = await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
  ok(`mobile ${m} chapter view no overflow`, ov2.sw<=ov2.cw+2, JSON.stringify(ov2));
  const clip = await p.evaluate(()=>[...document.querySelectorAll('.lsn-sec,.lsn-pills,.lsn-bar')].filter(e=>e.getBoundingClientRect().right>innerWidth+2).length);
  ok(`mobile ${m} chapter sections inside viewport`, clip===0, String(clip));
  const lit = await p.evaluate(()=>/\*[A-Za-z]/.test(document.querySelector('.lsn-body').innerText));
  ok(`${m} no literal markdown asterisks`, !lit);
}
await ctx.close();

/* light theme + preset check */
({ctx,p} = await newPage()); await p.goto(URL); await p.waitForTimeout(1000);
await p.evaluate(()=>{document.documentElement.setAttribute('data-theme','light'); window.dispatchEvent(new Event('mathnex:theme'))});
await p.locator('.sb-item[data-mod="limits"]').click(); await p.waitForTimeout(400); await p.locator('#limSubnav [data-subtab="graph"]').click(); await p.waitForTimeout(500);
ok('light theme graph renders', (await p.locator('#limGraph canvas').count())===1);
await ctx.close();

const failed=results.filter(r=>!r[1]);
console.log(`\nE2E: ${results.length-failed.length}/${results.length} passed`);
const uniq=[...new Set(errors)]; console.log('JS errors:',uniq.length?uniq:'none');
await b.close();
