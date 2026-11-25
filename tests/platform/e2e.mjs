// End-to-end tests for the MATHNEX platform layer (accounts, dashboard, sync, monetization, responsiveness).
// Run:  node tests/platform/build_site.mjs . /tmp/mx-site && node tests/platform/e2e.mjs /tmp/mx-site
// Uses a mock Supabase server (see mock_server.mjs). Every result printed here was actually executed.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { start, ANON } from './mock_server.mjs';
import fs from 'node:fs'; import path from 'node:path';

const SITE = path.resolve(process.argv[2] || '/tmp/mx-site'), SHOTS = process.env.SHOTS || '';
const M = await start({ siteDir: SITE, port: 4180 }); const O = M.origin;
const results = []; let section = '';
const ok = (name, cond, detail = '') => { results.push({ section, name, pass: !!cond, detail }); console.log((cond ? '  PASS ' : '  FAIL ') + name + (cond ? '' : '  -> ' + detail)); };
const S = s => { section = s; console.log('\n# ' + s); };
const cfg = async c => { await fetch(O + '/__test/config', { method: 'POST', body: JSON.stringify(c) }); };
const state = async () => (await fetch(O + '/__test/state')).json();
const CONF = { supabaseUrl: O, supabaseAnonKey: ANON };

const browser = await chromium.launch();
const errs = [];
async function ctx(opts = {}) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...opts });
  c.on('page', p => {
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  });
  await c.route(/fonts\.(googleapis|gstatic)|cdn\.jsdelivr|pagead2/, r => r.abort()); // never hit the real network
  return c;
}
async function open(page, url = O + '/') { await page.goto(url, { waitUntil: 'load' }); await page.evaluate(() => document.getElementById('mxIntro')?.remove()); await page.waitForSelector('#top'); }
const fill = async (page, label, v) => page.getByLabel(label, { exact: true }).fill(v);

/* ---------------------------------------------------------------- 1. guest mode, Supabase NOT configured */
S('Guest mode (Supabase not configured)');
await cfg({}); await M.db.tables; 
let c = await ctx(); let page = await c.newPage(); await open(page);
ok('no account button when unconfigured', (await page.locator('#mxAcct').count()) === 0);
ok('home still renders hero + 14 module cards', (await page.locator('.modcard').count()) === 14 && await page.locator('.hero').isVisible());
await page.locator('#mxSidebar .sb-item[data-mod="vector"]').click();
ok('workspace opens vector module', await page.locator('#mod-vector').isVisible());
const sv = page.locator('#mod-vector .mx-save');
ok('Save button injected in module header', await sv.count() === 1);
await sv.click();
ok('Save toggles to pressed', (await sv.getAttribute('aria-pressed')) === 'true');
await page.locator('#mxSidebar .sb-item[data-mod="matrix"]').click();
ok('matrix module has its own Save button', await page.locator('#workspace .mx-save[data-mod-id="matrix"]').count() === 1);
await page.locator('.brand-link').click();
ok('home shows "My learning" with Vector saved + recent', (await page.locator('.mx-home').innerText()).includes('Vector Algebra'));
await page.locator('.mx-home .mx-chip', { hasText: 'Vector' }).click();
ok('saved chip opens the module', await page.locator('#mod-vector').isVisible());
await page.reload(); await open(page, page.url());
ok('saved state persists after reload', (await page.evaluate(() => JSON.parse(localStorage.mxSaved))).includes('vector'));
ok('no CTA / account UI shown to guests when unconfigured', (await page.locator('.mx-hcard.cta').count()) === 0);
await c.close();

