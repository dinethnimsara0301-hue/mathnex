/* MATHNEX home experience layer (works for every visitor; no account or network needed).
   - Real-data stats strip (counts read from the live app: modules, theme presets, operations stated in the hero)
   - Module discovery: search + category / saved / recent filters over the existing 14 module cards
   - Saved indicators on cards, premium footer meta, page-enter transitions, mobile tab bar
   It never alters module behaviour; cards still call the app's own click handlers. */
(function () {
  'use strict';
  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function jget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function h(tag, props) {
    var n = doc.createElement(tag); props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k]; if (v == null || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c == null) continue; (Array.isArray(c) ? c : [c]).forEach(function (x) { n.appendChild(typeof x === 'string' ? doc.createTextNode(x) : x); }); }
    return n;
  }
  function icon(id) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
    s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); u.setAttribute('href', '#' + id); s.appendChild(u); return s;
  }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CATS = {
    math: { label: 'Mathematics', mods: ['matrix', 'vector', 'diff', 'int', 'complex', 'limits', 'analysis'] },
    eng: { label: 'Engineering', mods: ['elec', 'mech', 'fluid'] },
    mat: { label: 'Materials & Textiles', mods: ['materials', 'fibre'] },
    tools: { label: 'Tools & Programming', mods: ['calc', 'prog'] }
  };
  function cards() { return $$('.modcards .modcard[data-mod]'); }
  function saved() { var a = jget('mxSaved', []); return Array.isArray(a) ? a : []; }
  function recent() { var o = jget('mxActivity', {}), ids = Object.keys(o); ids.sort(function (a, b) { return String(o[b].t || '').localeCompare(String(o[a].t || '')); }); return ids; }

  /* ---------- stats strip ---------- */
  function countUp(el, to) {
    if (reduce || to < 2) { el.textContent = String(to); return; }
    var t0 = performance.now(), d = 900;
    (function step(t) { var p = Math.min(1, (t - t0) / d); el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  function buildStrip() {
    var hero = $('.hero'); if (!hero || $('.mx-strip')) return;
    var nMods = cards().length || $$('#mxSidebar .sb-item[data-mod]').length;
    var nThemes = window.MXTheme && window.MXTheme.PRESETS ? Object.keys(window.MXTheme.PRESETS).length : 0;
    var heroNums = ($('.hstats') || {}).textContent || '';
    var mm = heroNums.match(/(\d+)\s*matrix ops/i), vv = heroNums.match(/(\d+)\s*vector ops/i);
    var tiles = [
      { ic: 'i-layers', c: '#5B9DFF', n: nMods, l: 'Learning modules' },
      { ic: 'i-palette', c: '#A78BFA', n: nThemes, l: 'Switchable themes' },
      mm && vv ? { ic: 'i-matrix', c: '#22D3EE', t: mm[1] + ' · ' + vv[1], l: 'Matrix · vector operations' } : null,
      { ic: 'i-code', c: '#34D399', t: '100%', l: 'Runs in your browser' }
    ].filter(Boolean);
    var strip = h('section', { class: 'mx-strip', 'aria-label': 'MATHNEX at a glance' });
    tiles.forEach(function (t) {
      var b = h('b', { text: t.t || '0' });
      strip.appendChild(h('div', { style: '--c:' + t.c }, h('span', { class: 'mx-si' }, icon(t.ic)), h('div', null, b, h('small', { text: t.l }))));
      if (t.n != null) { b.textContent = String(t.n); if (!reduce && 'IntersectionObserver' in window) { b.textContent = '0'; var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); countUp(b, t.n); } }); io.observe(b); } }
    });
    hero.parentNode.insertBefore(strip, hero.nextSibling);
  }

  /* ---------- module discovery ---------- */
  var q = '', cat = 'all', countEl, noneEl, chips = {};
  function matches(c) {
    var id = c.getAttribute('data-mod');
    if (cat === 'saved' && saved().indexOf(id) < 0) return false;
    if (cat === 'recent' && recent().slice(0, 6).indexOf(id) < 0) return false;
    if (CATS[cat] && CATS[cat].mods.indexOf(id) < 0) return false;
    if (q) { var hay = (c.textContent || '').toLowerCase(); return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; }); }
    return true;
  }
  function applyFilter() {
    var shown = 0;
    cards().forEach(function (c) { var ok = matches(c); c.hidden = !ok; if (ok) shown++; });
    var total = cards().length;
    if (countEl) countEl.textContent = (q || cat !== 'all') ? shown + ' of ' + total + ' modules' : total + ' modules';
    if (noneEl) noneEl.classList.toggle('on', shown === 0);
    Object.keys(chips).forEach(function (k) { chips[k].setAttribute('aria-pressed', String(k === cat)); });
    refreshChipCounts();
  }
  function refreshChipCounts() {
    if (chips.saved) $('em', chips.saved).textContent = String(saved().filter(function (id) { return $('.modcard[data-mod="' + id + '"]'); }).length);
    if (chips.recent) $('em', chips.recent).textContent = String(Math.min(6, recent().filter(function (id) { return $('.modcard[data-mod="' + id + '"]'); }).length));
  }
  function buildFind() {
    var grid = $('.modcards'); if (!grid || $('.mx-find')) return;
    var input = h('input', { type: 'search', id: 'mxFindIn', placeholder: 'Search modules (try “Python”)', 'aria-label': 'Search modules', autocomplete: 'off', spellcheck: 'false' });
    var clear = h('button', { type: 'button', hidden: true, 'aria-label': 'Clear search' }, icon('i-close'));
    input.addEventListener('input', function () { q = input.value.trim().toLowerCase(); clear.hidden = !q; applyFilter(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape' && input.value) { input.value = ''; q = ''; clear.hidden = true; applyFilter(); e.stopPropagation(); } });
    clear.addEventListener('click', function () { input.value = ''; q = ''; clear.hidden = true; applyFilter(); input.focus(); });
    var bar = h('div', { class: 'mx-filters', role: 'group', 'aria-label': 'Filter modules' });
    function chip(key, label, withCount) {
      var b = h('button', { type: 'button', class: 'mx-fchip', 'aria-pressed': String(key === 'all'), onclick: function () { cat = key; applyFilter(); } }, label, withCount ? h('em', { text: '0' }) : null);
      chips[key] = b; bar.appendChild(b);
    }
    chip('all', 'All'); Object.keys(CATS).forEach(function (k) { chip(k, CATS[k].label); }); chip('saved', 'Saved', true); chip('recent', 'Recent', true);
    countEl = h('div', { class: 'mx-count', 'aria-live': 'polite' });
    var find = h('div', { class: 'mx-find' }, h('div', { class: 'mx-search', role: 'search' }, icon('i-search'), input, clear), bar, countEl);
    noneEl = h('div', { class: 'mx-none', role: 'status' }, 'No modules match your search. Try a different word or clear the filter.');
    grid.parentNode.insertBefore(find, grid); grid.parentNode.insertBefore(noneEl, grid.nextSibling);
    applyFilter();
  }
  function decorateCards() {
    var s = saved();
    cards().forEach(function (c) {
      var id = c.getAttribute('data-mod'), top = $('.mc-top', c);
      if (top && !$('.mc-saved', c)) { var sp = h('span', { class: 'mc-saved' }, icon('i-check'), 'Saved'); top.insertBefore(sp, $('.mc-badge', top)); }
      if (s.indexOf(id) >= 0) c.setAttribute('data-mx-saved', ''); else c.removeAttribute('data-mx-saved');
    });
  }

  /* ---------- footer meta ---------- */
  function buildFooter() {
    var f = $('footer.site-foot'); if (!f || $('.mx-foot-meta', f)) return;
    var n = cards().length;
    f.appendChild(h('div', { class: 'mx-foot-meta' }, h('span', { text: n + ' modules' }), h('span', { text: 'Free to use' }), h('span', { text: 'Calculations run locally in your browser' }), h('span', { text: 'Optional account for syncing' })));
  }

  /* ---------- page transitions ---------- */
  function onPage() {
    if (reduce || doc.documentElement.getAttribute('data-motion') === 'off') return;
    $$('.hero,.dash-quick,.mx-strip,#workspace,.site-sec').forEach(function (n) { n.classList.remove('mx-enter'); void n.offsetWidth; n.classList.add('mx-enter'); });
  }

  /* ---------- mobile tab bar ---------- */
  var tabbar;
  function buildTabbar() {
    if (tabbar) return;
    function go(fn) { return function () { fn(); }; }
    function toHome() { var b = $('.brand-link'); if (doc.body.getAttribute('data-page') !== 'home' && b) b.click(); setTimeout(function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }, 30); }
    function toModules() { var go2 = function () { var t = $('.mx-find') || $('.modcards'); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }; if (doc.body.getAttribute('data-page') !== 'home') { var b = $('.brand-link'); if (b) b.click(); setTimeout(go2, 80); } else go2(); }
    function toLearning() {
      if (window.MXPlatform && window.MXPlatform.configured && window.MXPlatform.isSignedIn()) { window.MXPlatform.openDashboard('overview'); return; }
      var ml = $('.mx-home'); if (ml && !ml.hidden) ml.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); else { cat = 'saved'; applyFilter(); toModules(); }
    }
    function last() {
      if (window.MXPlatform && window.MXPlatform.configured) { window.MXPlatform.isSignedIn() ? window.MXPlatform.openDashboard() : window.MXPlatform.openAuth('signin'); }
      else { var t = $('#themeStudioBtn'); if (t) t.click(); }
    }
    var configured = window.MXPlatform && window.MXPlatform.configured;
    var items = [['home', 'Home', 'i-dash', toHome], ['mods', 'Modules', 'i-layers', toModules], ['learn', 'Learning', 'i-graph', toLearning], [configured ? 'acct' : 'theme', configured ? 'Account' : 'Themes', configured ? 'i-user' : 'i-palette', last]];
    tabbar = h('nav', { class: 'mx-tabbar', 'aria-label': 'Quick navigation' });
    items.forEach(function (it, i) { tabbar.appendChild(h('button', { type: 'button', class: 'mx-tab-i', 'data-t': it[0], 'aria-current': i === 0 ? 'true' : null, onclick: go(it[3]) }, icon(it[2]), h('span', { text: it[1] }))); });
    doc.body.appendChild(tabbar);
    function mark() { $$('.mx-tab-i', tabbar).forEach(function (b) { b.removeAttribute('aria-current'); }); var home = doc.body.getAttribute('data-page') === 'home'; var b = $('[data-t="home"]', tabbar); if (home && b) b.setAttribute('aria-current', 'true'); }
    new MutationObserver(mark).observe(doc.body, { attributes: true, attributeFilter: ['data-page'] }); mark();
  }

  function init() {
    buildStrip(); buildFind(); decorateCards(); buildFooter();
    new MutationObserver(onPage).observe(doc.body, { attributes: true, attributeFilter: ['data-page'] });
    window.addEventListener('storage', function (e) { if (e.key === 'mxSaved' || e.key === 'mxActivity') { decorateCards(); applyFilter(); } });
    /* keep saved/recent indicators live when the platform layer changes state */
    var tries = 0;
    (function hook() {
      if (window.MXPlatform && window.MXPlatform.onChange) { window.MXPlatform.onChange(function () { decorateCards(); if (cat === 'saved' || cat === 'recent') applyFilter(); else refreshChipCounts(); }); buildTabbar(); }
      else if (tries++ < 40) setTimeout(hook, 100); else buildTabbar();
    })();
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
