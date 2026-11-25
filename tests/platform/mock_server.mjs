// Test-only: static file server + in-memory mock of the Supabase Auth (GoTrue) and PostgREST endpoints MATHNEX uses.
// The mock scopes every table access to the caller's JWT subject, mimicking the RLS policies in
// supabase/migrations/001_mathnex_accounts.sql. It is NOT a substitute for testing against a real Supabase project.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = p => b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64(p) + '.mocksig';
export const ANON = jwt({ role: 'anon', iss: 'mock' }) + 'xxxxxxxx';
const PK = { saved_resources: ['user_id', 'module'], module_activity: ['user_id', 'module'], quiz_results: ['user_id', 'module', 'quiz_id'], topic_progress: ['user_id', 'module'], profiles: ['id'], entitlements: ['user_id'] };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain', '.xml': 'application/xml' };

export function start({ siteDir, port = 4180 }) {
  const db = { users: new Map(), refresh: new Map(), tables: {}, log: [], recoveries: [], resends: 0, config: {} };
  Object.keys(PK).forEach(t => db.tables[t] = []);
  const origin = `http://localhost:${port}`;
  const session = (u) => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const access = jwt({ sub: u.id, email: u.email, role: 'authenticated', exp, user_metadata: u.meta });
    const rt = crypto.randomUUID(); db.refresh.set(rt, u.id);
    return { access_token: access, refresh_token: rt, expires_in: 3600, expires_at: exp, token_type: 'bearer', user: { id: u.id, email: u.email, user_metadata: u.meta } };
  };
  const subOf = req => { try { const t = (req.headers.authorization || '').replace('Bearer ', ''); const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64url')); return p.role === 'authenticated' ? p.sub : null; } catch { return null; } };
  const send = (res, code, obj, extra = {}) => { res.writeHead(code, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'apikey,authorization,content-type,prefer,x-client-info', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', ...extra }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
  const body = req => new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(d ? JSON.parse(d) : {}); } catch { r({}); } }); });
  const matchF = (row, q) => { for (const [k, v] of q) { if (['select', 'on_conflict', 'order', 'limit'].includes(k)) continue; if (v.startsWith('eq.')) { if (String(row[k]) !== v.slice(3)) return false; } else if (v.startsWith('in.(')) { if (!v.slice(4, -1).split(',').map(decodeURIComponent).includes(String(row[k]))) return false; } } return true; };

  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, origin); const p = u.pathname;
    if (req.method === 'OPTIONS') return send(res, 204);
    if (p.startsWith('/auth/v1/')) {
      if (req.headers.apikey !== ANON) return send(res, 401, { message: 'No API key found in request' });
      const b = await body(req), ep = p.slice(9);
      db.log.push(`${req.method} ${ep}`);
      if (ep === 'signup') {
        if (!b.email || !b.password) return send(res, 422, { msg: 'Signup requires a valid password', error_code: 'validation_failed' });
        if (b.password.length < 6) return send(res, 422, { msg: 'Password should be at least 6 characters.', error_code: 'weak_password' });
        if (db.users.has(b.email)) return send(res, 200, { id: crypto.randomUUID(), email: b.email, identities: [] }); // obfuscated like real Supabase
        const user = { id: crypto.randomUUID(), email: b.email, password: b.password, confirmed: false, meta: b.data || {} };
        db.users.set(b.email, user);
        const sub = null; return send(res, 200, { id: user.id, email: user.email, identities: [{}], user_metadata: user.meta });
      }
      if (ep === 'token') {
        const g = u.searchParams.get('grant_type');
        if (g === 'password') {
          const user = db.users.get(b.email);
          if (!user || user.password !== b.password) return send(res, 400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
          if (!user.confirmed) return send(res, 400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
          return send(res, 200, session(user));
        }
        if (g === 'refresh_token') {
          const id = db.refresh.get(b.refresh_token); if (!id) return send(res, 400, { error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' });
          db.refresh.delete(b.refresh_token); const user = [...db.users.values()].find(x => x.id === id); return send(res, 200, session(user));
        }
      }
      if (ep === 'resend') { db.resends++; return send(res, 200, {}); }
      if (ep === 'recover') { db.recoveries.push(b.email); return send(res, 200, {}); }
      if (ep === 'user' && req.method === 'PUT') {
        const sub = subOf(req); if (!sub) return send(res, 401, { msg: 'invalid JWT' });
        const user = [...db.users.values()].find(x => x.id === sub);
        if (b.password) { if (b.password.length < 6) return send(res, 422, { msg: 'Password should be at least 6 characters.', error_code: 'weak_password' }); user.password = b.password; }
        return send(res, 200, { id: user.id, email: user.email });
      }
      if (ep === 'logout') { db.log.push('LOGOUT'); return send(res, 204); }
      return send(res, 404, { msg: 'not found' });
    }
    if (p.startsWith('/rest/v1/')) {
      const t = p.slice(9); const sub = subOf(req);
      if (!PK[t]) return send(res, 404, { message: 'relation does not exist' });
      if (!sub) return send(res, 401, { message: 'JWT expired or missing', code: 'PGRST301' });
      const own = r => (r.user_id || r.id) === sub, rows = db.tables[t], q = [...u.searchParams.entries()];
      if (req.method === 'GET') return send(res, 200, rows.filter(r => own(r) && matchF(r, q)));
      if (req.method === 'DELETE') { db.tables[t] = rows.filter(r => !(own(r) && matchF(r, q))); return send(res, 204); }
      if (req.method === 'POST') {
        const list = [].concat(await body(req));
        for (const r of list) if (r.user_id !== sub) return send(res, 403, { code: '42501', message: 'new row violates row-level security policy for table "' + t + '"' });
        const merge = /merge-duplicates/.test(req.headers.prefer || '');
        for (const r of list) {
          const i = rows.findIndex(x => PK[t].every(k => x[k] === r[k]));
          if (i >= 0) { if (!merge) return send(res, 409, { code: '23505', message: 'duplicate key' }); rows[i] = { ...rows[i], ...r }; } else rows.push({ ...r });
        }
        return send(res, 201);
      }
      if (req.method === 'PATCH') {
        const b = await body(req); const hit = rows.filter(r => own(r) && matchF(r, q)); hit.forEach(r => Object.assign(r, b));
        return send(res, 200, /representation/.test(req.headers.prefer || '') ? hit : undefined);
      }
    }
    if (p === '/__test/state') return send(res, 200, { tables: db.tables, users: [...db.users.values()].map(({ password, ...x }) => x), log: db.log, recoveries: db.recoveries, resends: db.resends });
    if (p === '/__test/config' && req.method === 'POST') { db.config = await body(req); return send(res, 200, {}); }
    if (p === '/__test/reset') { Object.keys(PK).forEach(t => db.tables[t] = []); db.users.clear(); db.refresh.clear(); db.log.length = 0; db.recoveries.length = 0; db.resends = 0; return send(res, 200, {}); }
    if (p === '/__test/confirm') { const u2 = db.users.get(u.searchParams.get('email')); u2.confirmed = true; for (const t of ['profiles', 'entitlements']) { if (!db.tables[t].some(r => (r.user_id || r.id) === u2.id)) db.tables[t].push(t === 'profiles' ? { id: u2.id, display_name: u2.meta.display_name || null, institution: null, study_focus: null } : { user_id: u2.id, plan: 'free', status: 'active', current_period_end: null }); } const s = session(u2); const type = u.searchParams.get('type') || 'signup'; return send(res, 200, { hash: `#access_token=${s.access_token}&expires_in=3600&refresh_token=${s.refresh_token}&token_type=bearer&type=${type}` }); }
    if (p === '/__test/entitle') { const u2 = db.users.get(u.searchParams.get('email')); const r = db.tables.entitlements.find(x => x.user_id === u2.id); r.plan = u.searchParams.get('plan'); return send(res, 200, {}); }
    /* static */
    if (p === '/config.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end('window.MX_CONFIG=' + JSON.stringify({ siteUrl: origin, ...db.config }) + ';'); }
    let f = path.join(siteDir, decodeURIComponent(p === '/' ? '/index.html' : p));
    if (!f.startsWith(siteDir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, () => r({ srv, db, origin, close: () => srv.close() })));
}