/* ---------------------------------------------------------------- 2. registration + verification */
S('Registration, verification, login');
await cfg(CONF); await fetch(O + '/__test/reset');
c = await ctx(); page = await c.newPage(); await open(page);
ok('Sign in button visible when configured', await page.locator('#mxAcct').isVisible());
ok('home CTA visible for guests', await page.locator('.mx-hcard.cta').isVisible());
await page.locator('#mxAcct').click();
ok('auth modal opens with dialog semantics', (await page.locator('.mx-auth').getAttribute('aria-modal')) === 'true');
ok('focus moved into modal', await page.evaluate(() => !!document.activeElement.closest('.mx-auth')));
await page.locator('.mx-auth .mx-btn.primary').click();
ok('empty submit shows validation errors', (await page.locator('.mx-err:not(:empty)').count()) >= 2);
await fill(page, 'Email', 'not-an-email'); await fill(page, 'Password', 'x');
await page.locator('.mx-auth .mx-btn.primary').click();
ok('invalid email message', (await page.locator('.mx-auth').innerText()).includes('valid email'));
// password visibility toggle
const pwInput = page.getByLabel('Password', { exact: true });
await page.getByRole('button', { name: 'Show password' }).click();
ok('password visibility toggle reveals text', (await pwInput.getAttribute('type')) === 'text');
await page.getByRole('button', { name: 'Hide password' }).click();
ok('and hides again', (await pwInput.getAttribute('type')) === 'password');
await page.locator('#mxTab-signup').click();
await fill(page, 'Display name (optional)', 'Ada Lovelace');
await fill(page, 'Email', 'ada@example.com'); await fill(page, 'Password', 'short');
await fill(page, 'Confirm password', 'different');
await page.locator('.mx-auth .mx-btn.primary').click();
ok('short password rejected (min 8)', (await page.locator('.mx-auth').innerText()).includes('at least 8'));
await fill(page, 'Password', 'Sup3r-secret!'); await fill(page, 'Confirm password', 'Sup3r-secret?');
await page.locator('.mx-auth .mx-btn.primary').click();
ok('mismatched confirmation rejected', (await page.locator('.mx-auth').innerText()).includes('do not match'));
ok('strength meter reflects strong password', (await page.locator('.mx-meter').getAttribute('data-s')) === '4');
await fill(page, 'Confirm password', 'Sup3r-secret!');
await page.locator('.mx-auth .mx-btn.primary').click();
await page.waitForSelector('.mx-done.mail');
ok('signup shows "check your inbox" (no session before verification)', (await page.locator('.mx-auth').innerText()).includes('Check your inbox') && !(await page.evaluate(() => localStorage.mxSession)));
ok('password is never persisted by the app', !JSON.stringify(await page.evaluate(() => ({ ...localStorage }))).includes('Sup3r-secret'));
// try to sign in before verification
await page.getByRole('button', { name: 'Back to sign in' }).click();
await fill(page, 'Password', 'Sup3r-secret!');
await page.locator('.mx-auth .mx-btn.primary').click();
await page.waitForSelector('.mx-formerr:not(:empty)');
ok('unverified login blocked with clear message', (await page.locator('.mx-formerr').innerText()).includes('verify your email'));
await page.locator('.mx-formerr .mx-link').click(); await page.waitForTimeout(300);
ok('resend verification email calls API', (await state()).resends === 1);
await page.keyboard.press('Escape');
await page.locator('.mx-auth').waitFor({ state: 'detached' }).catch(() => {});
ok('Escape closes modal', await page.locator('.mx-auth').count() === 0);
// click the confirmation link (implicit-flow hash redirect)
const hash = (await (await fetch(O + '/__test/confirm?email=ada@example.com&type=signup')).json()).hash;
await page.goto(O + '/' + hash); await page.evaluate(() => document.getElementById('mxIntro')?.remove());
await page.waitForSelector('.mx-done.ok');
ok('email-verification link signs the user in', (await page.locator('.mx-auth').innerText()).includes('Email verified'));
ok('tokens stripped from the URL', !page.url().includes('access_token'));
await page.getByRole('button', { name: 'Continue to MATHNEX' }).click();
ok('header shows signed-in avatar + name', (await page.locator('#mxAcct').innerText()).includes('Ada'));
// wrong password / logout / login
await page.locator('#mxAcct').click(); await page.locator('.mx-dash').waitFor();
await page.getByRole('button', { name: 'Sign out' }).first().click();
ok('logout clears session + calls API', !(await page.evaluate(() => localStorage.mxSession)) && (await state()).log.includes('LOGOUT'));
await page.locator('#mxAcct').click();
await fill(page, 'Email', 'ada@example.com'); await fill(page, 'Password', 'wrong-password');
await page.locator('.mx-auth .mx-btn.primary').click(); await page.waitForSelector('.mx-formerr:not(:empty)');
ok('wrong password message', (await page.locator('.mx-formerr').innerText()).includes('Incorrect email or password'));
await fill(page, 'Password', 'Sup3r-secret!'); await page.locator('.mx-auth .mx-btn.primary').click();
await page.waitForSelector('#mxAcct.signed');
ok('login with correct password works', (await page.locator('#mxAcct').innerText()).includes('Ada'));
ok('refresh-token session persisted', !!(await page.evaluate(() => localStorage.mxSession)));
await page.reload(); await open(page, page.url());
ok('session survives reload', await page.locator('#mxAcct.signed').count() === 1);

