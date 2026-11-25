// Visual-layer regression sweep: all 14 modules x all 9 themes, desktop + mobile, console errors, overflow, contrast of key tokens.
// Run after build_site.mjs:  node tests/platform/redesign.mjs /tmp/mx-site
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { start } from './mock_server.mjs';
import fs from 'node:fs'; import path from 'node:path';
const SITE = path.resolve(process.argv[2] || '/tmp/mx-site'), SHOTS = process.env.SHOTS || '';
const M = await start({ siteDir: SITE, port: 4190 }); const O = M.origin;
const res = []; const ok = (n, c, d = '') => { res.push({ name: n, pass: !!c, detail: d }); if (!c) console.log('  FAIL ' + n + ' -> ' + d); };
const errs = [];
const b = await chromium.launch();
const mk = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); const p = await c.newPage(); p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); }); p.on('requestfailed', r => errs.push('reqfail ' + r.url())); p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); }); return { c, p }; };
const lum = hex => { const [r, g, bl] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * bl; };
const cr = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
const norm = v => { v = v.trim(); if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + [...v.slice(1)].map(c => c + c).join(''); return v; };

const THEMES = ['dark', 'light', 'midnight', 'oled', 'ocean', 'emerald', 'purple', 'graphite', 'minimal'];
const MODS = ['calc', 'matrix', 'vector', 'diff', 'int', 'complex', 'elec', 'mech', 'fluid', 'prog', 'materials', 'fibre', 'limits', 'analysis'];
console.log('# Themes (9) on home, desktop + mobile');
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { c, p } = await mk(w, h); await p.goto(O + '/'); await p.evaluate(() => document.getElementById('mxIntro')?.remove()); await p.waitForSelector('.mx-strip');
  const n = await p.evaluate(() => Object.keys(MXTheme.PRESETS).length); ok('9 theme presets exist', n === 9, String(n));
  for (const t of THEMES) {
    await p.evaluate(id => MXTheme.setPreset(id), t); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); const g = k => cs.getPropertyValue(k).trim(); return { bg: g('--bg'), surface: g('--surface'), text: g('--text'), muted: g('--muted'), accent: g('--accent'), onb: g('--on-brand'), sw: document.documentElement.scrollWidth, iw: innerWidth, preset: document.documentElement.getAttribute('data-preset') }; });
    ok(`${t}@${w}: no horizontal overflow`, r.sw <= r.iw + 1, JSON.stringify(r));
    const C = { text: cr(norm(r.text), norm(r.bg)), muted: cr(norm(r.muted), norm(r.surface)), btn: cr(norm(r.onb), norm(r.accent)) };
    ok(`${t}: text contrast >= 7`, C.text >= 7, C.text.toFixed(1)); ok(`${t}: muted contrast >= 4.5`, C.muted >= 4.5, C.muted.toFixed(1)); ok(`${t}: button text vs accent >= 4.5`, C.btn >= 4.5, C.btn.toFixed(1));
    ok(`${t}: stats strip + find toolbar visible`, await p.locator('.mx-strip').isVisible() && await p.locator('.mx-find').isVisible());
    if (SHOTS && w === 1440) await p.screenshot({ path: `${SHOTS}/theme-${t}.png` });
  }
  await p.evaluate(() => MXTheme.setPreset('dark')); await c.close();
}
console.log('# 14 modules open, desktop + mobile, in default theme and Light');
for (const [w, h] of [[1440, 900], [390, 844]]) for (const th of ['dark', 'light']) {
  const { c, p } = await mk(w, h); await p.goto(O + '/'); await p.evaluate(() => document.getElementById('mxIntro')?.remove()); await p.waitForSelector('.mx-strip');
  await p.evaluate(id => MXTheme.setPreset(id), th);
  ok(`home has exactly 14 module cards (${th}@${w})`, await p.locator('.modcards .modcard').count() === 14);
  for (const m of MODS) {
    await p.evaluate(() => { const b = document.querySelector('.brand-link'); if (document.body.dataset.page !== 'home') b.click(); });
    await p.locator(`.modcards .modcard[data-mod="${m}"]`).scrollIntoViewIfNeeded(); await p.locator(`.modcards .modcard[data-mod="${m}"]`).click(); await p.waitForTimeout(150);
    const r = await p.evaluate(m2 => { const el = document.getElementById('mod-' + m2) || document.getElementById('workspace'); const vis = !!(el && el.offsetParent !== null); return { page: document.body.dataset.page, vis, sw: document.documentElement.scrollWidth, iw: innerWidth, save: !!document.querySelector('#workspace .mx-save') }; }, m);
    ok(`module ${m} opens (${th}@${w})`, r.page === 'workspace' && r.vis, JSON.stringify(r));
    ok(`module ${m} no horizontal overflow (${th}@${w})`, r.sw <= r.iw + 1, JSON.stringify(r));
    if (SHOTS && th === 'dark' && (m === 'matrix' || m === 'prog') ) await p.screenshot({ path: `${SHOTS}/mod-${m}-${w}.png` });
  }
  await c.close();
}
console.log('# discovery');
{
  const { c, p } = await mk(1280, 900); await p.goto(O + '/'); await p.evaluate(() => document.getElementById('mxIntro')?.remove()); await p.waitForSelector('.mx-find');
  await p.fill('#mxFindIn', 'eigen'); ok('search "eigen" finds Matrix', (await p.locator('.modcard:not([hidden])').count()) >= 1 && await p.locator('.modcard[data-mod="matrix"]:not([hidden])').count() === 1);
  await p.fill('#mxFindIn', 'zzzzqq'); ok('empty search shows message', await p.locator('.mx-none.on').isVisible());
  await p.fill('#mxFindIn', ''); await p.locator('.mx-filters').getByRole('button', { name: /^Engineering/ }).click(); ok('Engineering filter = 3 modules', await p.locator('.modcard:not([hidden])').count() === 3);
  await p.locator('.mx-filters').getByRole('button', { name: /^Mathematics/ }).click(); ok('Mathematics filter = 7 modules', await p.locator('.modcard:not([hidden])').count() === 7);
  await p.locator('.mx-filters').getByRole('button', { name: /^All/ }).click(); ok('All = 14', await p.locator('.modcard:not([hidden])').count() === 14);
  await p.locator('.modcard[data-mod="fibre"]').click(); await p.locator('#mod-fibre .mx-save').click(); await p.locator('.brand-link').click();
  ok('saved module marked on its card', await p.locator('.modcard[data-mod="fibre"][data-mx-saved]').count() === 1);
  await p.locator('.mx-filters').getByRole('button', { name: /^Saved/ }).click(); ok('Saved filter shows only saved', await p.locator('.modcard:not([hidden])').count() === 1);
  await c.close();
  const m = await mk(390, 844); await m.p.goto(O + '/'); await m.p.evaluate(() => document.getElementById('mxIntro')?.remove());
  ok('mobile tab bar visible on home', await m.p.locator('.mx-tabbar').isVisible());
  await m.p.locator('.mx-tab-i[data-t="mods"]').click(); await m.p.waitForTimeout(400);
  ok('Modules tab scrolls to discovery toolbar', await m.p.evaluate(() => { const r = document.querySelector('.mx-find').getBoundingClientRect(); return r.top < 300 && r.top > -50; }));
  await m.p.locator('.mx-tab-i[data-t="theme"]').click(); await m.p.waitForTimeout(300);
  ok('Themes tab opens Theme Studio', await m.p.locator('#tsTitle').isVisible());
  await m.p.goto(O + '/'); await m.p.evaluate(() => document.getElementById('mxIntro')?.remove()); await m.p.locator('.modcard[data-mod="calc"]').click(); await m.p.waitForTimeout(200);
  ok('tab bar hidden inside workspace (app has own nav)', await m.p.locator('.mx-tabbar').isHidden());
  await m.c.close();
}
const real = errs.filter(e => !/pagead|googlesyndication|pyodide/.test(e));
ok('no console errors, failed requests or 4xx (incl. font files) in the whole sweep', real.length === 0, [...new Set(real)].slice(0, 6).join(' | '));
await b.close(); M.close();
const pass = res.filter(r => r.pass).length; console.log(`\n==== redesign sweep: ${pass} passed, ${res.length - pass} failed, ${res.length} total ====`);
fs.writeFileSync(path.join(process.env.REPORT_DIR || '/tmp', 'redesign-test-results.json'), JSON.stringify({ when: new Date().toISOString(), pass, fail: res.length - pass, results: res }, null, 1));
process.exit(res.length - pass ? 1 : 0);
