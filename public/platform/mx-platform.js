/* MATHNEX platform layer — optional accounts, personal dashboard, saved modules, sync, and
   monetization/premium integration points.
   - Additive: it never touches the calculation modules. It reads the existing DOM/events
     (sidebar [data-mod], body[data-page], "mathnex:mod") and the existing localStorage progress store.
   - Guests: "Save" and "Recently opened" work locally with no account.
   - Accounts: talk to Supabase Auth (GoTrue) and PostgREST over HTTPS using only the public anon key.
     All private data is protected by Row Level Security (see supabase/migrations/001_*.sql).
   - If Supabase is not configured (public/config.js), all account UI stays hidden. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ config & helpers */
  var CFG = window.MX_CONFIG || {};
  CFG.premium = CFG.premium || { enabled: false };
  CFG.ads = CFG.ads || { adsenseClient: '', slots: {} };
  var SB_URL = String(CFG.supabaseUrl || '').replace(/\/+$/, '');
  var SB_KEY = String(CFG.supabaseAnonKey || '');
  var LOCAL_OK = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(SB_URL);
  var CONFIGURED = (/^https:\/\/[^\s/]+$/.test(SB_URL) || LOCAL_OK) && SB_KEY.length > 20;
  (function guardKey() {
    try {
      var p = SB_KEY.split('.')[1];
      if (p && JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role') {
        console.error('MATHNEX: a service_role key was found in public/config.js. Account features are disabled. Use the anon key.');
        CONFIGURED = false;
      }
    } catch (e) { /* opaque (non-JWT) keys are fine */ }
  })();

  var doc = document;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var ls = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  function jget(k, d) { try { var v = JSON.parse(ls.get(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { ls.set(k, JSON.stringify(v)); }

  function h(tag, props) {
    var n = doc.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(n, arguments[i]);
    return n;
  }
  function add(n, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(n, x); }); return; }
    n.appendChild(typeof c === 'string' || typeof c === 'number' ? doc.createTextNode(String(c)) : c);
  }
  function svg(inner, cls) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic ' + (cls || '')); s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    s.innerHTML = inner; // static, trusted path data only
    return s;
  }
  function icon(id) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    var u = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#' + id); s.appendChild(u); return s;
  }
  var ICON_STAR = '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/>';
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function nowIso() { return new Date().toISOString(); }
  function fmtDate(iso) {
    var d = new Date(iso); if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function ago(iso) {
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (!isFinite(s)) return '';
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    if (s < 86400 * 14) return Math.floor(s / 86400) + ' d ago';
    return fmtDate(iso);
  }
  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254; }
  function prettyId(s) { return String(s).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }); }
  function safeHttps(u) { try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; } }

  /* ------------------------------------------------------------------ module catalogue (from live sidebar) */
  var MODS = [];
  function readMods() {
    MODS = $$('#mxSidebar .sb-item[data-mod]').map(function (b) {
      var use = $('use', b);
      return {
        id: b.getAttribute('data-mod'),
        title: (b.getAttribute('data-tip') || b.textContent || b.getAttribute('data-mod')).replace(/\s+/g, ' ').trim(),
        icon: use ? (use.getAttribute('href') || '').replace('#', '') : 'i-sigma'
      };
    });
  }
  function modInfo(id) {
    for (var i = 0; i < MODS.length; i++) if (MODS[i].id === id) return MODS[i];
    return null;
  }
  function openModule(id) {
    var b = $('#mxSidebar .sb-item[data-mod="' + id + '"]');
    if (b) b.click();
  }

  /* ------------------------------------------------------------------ events */
  var listeners = [];
  function emit() { listeners.slice().forEach(function (f) { try { f(); } catch (e) { console.error(e); } }); }
  function onChange(f) { listeners.push(f); }

  /* ------------------------------------------------------------------ toast */
  var toastHost;
  function toast(msg, kind) {
    if (!toastHost) { toastHost = h('div', { id: 'mxToasts', 'aria-live': 'polite', 'aria-atomic': 'false' }); doc.body.appendChild(toastHost); }
    var t = h('div', { class: 'mx-toast ' + (kind || 'info'), role: kind === 'error' ? 'alert' : 'status' }, h('span', { text: msg }));
    toastHost.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 260); }, kind === 'error' ? 6500 : 4200);
  }

  /* ------------------------------------------------------------------ Supabase auth + REST (no 3rd-party library) */
  function ApiError(message, status, code) { this.message = message; this.status = status || 0; this.code = code || ''; }
  function friendly(e) {
    var m = (e && e.message) || 'Something went wrong.';
    if (e && e.code === 'network') return 'Cannot reach the server. Check your connection and try again.';
    if (e && (e.code === 'invalid_credentials' || /invalid login credentials/i.test(m))) return 'Incorrect email or password.';
    if (e && (e.code === 'email_not_confirmed' || /email not confirmed/i.test(m))) return 'Please verify your email first — check your inbox for the confirmation link.';
    if (e && (e.status === 429 || /rate limit|too many/i.test(m))) return 'Too many attempts. Please wait a minute and try again.';
    if (/password.*(weak|short|least|characters)/i.test(m)) return m;
    if (/already.*registered/i.test(m)) return 'Check your inbox — if this email can be registered, a confirmation link is on its way.';
    return m;
  }
  function req(url, opts) {
    opts = opts || {};
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : null;
    var headers = { apikey: SB_KEY, Authorization: 'Bearer ' + (opts.token || SB_KEY) };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.prefer) headers.Prefer = opts.prefer;
    return fetch(SB_URL + url, { method: opts.method || 'GET', headers: headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: ctl ? ctl.signal : undefined })
      .catch(function () { throw new ApiError('Network error', 0, 'network'); })
      .then(function (r) {
        if (timer) clearTimeout(timer);
        return r.text().then(function (txt) {
          var data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
          if (!r.ok) {
            var msg = data && (data.msg || data.error_description || data.message || data.error) || ('Request failed (' + r.status + ')');
            throw new ApiError(msg, r.status, data && (data.error_code || data.code) || '');
          }
          return data;
        });
      });
  }

  var Auth = {
    session: null, refreshTimer: null, inflight: null,
    redirect: function () { return location.origin + '/'; },
    load: function () {
      var s = jget('mxSession', null);
      this.session = s && s.access_token && s.refresh_token && s.user ? s : null;
      if (this.session) this.schedule();
    },
    set: function (d) {
      var exp = d.expires_at || (Math.floor(Date.now() / 1000) + (d.expires_in || 3600));
      this.session = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: exp, user: d.user || (this.session && this.session.user) };
      jset('mxSession', this.session); this.schedule();
    },
    clear: function () { this.session = null; ls.del('mxSession'); clearTimeout(this.refreshTimer); },
    schedule: function () {
      var self = this; clearTimeout(this.refreshTimer);
      if (!this.session) return;
      var ms = Math.max(5000, (this.session.expires_at - 60) * 1000 - Date.now());
      this.refreshTimer = setTimeout(function () { self.refresh().catch(function () { /* retried on next focus */ }); }, Math.min(ms, 2147000000));
    },
    refresh: function () {
      var self = this;
      if (!this.session) return Promise.reject(new ApiError('No session', 401));
      if (this.inflight) return this.inflight;
      var rt = this.session.refresh_token;
      this.inflight = req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: rt } })
        .then(function (d) { self.set(d); self.inflight = null; return d; })
        .catch(function (e) {
          self.inflight = null;
          if (e.code !== 'network' && e.status >= 400 && e.status < 500) { self.clear(); emit(); }
          throw e;
        });
      return this.inflight;
    },
    token: function () {
      var self = this;
      if (!this.session) return Promise.reject(new ApiError('Not signed in', 401));
      if (this.session.expires_at - 30 < Date.now() / 1000) return this.refresh().then(function () { return self.session.access_token; });
      return Promise.resolve(this.session.access_token);
    },
    user: function () { return this.session ? this.session.user : null; },
    signUp: function (email, password, name) {
      var self = this;
      return req('/auth/v1/signup?redirect_to=' + encodeURIComponent(this.redirect()), { method: 'POST', body: { email: email, password: password, data: name ? { display_name: name } : {} } })
        .then(function (d) { if (d && d.access_token) { self.set(d); return { signedIn: true }; } return { signedIn: false }; });
    },
    signIn: function (email, password) {
      var self = this;
      return req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: password } }).then(function (d) { self.set(d); return d; });
    },
    resend: function (email) { return req('/auth/v1/resend?redirect_to=' + encodeURIComponent(this.redirect()), { method: 'POST', body: { type: 'signup', email: email } }); },
    recover: function (email) { return req('/auth/v1/recover?redirect_to=' + encodeURIComponent(this.redirect()), { method: 'POST', body: { email: email } }); },
    updatePassword: function (pw) { return this.token().then(function (t) { return req('/auth/v1/user', { method: 'PUT', token: t, body: { password: pw } }); }); },
    signOut: function () {
      var t = this.session && this.session.access_token; this.clear();
      if (t) req('/auth/v1/logout', { method: 'POST', token: t }).catch(function () { /* local sign-out already done */ });
    },
    fromUrlHash: function (raw) {
      /* implicit-flow redirect from email links: #access_token=...&refresh_token=...&type=signup|recovery */
      var p = new URLSearchParams(raw.replace(/^#/, ''));
      if (p.get('error') || p.get('error_description')) return { error: (p.get('error_description') || p.get('error') || '').replace(/\+/g, ' ') };
      if (!p.get('access_token') || !p.get('refresh_token')) return null;
      var at = p.get('access_token'), user = null;
      try { var pl = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); user = { id: pl.sub, email: pl.email, user_metadata: pl.user_metadata || {} }; } catch (e) { return { error: 'Invalid link.' }; }
      return { type: p.get('type') || 'signin', data: { access_token: at, refresh_token: p.get('refresh_token'), expires_in: parseInt(p.get('expires_in') || '3600', 10), user: user } };
    }
  };

  function rest(path, opts) {
    opts = opts || {};
    function go(token) { return req('/rest/v1/' + path, { method: opts.method, body: opts.body, prefer: opts.prefer, token: token }); }
    return Auth.token().then(go).catch(function (e) {
      if (e && e.status === 401 && Auth.session) return Auth.refresh().then(function () { return go(Auth.session.access_token); });
      throw e;
    });
  }

  /* ------------------------------------------------------------------ local learning state */
  var State = {
    saved: function () { var a = jget('mxSaved', []); return Array.isArray(a) ? a.filter(function (x) { return typeof x === 'string'; }) : []; },
    setSaved: function (a) { jset('mxSaved', a); },
    pendingUnsave: function () { var a = jget('mxUnsaved', []); return Array.isArray(a) ? a : []; },
    activity: function () { var o = jget('mxActivity', {}); return o && typeof o === 'object' ? o : {}; },
    setActivity: function (o) { jset('mxActivity', o); },
    progress: function () { var o = jget('mathnexEduProgress', {}); return o && typeof o === 'object' ? o : {}; },
    isSaved: function (id) { return State.saved().indexOf(id) >= 0; },
    toggleSaved: function (id) {
      var s = State.saved(), i = s.indexOf(id), pend = State.pendingUnsave();
      if (i >= 0) { s.splice(i, 1); if (pend.indexOf(id) < 0) pend.push(id); }
      else { s.push(id); pend = pend.filter(function (x) { return x !== id; }); }
      State.setSaved(s); jset('mxUnsaved', pend);
      emit(); Sync.schedule();
      return i < 0;
    },
    recent: function () {
      var a = State.activity();
      return Object.keys(a).filter(modInfo).sort(function (x, y) { return (a[y].t || '').localeCompare(a[x].t || ''); });
    },
    recordVisit: function (id) {
      if (!modInfo(id)) return;
      var a = State.activity(), e = a[id] || { n: 0, t: '' };
      e.n += 1; e.t = nowIso(); a[id] = e; State.setActivity(a);
      emit(); Sync.schedule();
    },
    stats: function () {
      var prog = State.progress(), quizzes = [], topics = 0, ex = 0;
      Object.keys(prog).forEach(function (m) {
        var p = prog[m] || {};
        topics += Array.isArray(p.reviewedTopics) ? p.reviewedTopics.length : 0;
        ex += Array.isArray(p.completedExercises) ? p.completedExercises.length : 0;
        Object.keys(p.quizBest || {}).forEach(function (q) {
          var r = p.quizBest[q]; if (r && r.total > 0) quizzes.push({ mod: m, id: q, score: r.score, total: r.total, when: r.lastUpdated });
        });
      });
      var avg = quizzes.length ? Math.round(100 * quizzes.reduce(function (s, q) { return s + q.score / q.total; }, 0) / quizzes.length) : null;
      return { explored: Object.keys(State.activity()).filter(modInfo).length, saved: State.saved().filter(modInfo).length, quizzes: quizzes, topics: topics, exercises: ex, avg: avg };
    }
  };

  /* visit tracking: count a visit when the workspace shows a module */
  function activeMod() {
    var raw = ls.get('mathnexMod'); if (!raw) return 'matrix';
    try { var v = JSON.parse(raw); return typeof v === 'string' ? v : 'matrix'; } catch (e) { return raw; }
  }
  var lastVisit = { id: '', t: 0 };
  function trackVisit() {
    if (doc.body.getAttribute('data-page') !== 'workspace') return;
    var id = activeMod();
    var now = Date.now();
    if (lastVisit.id === id && now - lastVisit.t < 4000) return;
    lastVisit = { id: id, t: now };
    State.recordVisit(id);
  }

  /* ------------------------------------------------------------------ remote sync (merge, never clobber) */
  var Sync = {
    status: 'idle', last: null, timer: null, running: false, again: false, profile: null, entitlement: null, snap: '',
    schedule: function () {
      if (!Auth.session) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(function () { Sync.run(); }, 2000);
    },
    run: function () {
      if (!Auth.session) return Promise.resolve();
      if (this.running) { this.again = true; return Promise.resolve(); }
      this.running = true; this.status = 'syncing'; emit();
      var uid = Auth.user().id;
      return this._cycle(uid).then(function () { Sync.status = 'ok'; Sync.last = nowIso(); })
        .catch(function (e) { Sync.status = e && e.code === 'network' ? 'offline' : 'error'; if (e && e.code !== 'network') console.warn('MATHNEX sync:', e.message); })
        .then(function () {
          Sync.running = false; Sync.snap = JSON.stringify(State.progress()); emit();
          if (Sync.again) { Sync.again = false; Sync.schedule(); }
        });
    },
    _cycle: function (uid) {
      var q = 'user_id=eq.' + encodeURIComponent(uid);
      return Promise.all([
        rest('saved_resources?select=module&' + q),
        rest('module_activity?select=module,visit_count,last_opened_at&' + q),
        rest('quiz_results?select=module,quiz_id,score,total,updated_at&' + q),
        rest('topic_progress?select=module,reviewed_topics,completed_exercises&' + q),
        rest('profiles?select=display_name,institution,study_focus&id=eq.' + encodeURIComponent(uid)),
        rest('entitlements?select=plan,status,current_period_end&' + q)
      ]).then(function (r) {
        Sync.profile = (r[4] && r[4][0]) || {}; Sync.entitlement = (r[5] && r[5][0]) || null;
        var ops = [], pend = State.pendingUnsave();

        /* saved: union, minus locally removed-but-not-yet-deleted */
        var remoteSaved = r[0].map(function (x) { return x.module; });
        var localSaved = State.saved();
        var merged = localSaved.slice();
        remoteSaved.forEach(function (m) { if (merged.indexOf(m) < 0 && pend.indexOf(m) < 0 && modInfo(m)) merged.push(m); });
        State.setSaved(merged);
        var toAdd = merged.filter(function (m) { return remoteSaved.indexOf(m) < 0; }).map(function (m) { return { user_id: uid, module: m }; });
        if (toAdd.length) ops.push(rest('saved_resources?on_conflict=user_id,module', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: toAdd }));
        var toDel = pend.filter(function (m) { return remoteSaved.indexOf(m) >= 0; });
        if (toDel.length) ops.push(rest('saved_resources?' + q + '&module=in.(' + toDel.map(encodeURIComponent).join(',') + ')', { method: 'DELETE' }));

        /* activity: keep the larger count and newest timestamp */
        var act = State.activity(), rAct = {}, actUp = [];
        r[1].forEach(function (x) { rAct[x.module] = x; });
        Object.keys(rAct).forEach(function (m) {
          if (!modInfo(m)) return;
          var l = act[m] || { n: 0, t: '' };
          act[m] = { n: Math.max(l.n || 0, rAct[m].visit_count || 0), t: (l.t || '') > rAct[m].last_opened_at ? l.t : rAct[m].last_opened_at };
        });
        Object.keys(act).forEach(function (m) {
          var rr = rAct[m];
          if (!modInfo(m)) return;
          if (!rr || rr.visit_count !== act[m].n || (act[m].t && new Date(rr.last_opened_at).getTime() !== new Date(act[m].t).getTime()))
            actUp.push({ user_id: uid, module: m, visit_count: act[m].n, last_opened_at: act[m].t || nowIso() });
        });
        State.setActivity(act);
        if (actUp.length) ops.push(rest('module_activity?on_conflict=user_id,module', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: actUp }));

        /* quizzes + topics: merge into the app's own progress store */
        var prog = State.progress(), changed = false, qUp = [], tUp = [];
        var rQ = {}; r[2].forEach(function (x) { rQ[x.module + '\u0000' + x.quiz_id] = x; });
        r[2].forEach(function (x) {
          var p = prog[x.module] || (prog[x.module] = { reviewedTopics: [], quizBest: {}, completedExercises: [] });
          p.quizBest = p.quizBest || {};
          var l = p.quizBest[x.quiz_id];
          if (!l || (x.score / x.total) > (l.score / l.total)) { p.quizBest[x.quiz_id] = { score: x.score, total: x.total, lastUpdated: new Date(x.updated_at).toLocaleDateString() }; changed = true; }
        });
        Object.keys(prog).forEach(function (m) {
          var p = prog[m] || {};
          Object.keys(p.quizBest || {}).forEach(function (qid) {
            var l = p.quizBest[qid], rr = rQ[m + '\u0000' + qid];
            if (!l || !(l.total > 0) || l.score < 0 || l.score > l.total || !/^[a-z0-9_-]{1,40}$/.test(m)) return;
            if (!rr || (l.score / l.total) > (rr.score / rr.total)) qUp.push({ user_id: uid, module: m, quiz_id: String(qid).slice(0, 120), score: l.score, total: l.total, updated_at: nowIso() });
          });
        });
        var rT = {}; r[3].forEach(function (x) { rT[x.module] = x; });
        function uni(a, b) { var o = (a || []).slice(); (b || []).forEach(function (v) { if (o.indexOf(v) < 0) o.push(v); }); return o; }
        Object.keys(rT).forEach(function (m) {
          var p = prog[m] || (prog[m] = { reviewedTopics: [], quizBest: {}, completedExercises: [] });
          var a = uni(p.reviewedTopics, rT[m].reviewed_topics), b = uni(p.completedExercises, rT[m].completed_exercises);
          if (a.length !== (p.reviewedTopics || []).length) { p.reviewedTopics = a; changed = true; }
          if (b.length !== (p.completedExercises || []).length) { p.completedExercises = b; changed = true; }
        });
        Object.keys(prog).forEach(function (m) {
          var p = prog[m] || {}; if (!/^[a-z0-9_-]{1,40}$/.test(m)) return;
          var rt = rT[m], rev = (p.reviewedTopics || []).filter(function (x) { return typeof x === 'string'; }).slice(0, 500), com = (p.completedExercises || []).filter(function (x) { return typeof x === 'string'; }).slice(0, 500);
          if (!rev.length && !com.length) return;
          if (!rt || rt.reviewed_topics.length !== rev.length || rt.completed_exercises.length !== com.length)
            tUp.push({ user_id: uid, module: m, reviewed_topics: rev, completed_exercises: com, updated_at: nowIso() });
        });
        if (changed) { try { localStorage.setItem('mathnexEduProgress', JSON.stringify(prog)); } catch (e) { /* storage full */ } }
        if (qUp.length) ops.push(rest('quiz_results?on_conflict=user_id,module,quiz_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: qUp }));
        if (tUp.length) ops.push(rest('topic_progress?on_conflict=user_id,module', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: tUp }));
        return Promise.all(ops).then(function () { if (toDel.length || pend.length) jset('mxUnsaved', []); });
      });
    },
    saveProfile: function (vals) {
      var uid = Auth.user().id;
      return rest('profiles?id=eq.' + encodeURIComponent(uid), { method: 'PATCH', prefer: 'return=representation', body: vals })
        .then(function (rows) { Sync.profile = (rows && rows[0]) || vals; emit(); });
    },
    deleteRemote: function () {
      var uid = encodeURIComponent(Auth.user().id), q = 'user_id=eq.' + uid;
      return Promise.all(['saved_resources', 'module_activity', 'quiz_results', 'topic_progress'].map(function (t) { return rest(t + '?' + q, { method: 'DELETE' }); }));
    }
  };

  /* ------------------------------------------------------------------ premium (configurable, no fake payments) */
  var Premium = {
    enabled: function () { return !!(CFG.premium && CFG.premium.enabled); },
    active: function () {
      var e = Sync.entitlement;
      if (!e || e.plan !== 'premium') return false;
      if (e.status !== 'active' && e.status !== 'trialing') return false;
      return !e.current_period_end || new Date(e.current_period_end).getTime() > Date.now();
    },
    apply: function () {
      $$('[data-mx-premium]').forEach(function (n) { n.hidden = Premium.enabled() && !Premium.active(); });
      $$('[data-mx-premium-upsell]').forEach(function (n) { n.hidden = !(Premium.enabled() && !Premium.active()); });
    }
  };

  /* ------------------------------------------------------------------ layer (modal) infrastructure */
  var layer = null;
  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openLayer(root, opts) {
    closeLayer(true);
    opts = opts || {};
    var back = h('div', { class: 'mx-layer' + (opts.full ? ' full' : ''), role: 'presentation' });
    back.appendChild(root);
    back.addEventListener('mousedown', function (e) { if (e.target === back && !opts.locked) closeLayer(); });
    var prev = doc.activeElement;
    var key = function (e) {
      if (e.key === 'Escape' && !opts.locked) { e.preventDefault(); closeLayer(); return; }
      if (e.key !== 'Tab') return;
      var f = $$(FOCUSABLE, root).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    doc.addEventListener('keydown', key, true);
    doc.documentElement.classList.add('mx-lock');
    doc.body.appendChild(back);
    layer = { back: back, root: root, key: key, prev: prev, onClose: opts.onClose };
    requestAnimationFrame(function () {
      back.classList.add('in');
      var f = opts.focus ? $(opts.focus, root) : $(FOCUSABLE, root);
      if (f) f.focus();
    });
  }
  function closeLayer(immediate) {
    if (!layer) return;
    var L = layer; layer = null;
    doc.removeEventListener('keydown', L.key, true);
    doc.documentElement.classList.remove('mx-lock');
    L.back.classList.remove('in');
    var done = function () { L.back.remove(); };
    if (immediate) done(); else setTimeout(done, 200);
    if (L.onClose) L.onClose();
    if (L.prev && L.prev.focus && doc.contains(L.prev)) { try { L.prev.focus(); } catch (e) { /* ignore */ } }
  }

  /* ------------------------------------------------------------------ form primitives */
  var uid = 0;
  function field(o) {
    var id = 'mxf' + (++uid), hid = id + 'h', eid = id + 'e';
    var input = h('input', { id: id, name: o.name || o.type, type: o.type || 'text', autocomplete: o.autocomplete || 'off', placeholder: o.placeholder || ' ', required: o.required, maxlength: o.maxlength, 'aria-describedby': eid + (o.hint ? ' ' + hid : ''), inputmode: o.inputmode, spellcheck: o.type === 'email' || o.type === 'password' ? 'false' : null, autocapitalize: o.type === 'email' ? 'none' : null });
    if (o.value) input.value = o.value;
    if (o.disabled) input.disabled = true;
    var err = h('div', { class: 'mx-err', id: eid, role: 'alert' });
    var wrap = h('div', { class: 'mx-field' }, h('label', { for: id, text: o.label }), h('div', { class: 'mx-inwrap' }, input), o.hint ? h('div', { class: 'mx-hint', id: hid, text: o.hint }) : null, err);
    if (o.type === 'password') {
      var tg = h('button', { type: 'button', class: 'mx-eye', 'aria-label': 'Show password', 'aria-pressed': 'false', title: 'Show / hide password' });
      tg.appendChild(svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'));
      tg.addEventListener('click', function () {
        var show = input.type === 'password'; input.type = show ? 'text' : 'password';
        tg.setAttribute('aria-pressed', String(show)); tg.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); tg.classList.toggle('on', show);
      });
      $('.mx-inwrap', wrap).appendChild(tg);
    }
    var api = {
      wrap: wrap, input: input,
      error: function (m) { err.textContent = m || ''; wrap.classList.toggle('bad', !!m); input.setAttribute('aria-invalid', m ? 'true' : 'false'); },
      val: function () { return input.value; }
    };
    input.addEventListener('input', function () { if (wrap.classList.contains('bad')) api.error(''); });
    return api;
  }
  function strength(pw) {
    var s = 0; if (pw.length >= 8) s++; if (pw.length >= 12) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.min(4, Math.max(pw ? 1 : 0, s - (pw.length < 8 ? 1 : 0)));
  }
  function meter(pwField) {
    var bar = h('div', { class: 'mx-meter', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    var lab = h('div', { class: 'mx-meter-l', 'aria-live': 'polite' });
    var names = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    pwField.input.addEventListener('input', function () {
      var s = strength(pwField.val()); bar.setAttribute('data-s', s); lab.textContent = s ? 'Password strength: ' + names[s] : '';
    });
    return h('div', { class: 'mx-meterwrap' }, bar, lab);
  }
  function button(label, o) {
    o = o || {};
    var b = h('button', { type: o.type || 'button', class: 'mx-btn ' + (o.kind || 'primary') + (o.block ? ' block' : ''), onclick: o.onclick });
    b.appendChild(h('span', { class: 'mx-btn-t', text: label })); b.appendChild(h('span', { class: 'mx-spin', 'aria-hidden': 'true' }));
    return b;
  }
  function busy(b, on, text) {
    b.disabled = on; b.classList.toggle('busy', on);
    if (text) $('.mx-btn-t', b).textContent = text;
  }

  /* ------------------------------------------------------------------ auth modal */
  function authBrand() {
    return h('aside', { class: 'mx-brand', 'aria-hidden': 'true' },
      h('div', { class: 'mx-aurora' }), h('div', { class: 'mx-grid' }),
      (function () {
        var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('viewBox', '0 0 400 200'); s.setAttribute('class', 'mx-wave');
        s.innerHTML = '<path class="w1" d="M0 100C50 20 100 20 150 100S250 180 300 100 350 20 400 100"/><path class="w2" d="M0 120C50 50 100 50 150 120S250 190 300 120 350 50 400 120"/><circle class="dot" r="4" cx="150" cy="100"/>';
        return s;
      })(),
      h('div', { class: 'mx-brand-in' },
        h('div', { class: 'mx-brand-mark' }, icon('i-sigma'), h('b', { text: 'MATHNEX' })),
        h('h2', { text: 'Your engineering workspace, everywhere.' }),
        h('ul', null,
          h('li', { text: 'Save the modules you use most' }),
          h('li', { text: 'Keep quiz results and reviewed topics' }),
          h('li', { text: 'Pick up on any device' })),
        h('p', { text: 'Every calculator and lesson stays free to use without an account.' })));
  }
  function openAuth(mode, ctx) {
    if (!CONFIGURED) return;
    mode = mode || 'signin'; ctx = ctx || {};
    var body = h('div', { class: 'mx-auth-body' });
    var title = h('h2', { id: 'mxAuthT', class: 'mx-auth-title' });
    var close = h('button', { type: 'button', class: 'mx-x', 'aria-label': 'Close', onclick: function () { closeLayer(); } }, icon('i-close'));
    var panel = h('div', { class: 'mx-auth-panel' }, close, title, body);
    var root = h('div', { class: 'mx-modal mx-auth', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mxAuthT' }, authBrand(), panel);
    openLayer(root, { focus: 'input', locked: mode === 'recover' });
    if (mode === 'recover') close.hidden = true;
    view(mode, ctx);

    function tabs(active) {
      var mk = function (id, label) {
        return h('button', { type: 'button', role: 'tab', id: 'mxTab-' + id, 'aria-selected': String(active === id), class: 'mx-tab' + (active === id ? ' on' : ''), onclick: function () { view(id); } }, label);
      };
      return h('div', { class: 'mx-tabs', role: 'tablist', 'aria-label': 'Account' }, mk('signin', 'Sign in'), mk('signup', 'Create account'));
    }
    function formShell(children, onSubmit) {
      var form = h('form', { novalidate: true, class: 'mx-form' });
      var formErr = h('div', { class: 'mx-formerr', role: 'alert' });
      add(form, children); form.insertBefore(formErr, form.firstChild);
      form.addEventListener('submit', function (e) { e.preventDefault(); formErr.textContent = ''; onSubmit(formErr); });
      return form;
    }
    function done(kind, heading, text, actions) {
      title.textContent = heading;
      body.replaceChildren(h('div', { class: 'mx-done ' + kind },
        h('div', { class: 'mx-done-ic' }, svg(kind === 'mail' ? '<rect x="3.5" y="5.5" width="17" height="13" rx="2.4"/><path d="m4.5 7 7.5 5.5L19.5 7"/>' : '<circle cx="12" cy="12" r="9"/><path d="m8.2 12.3 2.6 2.6 5-5.2"/>')),
        h('p', { text: text }), actions));
    }
    function view(m, c) {
      c = c || {}; mode = m;
      if (m === 'signin' || m === 'signup') {
        var isUp = m === 'signup';
        title.textContent = isUp ? 'Create your account' : 'Welcome back';
        var name = isUp ? field({ label: 'Display name (optional)', name: 'name', autocomplete: 'nickname', maxlength: 80 }) : null;
        var email = field({ label: 'Email', type: 'email', name: 'email', autocomplete: 'email', required: true, value: c.email, inputmode: 'email' });
        var pw = field({ label: 'Password', type: 'password', name: 'password', autocomplete: isUp ? 'new-password' : 'current-password', required: true, hint: isUp ? 'At least 8 characters.' : null });
        var pw2 = isUp ? field({ label: 'Confirm password', type: 'password', name: 'confirm', autocomplete: 'new-password', required: true }) : null;
        var sub = button(isUp ? 'Create account' : 'Sign in', { type: 'submit', block: true });
        var forgot = isUp ? null : h('button', { type: 'button', class: 'mx-link', onclick: function () { view('forgot', { email: email.val() }); } }, 'Forgot password?');
        var form = formShell([name && name.wrap, email.wrap, pw.wrap, isUp ? meter(pw) : null, pw2 && pw2.wrap, forgot ? h('div', { class: 'mx-row-r' }, forgot) : null, sub,
          isUp ? h('p', { class: 'mx-fine' }, 'By creating an account you agree to the ', h('a', { href: '#terms', onclick: function () { closeLayer(); } }, 'Terms'), ' and ', h('a', { href: '#privacy', onclick: function () { closeLayer(); } }, 'Privacy notice'), '.') : null],
          function (formErr) {
            var bad = false;
            var ev = email.val().trim(), pv = pw.val();
            email.error(''); pw.error(''); if (pw2) pw2.error('');
            if (!emailOk(ev)) { email.error('Enter a valid email address.'); bad = true; }
            if (!pv) { pw.error('Enter your password.'); bad = true; }
            else if (isUp && pv.length < 8) { pw.error('Use at least 8 characters.'); bad = true; }
            if (isUp && pw2.val() !== pv) { pw2.error('Passwords do not match.'); bad = true; }
            if (bad) { var f = $('.mx-field.bad input', form); if (f) f.focus(); return; }
            busy(sub, true, isUp ? 'Creating…' : 'Signing in…');
            (isUp ? Auth.signUp(ev, pv, name.val().trim()) : Auth.signIn(ev, pv)).then(function (r) {
              if (isUp && !r.signedIn) {
                done('mail', 'Check your inbox', 'If ' + ev + ' can be registered, we have sent a confirmation link. Open it on this device to finish creating your account.',
                  h('div', { class: 'mx-actions' }, resendBtn(ev), h('button', { type: 'button', class: 'mx-link', onclick: function () { view('signin', { email: ev }); } }, 'Back to sign in')));
                return;
              }
              afterSignIn(isUp ? 'Account created. Welcome to MATHNEX!' : 'Signed in.');
            }).catch(function (e) {
              busy(sub, false, isUp ? 'Create account' : 'Sign in');
              if (e.code === 'email_not_confirmed' || /email not confirmed/i.test(e.message)) {
                formErr.textContent = friendly(e);
                formErr.appendChild(doc.createTextNode(' '));
                formErr.appendChild(resendBtn(ev, true));
              } else formErr.textContent = friendly(e);
            });
          });
        body.replaceChildren(tabs(m), form);
        email.input.focus();
      } else if (m === 'forgot') {
        title.textContent = 'Reset your password';
        var fe = field({ label: 'Email', type: 'email', name: 'email', autocomplete: 'email', required: true, value: c.email, inputmode: 'email' });
        var fs = button('Send reset link', { type: 'submit', block: true });
        var ff = formShell([h('p', { class: 'mx-lead', text: 'Enter your account email and we will send you a link to choose a new password.' }), fe.wrap, fs,
          h('div', { class: 'mx-row-c' }, h('button', { type: 'button', class: 'mx-link', onclick: function () { view('signin', { email: fe.val() }); } }, 'Back to sign in'))], function (formErr) {
          var ev = fe.val().trim(); fe.error('');
          if (!emailOk(ev)) { fe.error('Enter a valid email address.'); fe.input.focus(); return; }
          busy(fs, true, 'Sending…');
          Auth.recover(ev).then(function () {
            done('mail', 'Check your inbox', 'If an account exists for ' + ev + ', a password reset link is on its way. The link expires after a short time.',
              h('div', { class: 'mx-actions' }, h('button', { type: 'button', class: 'mx-btn ghost', onclick: function () { view('signin', { email: ev }); } }, 'Back to sign in')));
          }).catch(function (e) { busy(fs, false, 'Send reset link'); formErr.textContent = friendly(e); });
        });
        body.replaceChildren(ff); fe.input.focus();
      } else if (m === 'recover') {
        title.textContent = 'Choose a new password';
        var np = field({ label: 'New password', type: 'password', name: 'new-password', autocomplete: 'new-password', required: true, hint: 'At least 8 characters.' });
        var np2 = field({ label: 'Confirm new password', type: 'password', name: 'confirm', autocomplete: 'new-password', required: true });
        var rs = button('Update password', { type: 'submit', block: true });
        var rf = formShell([np.wrap, meter(np), np2.wrap, rs], function (formErr) {
          var v = np.val(); np.error(''); np2.error('');
          if (v.length < 8) { np.error('Use at least 8 characters.'); np.input.focus(); return; }
          if (np2.val() !== v) { np2.error('Passwords do not match.'); np2.input.focus(); return; }
          busy(rs, true, 'Updating…');
          Auth.updatePassword(v).then(function () { toast('Password updated.', 'ok'); closeLayer(); }).catch(function (e) { busy(rs, false, 'Update password'); formErr.textContent = friendly(e); });
        });
        body.replaceChildren(rf); np.input.focus();
      } else if (m === 'verified') {
        done('ok', c.heading || 'You are signed in', c.text || '', h('div', { class: 'mx-actions' }, button('Open my dashboard', { onclick: function () { closeLayer(true); openDashboard(); } }), h('button', { type: 'button', class: 'mx-btn ghost', onclick: function () { closeLayer(); } }, 'Continue to MATHNEX')));
      }
    }
    function resendBtn(email, inline) {
      var b = h('button', { type: 'button', class: inline ? 'mx-link' : 'mx-btn ghost' }, 'Resend confirmation email');
      var cool = 0, t;
      b.addEventListener('click', function () {
        if (cool > 0) return; b.disabled = true;
        Auth.resend(email).then(function () { toast('Confirmation email sent.', 'ok'); cool = 60; tick(); }).catch(function (e) { b.disabled = false; toast(friendly(e), 'error'); });
      });
      function tick() { clearInterval(t); b.disabled = true; b.textContent = 'Resend in ' + cool + 's'; t = setInterval(function () { cool--; if (cool <= 0) { clearInterval(t); b.disabled = false; b.textContent = 'Resend confirmation email'; } else b.textContent = 'Resend in ' + cool + 's'; }, 1000); }
      return b;
    }
  }
  function afterSignIn(msg) {
    closeLayer(true); toast(msg, 'ok'); emit(); Sync.run();
  }

  /* ------------------------------------------------------------------ dashboard */
  var dashTab = 'overview';
  function openDashboard(tab) {
    if (!CONFIGURED) return;
    if (!Auth.session) { openAuth('signin'); return; }
    dashTab = tab || dashTab || 'overview';
    var nav = h('div', { class: 'mx-dnav', role: 'tablist', 'aria-label': 'Dashboard sections', 'aria-orientation': 'vertical' });
    var content = h('div', { class: 'mx-dcontent', role: 'tabpanel', tabindex: '-1' });
    var heading = h('h2', { id: 'mxDashT', class: 'sr-only', text: 'Your MATHNEX dashboard' });
    var tabs = [['overview', 'Overview', 'i-dash'], ['saved', 'Saved', null], ['progress', 'Progress & quizzes', 'i-graph'], ['plan', 'Plan', 'i-layers'], ['settings', 'Settings', 'i-user']];
    var close = h('button', { type: 'button', class: 'mx-x', 'aria-label': 'Close dashboard', onclick: function () { closeLayer(); } }, icon('i-close'));
    var u = Auth.user() || {};
    var who = h('div', { class: 'mx-who' }, avatar(), h('div', null, h('b', { text: displayName() }), h('small', { text: u.email || '' })));
    var root = h('div', { class: 'mx-modal mx-dash', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mxDashT' },
      heading, close, h('aside', { class: 'mx-dside' }, who, nav,
        h('button', { type: 'button', class: 'mx-btn ghost block mx-out', onclick: signOutFlow }, 'Sign out')), content);
    var unsub = function () { listeners = listeners.filter(function (f) { return f !== rerender; }); };
    function rerender() { if (!layer || layer.root !== root) { unsub(); return; } renderTab(false); }
    onChange(rerender);

    function renderNav() {
      nav.replaceChildren.apply(nav, tabs.map(function (t) {
        var on = dashTab === t[0];
        var b = h('button', { type: 'button', role: 'tab', id: 'mxD-' + t[0], 'aria-selected': String(on), tabindex: on ? '0' : '-1', class: 'mx-dtab' + (on ? ' on' : ''), onclick: function () { dashTab = t[0]; renderNav(); renderTab(true); } },
          t[2] ? icon(t[2]) : svg(ICON_STAR), h('span', { text: t[1] }));
        return b;
      }));
    }
    nav.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
      var ids = tabs.map(function (t) { return t[0]; }), i = ids.indexOf(dashTab), d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
      dashTab = ids[(i + d + ids.length) % ids.length]; renderNav(); renderTab(true); var nb = $('#mxD-' + dashTab, nav); if (nb) nb.focus(); e.preventDefault();
    });
    function renderTab(scroll) {
      content.setAttribute('aria-labelledby', 'mxD-' + dashTab);
      var fn = { overview: tabOverview, saved: tabSaved, progress: tabProgress, plan: tabPlan, settings: tabSettings }[dashTab] || tabOverview;
      if (dashTab === 'settings' && !scroll && content.contains(doc.activeElement) && /^(INPUT|TEXTAREA)$/.test(doc.activeElement.tagName)) return; // never re-render under the user's cursor
      content.replaceChildren(fn(closeLayer));
      if (scroll) content.scrollTop = 0;
    }
    openLayer(root, { full: true, onClose: unsub, focus: '.mx-dtab.on' });
    renderNav(); renderTab(true);
    Sync.run();
  }
  function displayName() {
    var u = Auth.user() || {};
    return (Sync.profile && Sync.profile.display_name) || (u.user_metadata && u.user_metadata.display_name) || (u.email ? u.email.split('@')[0] : 'Learner');
  }
  function initials() {
    var n = displayName().trim().split(/\s+/);
    return ((n[0] || '?')[0] + (n.length > 1 ? n[n.length - 1][0] : '')).toUpperCase();
  }
  function avatar() { return h('span', { class: 'mx-avatar', 'aria-hidden': 'true', text: initials() }); }
  function signOutFlow() {
    Auth.signOut(); Sync.profile = null; Sync.entitlement = null; Sync.status = 'idle';
    closeLayer(); toast('Signed out. Your saved items stay in this browser.', 'info'); emit();
  }
  function empty(msg, cta) { return h('div', { class: 'mx-empty' }, h('p', { text: msg }), cta || null); }
  function modRow(id, o) {
    o = o || {}; var m = modInfo(id); if (!m) return null;
    return h('div', { class: 'mx-modrow' },
      h('button', { type: 'button', class: 'mx-modopen', onclick: function () { closeLayer(true); openModule(id); } }, h('span', { class: 'mx-mi' }, icon(m.icon)), h('span', { class: 'mx-mt' }, h('b', { text: m.title }), o.sub ? h('small', { text: o.sub }) : null)),
      o.remove ? h('button', { type: 'button', class: 'mx-mini', 'aria-label': 'Remove ' + m.title + ' from saved', onclick: o.remove }, icon('i-close')) : null);
  }
  function syncLine() {
    var txt = { idle: 'Not synced yet', syncing: 'Syncing…', ok: 'Synced ' + (Sync.last ? ago(Sync.last) : ''), offline: 'Offline — will retry', error: 'Sync problem — will retry' }[Sync.status];
    return h('div', { class: 'mx-sync ' + Sync.status }, h('i'), h('span', { text: txt }), h('button', { type: 'button', class: 'mx-link', onclick: function () { Sync.run(); } }, 'Sync now'));
  }
  function stat(label, value, sub) { return h('div', { class: 'mx-stat' }, h('small', { text: label }), h('b', { text: String(value) }), sub ? h('span', { text: sub }) : null); }

  function tabOverview() {
    var s = State.stats(), rec = State.recent(), last = rec[0];
    var pct = MODS.length ? Math.round(100 * s.explored / MODS.length) : 0, R = 54, C = 2 * Math.PI * R;
    var ring = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    ring.setAttribute('viewBox', '0 0 132 132'); ring.setAttribute('aria-hidden', 'true');
    ring.innerHTML = '<defs><linearGradient id="mxRingG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22D3EE"/><stop offset=".6" stop-color="#5B9DFF"/><stop offset="1" stop-color="#A78BFA"/></linearGradient></defs><circle class="tr" cx="66" cy="66" r="' + R + '"/><circle class="pg" cx="66" cy="66" r="' + R + '" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/>';
    var ringCard = h('div', { class: 'mx-ringcard' }, h('div', { class: 'mx-ring', role: 'img', 'aria-label': pct + ' percent of modules explored' }, ring, h('b', { text: pct + '%' })),
      h('div', null, h('h4', { text: 'Module exploration' }), h('p', { text: 'You have opened ' + s.explored + ' of ' + MODS.length + ' modules' + (s.quizzes.length ? ' and attempted ' + plural(s.quizzes.length, 'quiz') + (s.avg != null ? ', averaging ' + s.avg + '% on your best results' : '') : '') + '. This is calculated from your own activity.' })));
    var wrap = h('div', { class: 'mx-pane' },
      h('div', { class: 'mx-phead' }, h('div', null, h('div', { class: 'eyebrow', text: 'Dashboard' }), h('h3', { text: 'Welcome back, ' + displayName().split(' ')[0] })), syncLine()),
      ringCard,
      h('div', { class: 'mx-stats' },
        stat('Modules explored', s.explored + ' / ' + MODS.length), stat('Saved', s.saved), stat('Quizzes attempted', s.quizzes.length),
        stat('Average best score', s.avg == null ? '—' : s.avg + '%', s.quizzes.length ? 'across ' + plural(s.quizzes.length, 'quiz') : 'No quizzes yet')));
    if (last) {
      var m = modInfo(last), a = State.activity()[last];
      wrap.appendChild(h('div', { class: 'mx-continue' }, h('div', null, h('small', { text: 'CONTINUE WHERE YOU LEFT OFF' }), h('b', { text: m.title }), h('span', { text: 'Opened ' + ago(a.t) + ' · ' + plural(a.n, 'visit') })),
        h('button', { type: 'button', class: 'mx-btn primary', onclick: function () { closeLayer(true); openModule(last); } }, h('span', { class: 'mx-btn-t', text: 'Open module' }))));
    }
    var recent = h('section', { class: 'mx-box' }, h('h4', { text: 'Recently opened' }));
    if (rec.length) rec.slice(0, 6).forEach(function (id) { recent.appendChild(modRow(id, { sub: ago(State.activity()[id].t) })); }); else recent.appendChild(empty('Modules you open will appear here.'));
    var sv = State.saved().filter(modInfo), saved = h('section', { class: 'mx-box' }, h('h4', { text: 'Saved modules' }));
    if (sv.length) sv.slice(0, 6).forEach(function (id) { saved.appendChild(modRow(id)); }); else saved.appendChild(empty('Open a module and tap Save to pin it here.'));
    wrap.appendChild(h('div', { class: 'mx-two' }, recent, saved));
    return wrap;
  }
  function tabSaved() {
    var sv = State.saved().filter(modInfo), box = h('div', { class: 'mx-pane' }, h('div', { class: 'mx-phead' }, h('div', null, h('div', { class: 'eyebrow', text: 'Saved resources' }), h('h3', { text: plural(sv.length, 'saved module') })), syncLine()));
    if (!sv.length) { box.appendChild(empty('Nothing saved yet. Open any module and use the Save button in its header.')); return box; }
    var g = h('div', { class: 'mx-modgrid' });
    sv.forEach(function (id) { g.appendChild(modRow(id, { remove: function () { State.toggleSaved(id); toast('Removed from saved.', 'info'); } })); });
    box.appendChild(g); return box;
  }
  function tabProgress() {
    var s = State.stats(), prog = State.progress(), act = State.activity();
    var pane = h('div', { class: 'mx-pane' }, h('div', { class: 'mx-phead' }, h('div', null, h('div', { class: 'eyebrow', text: 'Learning progress' }), h('h3', { text: 'Progress & quiz history' })), syncLine()),
      h('div', { class: 'mx-stats' }, stat('Topics reviewed', s.topics), stat('Exercises completed', s.exercises), stat('Quizzes attempted', s.quizzes.length), stat('Modules explored', s.explored + ' / ' + MODS.length)));
    var tbl = h('section', { class: 'mx-box' }, h('h4', { text: 'By module' }));
    var rows = MODS.filter(function (m) { var p = prog[m.id] || {}; return act[m.id] || (p.reviewedTopics || []).length || (p.completedExercises || []).length || Object.keys(p.quizBest || {}).length; });
    if (!rows.length) tbl.appendChild(empty('Open a module to start building your progress.'));
    else {
      var t = h('table', { class: 'mx-table' }, h('thead', null, h('tr', null, ['Module', 'Visits', 'Topics', 'Exercises', 'Quizzes'].map(function (x) { return h('th', { scope: 'col', text: x }); }))));
      var tb = h('tbody');
      rows.forEach(function (m) { var p = prog[m.id] || {}; tb.appendChild(h('tr', null, h('th', { scope: 'row', text: m.title }), h('td', { text: String((act[m.id] || {}).n || 0) }), h('td', { text: String((p.reviewedTopics || []).length) }), h('td', { text: String((p.completedExercises || []).length) }), h('td', { text: String(Object.keys(p.quizBest || {}).length) }))); });
      t.appendChild(tb); tbl.appendChild(h('div', { class: 'mx-tablewrap' }, t));
    }
    var qh = h('section', { class: 'mx-box' }, h('h4', { text: 'Quiz history (best result per quiz)' }));
    if (!s.quizzes.length) qh.appendChild(empty('Complete a quiz in Properties of Materials, Fibre Science, Limits or Real Analysis and it will appear here.'));
    s.quizzes.sort(function (a, b) { return String(b.when).localeCompare(String(a.when)); }).forEach(function (q) {
      var pct = Math.round(100 * q.score / q.total), m = modInfo(q.mod);
      qh.appendChild(h('div', { class: 'mx-quiz' }, h('div', null, h('b', { text: prettyId(q.id) }), h('small', { text: (m ? m.title : prettyId(q.mod)) + (q.when ? ' · ' + q.when : '') })),
        h('div', { class: 'mx-qs' }, h('span', { text: q.score + ' / ' + q.total + ' (' + pct + '%)' }), h('div', { class: 'mx-bar', role: 'img', 'aria-label': pct + ' percent' }, h('i', { style: 'width:' + pct + '%' })))));
    });
    pane.appendChild(tbl); pane.appendChild(qh); return pane;
  }
  function tabPlan() {
    var on = Premium.enabled(), act = Premium.active();
    var pane = h('div', { class: 'mx-pane' }, h('div', { class: 'mx-phead' }, h('div', null, h('div', { class: 'eyebrow', text: 'Membership' }), h('h3', { text: act ? 'Premium' : 'Free plan' }))));
    pane.appendChild(h('div', { class: 'mx-plan' }, h('b', { text: act ? 'Premium is active' : 'You are on the free plan' }),
      h('p', { text: on ? (act ? 'Thank you for supporting MATHNEX.' : 'Premium features are configured for this site.') : 'Every MATHNEX module, solver and lesson is currently free. Premium plans are not available yet; nothing in your account is locked.' })));
    if (Premium.active() && Sync.entitlement && Sync.entitlement.current_period_end) pane.appendChild(h('p', { class: 'mx-fine', text: 'Current period ends ' + fmtDate(Sync.entitlement.current_period_end) + '.' }));
    return pane;
  }
  function tabSettings() {
    var pane = h('div', { class: 'mx-pane' }, h('div', { class: 'mx-phead' }, h('div', null, h('div', { class: 'eyebrow', text: 'Account' }), h('h3', { text: 'Settings' }))));
    var u = Auth.user() || {}, p = Sync.profile || {};
    /* profile */
    var dn = field({ label: 'Display name', name: 'name', autocomplete: 'nickname', maxlength: 80, value: p.display_name || '' });
    var inst = field({ label: 'University / school (optional)', name: 'org', autocomplete: 'organization', maxlength: 120, value: p.institution || '' });
    var foc = field({ label: 'Study focus (optional)', name: 'focus', maxlength: 120, value: p.study_focus || '', placeholder: 'e.g. Textile engineering' });
    var em = field({ label: 'Email', type: 'email', name: 'email', value: u.email || '', disabled: true, hint: 'Your sign-in email cannot be changed here.' });
    var sv = button('Save profile', { type: 'submit' });
    var pf = h('form', { class: 'mx-form mx-box', novalidate: true }, h('h4', { text: 'Profile' }), h('div', { class: 'mx-formerr', role: 'alert' }), em.wrap, dn.wrap, inst.wrap, foc.wrap, sv);
    pf.addEventListener('submit', function (e) {
      e.preventDefault(); var fe = $('.mx-formerr', pf); fe.textContent = '';
      var vals = { display_name: dn.val().trim().slice(0, 80) || null, institution: inst.val().trim().slice(0, 120) || null, study_focus: foc.val().trim().slice(0, 120) || null };
      busy(sv, true, 'Saving…');
      Sync.saveProfile(vals).then(function () { busy(sv, false, 'Save profile'); toast('Profile saved.', 'ok'); }).catch(function (er) { busy(sv, false, 'Save profile'); fe.textContent = friendly(er); });
    });
    pane.appendChild(pf);
    /* password */
    var p1 = field({ label: 'New password', type: 'password', name: 'new-password', autocomplete: 'new-password', hint: 'At least 8 characters.' });
    var p2 = field({ label: 'Confirm new password', type: 'password', name: 'confirm', autocomplete: 'new-password' });
    var ps = button('Change password', { type: 'submit' });
    var pwf = h('form', { class: 'mx-form mx-box', novalidate: true }, h('h4', { text: 'Password' }), h('div', { class: 'mx-formerr', role: 'alert' }), p1.wrap, meter(p1), p2.wrap, ps);
    pwf.addEventListener('submit', function (e) {
      e.preventDefault(); var fe = $('.mx-formerr', pwf); fe.textContent = ''; p1.error(''); p2.error('');
      if (p1.val().length < 8) { p1.error('Use at least 8 characters.'); p1.input.focus(); return; }
      if (p1.val() !== p2.val()) { p2.error('Passwords do not match.'); p2.input.focus(); return; }
      busy(ps, true, 'Updating…');
      Auth.updatePassword(p1.val()).then(function () { busy(ps, false, 'Change password'); p1.input.value = ''; p2.input.value = ''; toast('Password updated.', 'ok'); }).catch(function (er) { busy(ps, false, 'Change password'); fe.textContent = friendly(er); });
    });
    pane.appendChild(pwf);
    /* ads preference */
    if (adsConfigured()) {
      var cur = ls.get('mxAdsConsent') || 'unset';
      var sel = h('select', { id: 'mxAdsSel', 'aria-label': 'Ad personalisation' }, h('option', { value: 'basic', text: 'Basic ads only (non-personalised)' }), h('option', { value: 'personalised', text: 'Personalised ads' }), h('option', { value: 'none', text: 'No ads' }));
      sel.value = cur === 'unset' ? 'basic' : cur;
      sel.addEventListener('change', function () { ls.set('mxAdsConsent', sel.value); toast(sel.value === 'none' ? 'Ads turned off on this device.' : 'Ad preference saved. It applies on your next page load.', 'ok'); });
      pane.appendChild(h('section', { class: 'mx-box' }, h('h4', { text: 'Advertising' }), h('p', { class: 'mx-fine', text: 'MATHNEX may show ads to cover running costs. This choice is stored on this device only.' }), sel));
    }
    /* data */
    var exp = button('Download my data', { kind: 'ghost', onclick: function () { exportData(); } });
    var del = button('Delete my synced data', { kind: 'danger', onclick: function () {
      if (!window.confirm('Delete all saved modules, activity, quiz results and topic progress stored in your account? Data in this browser is not affected.')) return;
      busy(del, true, 'Deleting…');
      Sync.deleteRemote().then(function () { busy(del, false, 'Delete my synced data'); toast('Synced data deleted.', 'ok'); }).catch(function (er) { busy(del, false, 'Delete my synced data'); toast(friendly(er), 'error'); });
    } });
    pane.appendChild(h('section', { class: 'mx-box' }, h('h4', { text: 'Your data' }), h('p', { class: 'mx-fine', text: 'Download a copy of what MATHNEX stores for you, or remove what is synced to your account. To delete the account itself, email the site owner from the Contact page.' }), h('div', { class: 'mx-actions' }, exp, del)));
    pane.appendChild(h('section', { class: 'mx-box' }, h('h4', { text: 'Session' }), h('button', { type: 'button', class: 'mx-btn ghost', onclick: signOutFlow }, 'Sign out')));
    return pane;
  }
  function exportData() {
    var o = { app: 'MATHNEX', exported: nowIso(), account: { email: (Auth.user() || {}).email }, profile: Sync.profile, saved: State.saved(), activity: State.activity(), progress: State.progress() };
    var a = h('a', { download: 'mathnex-my-data.json', href: URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })) });
    doc.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  /* ------------------------------------------------------------------ header account button */
  var acctBtn;
  function buildHeader() {
    var tools = $('.tools-r'); if (!tools || !CONFIGURED) return;
    acctBtn = h('button', { type: 'button', id: 'mxAcct', class: 'mx-acct', 'aria-haspopup': 'dialog', onclick: function () { Auth.session ? openDashboard() : openAuth('signin'); } });
    tools.insertBefore(acctBtn, $('#themeBtn', tools) || null);
    renderHeader();
  }
  function renderHeader() {
    if (!acctBtn) return;
    var signed = !!Auth.session;
    acctBtn.replaceChildren();
    acctBtn.classList.toggle('signed', signed);
    if (signed) {
      acctBtn.setAttribute('aria-label', 'Open dashboard for ' + displayName()); acctBtn.title = 'Your dashboard';
      acctBtn.appendChild(avatar()); acctBtn.appendChild(h('span', { class: 'mx-acct-t', text: displayName().split(' ')[0] }));
    } else {
      acctBtn.setAttribute('aria-label', 'Sign in or create an account'); acctBtn.title = 'Sign in or create an account';
      acctBtn.appendChild(icon('i-user')); acctBtn.appendChild(h('span', { class: 'mx-acct-t', text: 'Sign in' }));
    }
  }

  /* ------------------------------------------------------------------ Save buttons in module headers */
  function buildSaveButtons() {
    $$('.wshead').forEach(function (wh) {
      if (wh.getAttribute('data-mx-save')) return;
      var host = wh.closest('section.module') || wh.closest('#mod-matrix');
      var id = host && host.id ? host.id.replace(/^mod-/, '') : 'matrix';
      if (!modInfo(id)) return;
      wh.setAttribute('data-mx-save', id);
      var b = h('button', { type: 'button', class: 'mx-save', 'aria-pressed': 'false', 'data-mod-id': id, onclick: function () { var on = State.toggleSaved(id); toast(on ? 'Saved to your learning list.' : 'Removed from saved.', on ? 'ok' : 'info'); } });
      var tools = $('.wshead-tools', wh);
      if (!tools) { tools = h('div', { class: 'wshead-tools' }); wh.appendChild(tools); }
      tools.appendChild(b);
    });
    renderSaveButtons();
  }
  function renderSaveButtons() {
    $$('.mx-save').forEach(function (b) {
      var on = State.isSaved(b.getAttribute('data-mod-id')), m = modInfo(b.getAttribute('data-mod-id'));
      b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on);
      b.replaceChildren(svg(ICON_STAR), h('span', { text: on ? 'Saved' : 'Save' }));
      b.setAttribute('aria-label', (on ? 'Remove ' : 'Save ') + (m ? m.title : 'this module') + (on ? ' from saved' : ' to your learning list'));
    });
  }

  /* ------------------------------------------------------------------ home: my learning + monetization */
  var homeSec;
  function buildHome() {
    var dq = $('.dash-quick'); if (!dq) return;
    homeSec = h('section', { class: 'mx-home', 'aria-labelledby': 'mxHomeT' });
    dq.parentNode.insertBefore(homeSec, dq.nextSibling);
    renderHome();
  }
  function renderHome() {
    if (!homeSec) return;
    var rec = State.recent(), sv = State.saved().filter(modInfo), last = rec[0];
    homeSec.replaceChildren();
    var showLearning = rec.length || sv.length;
    var showCta = CONFIGURED && !Auth.session;
    if (showLearning || showCta) {
      var head = h('div', { class: 'dash-qhead' }, h('h2', { id: 'mxHomeT', text: 'My learning' }), h('span', { text: Auth.session ? 'Synced to your account' : 'Saved in this browser' }));
      var grid = h('div', { class: 'mx-hgrid' });
      if (last) {
        var m = modInfo(last), a = State.activity()[last];
        grid.appendChild(h('div', { class: 'mx-hcard main' }, h('small', { text: 'CONTINUE' }), h('div', { class: 'mx-hmod' }, h('span', { class: 'mx-mi' }, icon(m.icon)), h('b', { text: m.title })), h('p', { text: 'Last opened ' + ago(a.t) + '.' }),
          h('button', { type: 'button', class: 'mx-btn primary', onclick: function () { openModule(last); } }, h('span', { class: 'mx-btn-t', text: 'Resume' }))));
      }
      if (sv.length) {
        var chips = h('div', { class: 'mx-chips' });
        sv.slice(0, 8).forEach(function (id) { var mm = modInfo(id); chips.appendChild(h('button', { type: 'button', class: 'mx-chip', onclick: function () { openModule(id); } }, icon(mm.icon), h('span', { text: mm.title }))); });
        grid.appendChild(h('div', { class: 'mx-hcard' }, h('small', { text: 'SAVED' }), chips));
      }
      if (showCta) {
        grid.appendChild(h('div', { class: 'mx-hcard cta' }, h('small', { text: 'OPTIONAL ACCOUNT' }), h('b', { text: 'Keep your progress on every device' }), h('p', { text: 'Sign in to sync saved modules, quiz results and reviewed topics. All tools stay free without an account.' }),
          h('div', { class: 'mx-actions' }, h('button', { type: 'button', class: 'mx-btn primary', onclick: function () { openAuth('signup'); } }, h('span', { class: 'mx-btn-t', text: 'Create free account' })), h('button', { type: 'button', class: 'mx-btn ghost', onclick: function () { openAuth('signin'); } }, 'Sign in'))));
      } else if (Auth.session && !grid.children.length) { /* nothing */ }
      homeSec.appendChild(head); homeSec.appendChild(grid);
    }
    homeSec.hidden = !homeSec.children.length;
    renderMonetization();
  }

  /* monetization surfaces — render ONLY what the operator configured; never placeholders */
  var monSec;
  function validItems(list, extra) {
    return (Array.isArray(list) ? list : []).map(function (x) {
      var u = x && safeHttps(x.url); if (!u || !x.title) return null;
      return { title: String(x.title).slice(0, 90), description: String(x.description || '').slice(0, 220), url: u, by: String(x[extra] || '').slice(0, 60), price: x.price ? String(x.price).slice(0, 20) : '' };
    }).filter(Boolean);
  }
  function monCard(it, kind, labelText) {
    var a = h('a', { class: 'mx-mcard ' + kind, href: it.url, target: '_blank', rel: (kind === 'product' ? '' : 'sponsored ') + 'noopener noreferrer' },
      h('span', { class: 'mx-tag', text: labelText }), h('b', { text: it.title }), it.description ? h('span', { class: 'mx-md', text: it.description }) : null,
      h('span', { class: 'mx-mf', text: (it.by ? it.by + ' · ' : '') + (it.price ? it.price + ' · ' : '') + 'opens in a new tab' }));
    return a;
  }
  function renderMonetization() {
    if (!homeSec) return;
    if (!monSec) { monSec = h('section', { class: 'mx-mon' }); homeSec.parentNode.insertBefore(monSec, homeSec.nextSibling); }
    monSec.replaceChildren();
    if (Premium.enabled() && Premium.active()) { monSec.hidden = true; return; }
    var aff = validItems(CFG.affiliates, 'merchant'), spn = validItems(CFG.sponsors, 'sponsor'), prd = validItems(CFG.products, 'merchant');
    if (aff.length) {
      var g = h('div', { class: 'mx-mgrid' }); aff.slice(0, 6).forEach(function (i) { g.appendChild(monCard(i, 'affiliate', 'Affiliate link')); });
      monSec.appendChild(h('div', { class: 'mx-mblock' }, h('div', { class: 'dash-qhead' }, h('h2', { text: 'Recommended study resources' }), h('span', { text: 'Affiliate links' })), g,
        h('p', { class: 'mx-disc', text: 'Disclosure: some links above are affiliate links. If you buy through them MATHNEX may earn a commission at no extra cost to you. Recommendations are not influenced by this.' })));
    }
    if (spn.length) {
      var g2 = h('div', { class: 'mx-mgrid' }); spn.slice(0, 4).forEach(function (i) { g2.appendChild(monCard(i, 'sponsor', 'Sponsored')); });
      monSec.appendChild(h('div', { class: 'mx-mblock' }, h('div', { class: 'dash-qhead' }, h('h2', { text: 'Sponsored' }), h('span', { text: 'Paid placement — not editorial content' })), g2));
    }
    if (prd.length) {
      var g3 = h('div', { class: 'mx-mgrid' }); prd.slice(0, 6).forEach(function (i) { g3.appendChild(monCard(i, 'product', 'Study material')); });
      monSec.appendChild(h('div', { class: 'mx-mblock' }, h('div', { class: 'dash-qhead' }, h('h2', { text: 'Study materials' }), h('span', { text: 'Downloads & guides' })), g3));
    }
    if (adsConfigured() && CFG.ads.slots && CFG.ads.slots.home && adAllowed()) monSec.appendChild(adSlot('home'));
    monSec.hidden = !monSec.children.length;
  }

  /* AdSense: loaded only when configured AND the visitor has chosen an ad preference. */
  function adsConfigured() { return /^ca-pub-\d{8,20}$/.test(String(CFG.ads.adsenseClient || '')); }
  function adAllowed() { var c = ls.get('mxAdsConsent'); return (c === 'basic' || c === 'personalised') && !(Premium.enabled() && Premium.active()); }
  var adsScript = false;
  function adSlot(name) {
    var slot = CFG.ads.slots && CFG.ads.slots[name]; if (!slot || !/^\d{6,20}$/.test(String(slot))) return doc.createComment('ad');
    var ins = h('ins', { class: 'adsbygoogle', style: 'display:block', 'data-ad-client': CFG.ads.adsenseClient, 'data-ad-slot': String(slot), 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' });
    var box = h('aside', { class: 'mx-adslot', 'aria-label': 'Advertisement', 'data-mx-ad': name }, h('small', { text: 'Advertisement' }), ins);
    setTimeout(function () { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked */ } }, 0);
    ensureAdsScript(); return box;
  }
  function ensureAdsScript() {
    if (adsScript) return; adsScript = true;
    window.adsbygoogle = window.adsbygoogle || [];
    if (ls.get('mxAdsConsent') === 'basic') window.adsbygoogle.requestNonPersonalizedAds = 1;
    var s = h('script', { async: true, crossorigin: 'anonymous', src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CFG.ads.adsenseClient) });
    doc.head.appendChild(s);
  }
  var footAd;
  function buildFooterAd() {
    if (footAd) { footAd.remove(); footAd = null; }
    if (!adsConfigured() || !(CFG.ads.slots && CFG.ads.slots.footer) || !adAllowed()) return;
    var f = $('footer.site-foot'); if (!f) return;
    footAd = adSlot('footer'); if (footAd.nodeType === 1) f.parentNode.insertBefore(footAd, f);
  }
  function consentBanner() {
    if (!adsConfigured() || ls.get('mxAdsConsent') || $('#mxConsent')) return;
    function pick(v) { ls.set('mxAdsConsent', v); b.remove(); renderHome(); buildFooterAd(); if (v === 'none') toast('Ads are off. You can change this in Settings.', 'info'); }
    var b = h('div', { id: 'mxConsent', class: 'mx-consent', role: 'region', 'aria-label': 'Advertising choices' },
      h('p', { text: 'MATHNEX is free and may show ads to cover running costs. Choose how ads are served.' }),
      h('div', { class: 'mx-actions' }, h('button', { type: 'button', class: 'mx-btn primary', onclick: function () { pick('personalised'); } }, h('span', { class: 'mx-btn-t', text: 'Personalised' })), h('button', { type: 'button', class: 'mx-btn ghost', onclick: function () { pick('basic'); } }, 'Basic only'), h('button', { type: 'button', class: 'mx-link', onclick: function () { pick('none'); } }, 'No ads')));
    doc.body.appendChild(b);
  }

  /* ------------------------------------------------------------------ boot */
  function handleAuthRedirect(raw) {
    if (!raw) {
      try { raw = sessionStorage.getItem('mxAuthHash'); sessionStorage.removeItem('mxAuthHash'); } catch (e) { /* ignore */ }
    }
    if (!raw) return;
    var r = Auth.fromUrlHash(raw); if (!r) return;
    if (r.error) {
      toast(/expired|invalid/i.test(r.error) ? 'That email link is invalid or has expired. Request a new one.' : r.error, 'error');
      openAuth('signin'); return;
    }
    Auth.set(r.data); emit(); Sync.run();
    if (r.type === 'recovery') openAuth('recover');
    else openAuth('verified', { heading: r.type === 'signup' || r.type === 'invite' ? 'Email verified' : 'You are signed in', text: r.type === 'signup' ? 'Your account is confirmed and you are signed in.' : 'You are signed in to MATHNEX.' });
  }
  /* an email link opened inside an already-loaded tab only changes the hash */
  window.addEventListener('hashchange', function () {
    var hsh = location.hash;
    if (!CONFIGURED || !/[#&](access_token|error_description|error_code)=/.test(hsh)) return;
    try { history.replaceState(null, '', location.pathname + location.search + '#home'); } catch (e) { /* ignore */ }
    handleAuthRedirect(hsh);
  });

  function init() {
    readMods();
    buildSaveButtons(); buildHome();
    if (CONFIGURED) { Auth.load(); buildHeader(); handleAuthRedirect(); if (Auth.session) Sync.run(); }
    onChange(function () { renderHeader(); renderSaveButtons(); renderHome(); Premium.apply(); });
    emit();
    consentBanner(); buildFooterAd();
    /* visits */
    new MutationObserver(function () { trackVisit(); }).observe(doc.body, { attributes: true, attributeFilter: ['data-page'] });
    window.addEventListener('mathnex:mod', function () { setTimeout(trackVisit, 0); });
    trackVisit();
    /* sync triggers */
    setInterval(function () { if (Auth.session && !doc.hidden && JSON.stringify(State.progress()) !== Sync.snap) { Sync.snap = JSON.stringify(State.progress()); Sync.schedule(); emit(); } }, 10000);
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { if (Auth.session && Sync.timer) { clearTimeout(Sync.timer); Sync.run(); } }
      else if (Auth.session) { if (Auth.session.expires_at - 60 < Date.now() / 1000) Auth.refresh().catch(function () { /* ignore */ }); Sync.schedule(); }
    });
    window.addEventListener('storage', function (e) { if (e.key === 'mxSession') { Auth.load(); emit(); } if (e.key === 'mxSaved' || e.key === 'mxActivity') emit(); });
    window.addEventListener('online', function () { Sync.schedule(); });
  }

  window.MXPlatform = {
    configured: CONFIGURED,
    user: function () { return Auth.user(); },
    isSignedIn: function () { return !!Auth.session; },
    isPremium: function () { return Premium.active(); },
    premiumEnabled: Premium.enabled,
    /* Gate a future premium feature: returns true when allowed; otherwise opens sign-in. Everything is free while premium.enabled is false. */
    requirePremium: function () {
      if (!Premium.enabled() || Premium.active()) return true;
      if (CONFIGURED && !Auth.session) openAuth('signin');
      return false;
    },
    openAuth: openAuth, openDashboard: openDashboard, onChange: onChange,
    signOut: signOutFlow, syncNow: function () { return Sync.run(); }
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