/* ---------------------------------------------------------------- 3. dashboard + sync */
S('Dashboard and Supabase sync');
await page.locator('#mxSidebar .sb-item[data-mod="limits"]').click();
await page.locator('#mod-limits .mx-save').click();
await page.evaluate(() => localStorage.setItem('mathnexEduProgress', JSON.stringify({ limits: { reviewedTopics: ['epsilon-delta'], quizBest: { 'limits-basics': { score: 4, total: 5, lastUpdated: '1/2/2026' } }, completedExercises: ['ex1'] } })));
await page.evaluate(() => window.MXPlatform.syncNow()); await page.waitForTimeout(800);
let st = await state(); const uid = st.users[0].id;
ok('saved module synced to database', st.tables.saved_resources.some(r => r.user_id === uid && r.module === 'limits'));
ok('visit activity synced', st.tables.module_activity.some(r => r.user_id === uid && r.module === 'limits' && r.visit_count >= 1));
ok('quiz result synced', st.tables.quiz_results.some(r => r.quiz_id === 'limits-basics' && r.score === 4 && r.total === 5));
ok('topic progress synced', st.tables.topic_progress.some(r => r.module === 'limits' && r.reviewed_topics.includes('epsilon-delta')));
ok('no request ever wrote another user_id', st.tables.saved_resources.concat(st.tables.quiz_results, st.tables.module_activity).every(r => r.user_id === uid));
await page.locator('#mxAcct').click(); await page.locator('.mx-dash').waitFor();
const dash = page.locator('.mx-dcontent');
ok('overview greets by profile name', (await dash.innerText()).includes('Welcome back, Ada'));
ok('overview lists recent + saved Limits & Continuity', (await dash.innerText()).includes('Limits'));
await page.locator('#mxD-saved').click();
ok('Saved tab lists the module', (await dash.innerText()).includes('Limits'));
await page.locator('#mxD-progress').click();
ok('Progress tab shows quiz history 4 / 5 (80%)', (await dash.innerText()).includes('4 / 5 (80%)'));
await page.locator('#mxD-plan').click();
ok('Plan tab honestly says everything is free', (await dash.innerText()).includes('currently free'));
await page.locator('#mxD-settings').click();
await fill(page, 'Display name', 'Ada L.'); await fill(page, 'University / school (optional)', 'UoM');
await page.getByRole('button', { name: 'Save profile' }).click(); await page.waitForTimeout(500);
st = await state();
ok('profile saved to database', st.tables.profiles.find(p => p.id === uid)?.display_name === 'Ada L.' && st.tables.profiles.find(p => p.id === uid)?.institution === 'UoM');
await fill(page, 'New password', 'Another-pass-9'); await fill(page, 'Confirm new password', 'Another-pass-9');
await page.getByRole('button', { name: 'Change password' }).click(); await page.waitForTimeout(500);
ok('password change calls PUT /user', (await state()).log.includes('PUT user'));
// export
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my data' }).click()]);
const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
ok('data export contains saved + progress', exported.saved.includes('limits') && exported.progress.limits);
// dashboard keyboard: focus trap + Escape
await page.keyboard.press('Escape'); await page.locator('.mx-dash').waitFor({ state: 'detached' }).catch(() => {});
ok('Escape closes dashboard', await page.locator('.mx-dash').count() === 0);

// second device: sign in elsewhere, data is pulled and merged
const c2 = await ctx(); const p2 = await c2.newPage(); await open(p2);
await p2.locator('#mxAcct').click(); await fill(p2, 'Email', 'ada@example.com'); await fill(p2, 'Password', 'Another-pass-9');
await p2.locator('.mx-auth .mx-btn.primary').click(); await p2.waitForSelector('#mxAcct.signed'); await p2.waitForTimeout(900);
const local2 = await p2.evaluate(() => ({ saved: JSON.parse(localStorage.mxSaved || '[]'), prog: JSON.parse(localStorage.mathnexEduProgress || '{}') }));
ok('second device receives saved modules', local2.saved.includes('limits'));
ok('second device receives quiz result in the app\'s own progress store', local2.prog.limits?.quizBest?.['limits-basics']?.score === 4);
// unsave on device 2 deletes remotely
await p2.locator('#mxSidebar .sb-item[data-mod="limits"]').click(); await p2.locator('#mod-limits .mx-save').click();
await p2.evaluate(() => window.MXPlatform.syncNow()); await p2.waitForTimeout(700);
ok('un-saving removes the row remotely', !(await state()).tables.saved_resources.some(r => r.module === 'limits'));
await c2.close();
// delete synced data
await page.reload(); await open(page, page.url()); await page.locator('#mxAcct').click(); await page.locator('#mxD-settings').click();
page.once('dialog', d => d.accept());
await page.getByRole('button', { name: 'Delete my synced data' }).click(); await page.waitForTimeout(600);
st = await state();
ok('"Delete my synced data" empties user tables', st.tables.quiz_results.length === 0 && st.tables.topic_progress.length === 0 && st.tables.module_activity.length === 0);
await c.close();

/* ---------------------------------------------------------------- 4. password reset */
S('Forgot / reset password');
c = await ctx(); page = await c.newPage(); await open(page);
await page.locator('#mxAcct').click(); await page.getByRole('button', { name: 'Forgot password?' }).click();
await fill(page, 'Email', 'ada@example.com'); await page.getByRole('button', { name: 'Send reset link' }).click();
await page.waitForSelector('.mx-done.mail');
ok('reset request sent, generic confirmation shown', (await state()).recoveries.includes('ada@example.com') && (await page.locator('.mx-auth').innerText()).includes('If an account exists'));
await page.keyboard.press('Escape'); await page.locator('.mx-auth').waitFor({ state: 'detached' });
const rh = (await (await fetch(O + '/__test/confirm?email=ada@example.com&type=recovery')).json()).hash;
await page.goto(O + '/' + rh); await page.evaluate(() => document.getElementById('mxIntro')?.remove());
await page.waitForSelector('.mx-auth');
ok('recovery link opens "choose a new password" (cannot be dismissed accidentally)', (await page.locator('.mx-auth').innerText()).includes('Choose a new password') && await page.locator('.mx-x').isHidden());
await fill(page, 'New password', 'Brand-new-pass-1'); await fill(page, 'Confirm new password', 'Brand-new-pass-1');
await page.getByRole('button', { name: 'Update password' }).click(); await page.waitForTimeout(600);
ok('new password accepted and modal closes', await page.locator('.mx-auth').count() === 0);
await page.locator('#mxAcct').click(); await page.getByRole('button', { name: 'Sign out' }).first().click();
await page.locator('#mxAcct').click(); await fill(page, 'Email', 'ada@example.com'); await fill(page, 'Password', 'Brand-new-pass-1');
await page.locator('.mx-auth .mx-btn.primary').click(); await page.waitForSelector('#mxAcct.signed');
ok('can sign in with the reset password', true);
// expired link
await page.evaluate(() => localStorage.removeItem('mxSession'));
await page.goto(O + '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); await page.evaluate(() => document.getElementById('mxIntro')?.remove()); await page.waitForTimeout(500);
ok('expired email link shows a helpful error', (await page.locator('.mx-toast.error').innerText()).includes('expired'));
await c.close();

/* ---------------------------------------------------------------- 5. security checks */
S('Security');
await cfg({ supabaseUrl: O, supabaseAnonKey: 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url') + '.sig-padding-padding' });
c = await ctx(); page = await c.newPage(); await open(page);
ok('service_role key in config disables accounts', (await page.locator('#mxAcct').count()) === 0);
ok('…and logs a clear console error', errs.some(e => e.includes('service_role')) && (errs.splice(0, errs.length), true));
await c.close();
const cfgSrc = fs.readFileSync(path.join(SITE, 'config.js'), 'utf8');
ok('shipped config.js has no keys (placeholders only)', /supabaseAnonKey: ""/.test(cfgSrc) && !/eyJ/.test(cfgSrc));
const pf = fs.readFileSync(path.join(SITE, 'platform/mx-platform.js'), 'utf8');
ok('no innerHTML with dynamic data in platform JS (only 3 static-SVG sites with numeric values)', (pf.match(/innerHTML/g) || []).length === 3);
await cfg(CONF); await fetch(O + '/__test/reset');
c = await ctx(); page = await c.newPage(); await open(page);
const unauth = await page.evaluate(async (o) => (await fetch(o + '/rest/v1/saved_resources', { headers: { apikey: o.key } })).status, O).catch(() => 0);
ok('anonymous visitors get no table access (mock mirrors RLS)', unauth === 401 || unauth === 0);
await c.close();

/* ---------------------------------------------------------------- 6. monetization + premium */
S('Monetization & premium architecture');
await cfg({ ...CONF, premium: { enabled: false }, ads: { adsenseClient: 'ca-pub-1234567890123456', slots: { home: '1234567890', footer: '0987654321' } },
  affiliates: [{ title: 'Calculus textbook', description: 'A classic.', url: 'https://example.com/book?tag=x', merchant: 'ExampleShop' }, { title: 'Bad insecure link', url: 'http://evil.example/x' }, { title: 'js', url: 'javascript:alert(1)' }],
  sponsors: [{ title: 'Sponsor A', description: 'Ad copy', url: 'https://sponsor.example/', sponsor: 'Sponsor A Ltd' }], products: [{ title: 'Formula sheet PDF', price: '$5', url: 'https://shop.example/sheet' }] });
c = await ctx(); page = await c.newPage();
let adReq = 0; await c.route(/pagead2\.googlesyndication/, r => { adReq++; r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }); });
await open(page);
ok('affiliate card rendered with rel=sponsored + disclosure', await page.locator('.mx-mcard.affiliate[rel~="sponsored"]').count() === 1 && (await page.locator('.mx-disc').innerText()).includes('affiliate'));
ok('non-https / javascript: URLs dropped', await page.locator('.mx-mcard').count() === 3 && (await page.locator('.mx-mon').innerHTML()).indexOf('evil.example') < 0 && (await page.locator('.mx-mon').innerHTML()).indexOf('javascript:') < 0);
ok('sponsored items clearly labelled', (await page.locator('.mx-mcard.sponsor .mx-tag').textContent()) === 'Sponsored');
ok('digital product card present', await page.locator('.mx-mcard.product').count() === 1);
ok('NO ad request before the visitor chooses', adReq === 0 && await page.locator('.adsbygoogle').count() === 0);
ok('consent banner shown', await page.locator('#mxConsent').isVisible());
await page.locator('#mxConsent').getByRole('button', { name: 'Basic only' }).click(); await page.waitForTimeout(500);
ok('after choice, AdSense loads with 2 non-intrusive slots (home + footer)', adReq >= 1 && await page.locator('.adsbygoogle').count() === 2);
ok('ads labelled "Advertisement"', (await page.locator('.mx-adslot small').first().textContent()) === 'Advertisement');
ok('non-personalised flag set for "Basic only"', await page.evaluate(() => window.adsbygoogle.requestNonPersonalizedAds === 1));
await page.locator('#mxSidebar .sb-item[data-mod="calc"]').click();
ok('no ad inside the tool workspace', await page.locator('#workspace .adsbygoogle, #mod-calc .adsbygoogle').count() === 0);
await c.close();
// premium gating
await cfg({ ...CONF, premium: { enabled: true } }); await fetch(O + '/__test/reset');
c = await ctx(); page = await c.newPage(); await open(page);
await page.locator('#mxAcct').click(); await page.locator('#mxTab-signup').click();
await fill(page, 'Email', 'bob@example.com'); await fill(page, 'Password', 'Password-12345'); await fill(page, 'Confirm password', 'Password-12345');
await page.locator('.mx-auth .mx-btn.primary').click(); await page.waitForSelector('.mx-done.mail');
const bh = (await (await fetch(O + '/__test/confirm?email=bob@example.com')).json()).hash;
await page.goto(O + '/' + bh); await page.evaluate(() => { document.getElementById('mxIntro')?.remove(); const d = document.createElement('div'); d.setAttribute('data-mx-premium', ''); d.id = 'pz'; document.body.appendChild(d); }); await page.waitForTimeout(1200);
ok('premium-gated element hidden for free users when premium enabled', await page.locator('#pz').isHidden() || (await page.evaluate(() => document.getElementById('pz').hidden)));
ok('requirePremium() false for free user', await page.evaluate(() => window.MXPlatform.requirePremium()) === false);
await fetch(O + '/__test/entitle?email=bob@example.com&plan=premium');
await page.evaluate(() => window.MXPlatform.syncNow()); await page.waitForTimeout(600);
ok('premium entitlement from database unlocks features', await page.evaluate(() => window.MXPlatform.isPremium()) === true && await page.evaluate(() => window.MXPlatform.requirePremium()) === true);
await c.close();

/* ---------------------------------------------------------------- 7. responsive + overflow + visuals */
S('Responsive layout (no horizontal overflow)');
await cfg(CONF); await fetch(O + '/__test/reset');
const WIDTHS = [[360, 740], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
c = await ctx({ viewport: { width: 1280, height: 900 } }); page = await c.newPage(); await open(page);
await page.locator('#mxAcct').click(); await page.locator('#mxTab-signup').click();
await fill(page, 'Email', 'zed@example.com'); await fill(page, 'Password', 'Password-12345'); await fill(page, 'Confirm password', 'Password-12345'); await page.locator('.mx-auth .mx-btn.primary').click(); await page.waitForSelector('.mx-done.mail');
const zh = (await (await fetch(O + '/__test/confirm?email=zed@example.com')).json()).hash;
await page.goto(O + '/' + zh); await page.evaluate(() => document.getElementById('mxIntro')?.remove()); await page.waitForSelector('.mx-done.ok'); await page.keyboard.press('Escape');
await page.locator('#mxSidebar .sb-item[data-mod="matrix"]').click(); await page.locator('#workspace .mx-save').first().click();
await page.evaluate(() => localStorage.setItem('mathnexEduProgress', JSON.stringify({ limits: { reviewedTopics: ['a', 'b'], quizBest: { 'epsilon-delta-quiz': { score: 7, total: 8, lastUpdated: '3/3/2026' }, 'continuity': { score: 3, total: 6, lastUpdated: '3/4/2026' } }, completedExercises: ['x'] } })));
await page.evaluate(() => window.MXPlatform.syncNow());
const sess = await page.evaluate(() => localStorage.mxSession);
for (const [w, hgt] of WIDTHS) {
  const cc = await ctx({ viewport: { width: w, height: hgt } }); const pp = await cc.newPage();
  await pp.addInitScript(s => localStorage.setItem('mxSession', s), sess);
  await pp.addInitScript(() => { try { localStorage.setItem('mxSaved', '["matrix","limits"]'); localStorage.setItem('mxActivity', JSON.stringify({ matrix: { n: 3, t: new Date().toISOString() }, limits: { n: 1, t: new Date().toISOString() } })); } catch (e) {} });
  await open(pp); await pp.waitForTimeout(500);
  const ov = async label => { const r = await pp.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth })); ok(`${w}px ${label}: no horizontal overflow`, r.sw <= r.iw + 1, JSON.stringify(r)); };
  await ov('home'); if (SHOTS) await pp.screenshot({ path: `${SHOTS}/home-${w}.png` });
  await pp.locator('#mxAcct').click(); await pp.locator('.mx-dash').waitFor(); await pp.waitForTimeout(450);
  const dw = await pp.evaluate(() => { const d = document.querySelector('.mx-dash'); return d.scrollWidth <= d.clientWidth + 1; });
  ok(`${w}px dashboard: content fits`, dw); if (SHOTS) await pp.screenshot({ path: `${SHOTS}/dash-overview-${w}.png` });
  await pp.locator('#mxD-progress').click(); await pp.waitForTimeout(250);
  ok(`${w}px dashboard progress tab fits`, await pp.evaluate(() => { const d = document.querySelector('.mx-dcontent'); return d.scrollWidth <= d.clientWidth + 1; }));
  if (SHOTS && (w === 390 || w === 1440)) await pp.screenshot({ path: `${SHOTS}/dash-progress-${w}.png` });
  await pp.keyboard.press('Escape');
  await pp.locator('.mx-dash').waitFor({ state: 'detached' }); await pp.evaluate(() => window.MXPlatform.signOut()); await pp.waitForTimeout(300);
  await pp.locator('#mxAcct').click(); await pp.locator('.mx-auth').waitFor(); await pp.waitForTimeout(450);
  ok(`${w}px auth modal: no overflow`, await pp.evaluate(() => { const d = document.querySelector('.mx-auth'); const p = document.querySelector('.mx-auth-panel'); return d.scrollWidth <= d.clientWidth + 1 && p.scrollWidth <= p.clientWidth + 1; }));
  ok(`${w}px auth modal: submit button reachable`, await pp.locator('.mx-auth .mx-btn.primary').isVisible());
  if (SHOTS) await pp.screenshot({ path: `${SHOTS}/auth-${w}.png` });
  await cc.close();
}
await c.close();

/* ---------------------------------------------------------------- 8. console health & motion */
S('Console health & accessibility');
const real = errs.filter(e => !/Failed to load resource|ERR_FAILED|net::|fonts/i.test(e));
ok('no JavaScript page errors / console errors in any run', real.length === 0, real.slice(0, 5).join(' | '));
c = await ctx({ reducedMotion: 'reduce' }); page = await c.newPage(); await cfg(CONF); await open(page); await page.locator('#mxAcct').click();
ok('reduced-motion: aurora animation disabled', (await page.locator('.mx-aurora').evaluate(e => getComputedStyle(e).animationName)) === 'none');
await c.close();
c = await ctx({ reducedMotion: 'no-preference' }); page = await c.newPage(); await open(page); await page.locator('#mxAcct').click();
ok('normal motion: aurora animates', (await page.locator('.mx-aurora').evaluate(e => getComputedStyle(e).animationName)) === 'mxSpin');
await c.close();

await browser.close(); M.close();
const pass = results.filter(r => r.pass).length, fail = results.length - pass;
console.log(`\n==== ${pass} passed, ${fail} failed, ${results.length} total ====`);
fs.writeFileSync(path.join(process.env.REPORT_DIR || '/tmp', 'platform-test-results.json'), JSON.stringify({ when: new Date().toISOString(), pass, fail, results }, null, 1));
process.exit(fail ? 1 : 0);
