import { esc, icons, openSheet, toast } from './dom.js';
import { addItem, setQty, getQty, totalQty } from '../list.js';
import { logoHTML, slugify } from '../brands.js';
import { DEPT_EMOJI } from '../i18n.js';
import { thumbHTML, parseId, profileChips } from './list.js';

// Departments that drill Brand → models (the rest drill Subcategory → models grouped by brand).
const BRAND_FIRST = new Set(['cameras', 'lenses', 'tripods']);
// Preferred hero image per department (first matching product with an image wins).
const HERO = { cameras: /alexa 35$|fx6|venice/i, lenses: /supreme prime|cooke|s7/i, video: /smallhd|ultra 7|bolt/i, tripods: /o'?connor|sachtler|fluid head/i, grip: /doorway dolly|dolly|slider/i, power: /v-?mount|battery/i, accessories: /matte ?box|mb-?\d|filter/i };

let st = { pid: null, q: '', view: 'depts', dept: null, subcat: null, brand: null, sub: null };
let preset = null;      // set by the list screen's kit slots before navigating here
let compatOnly = true;  // "compatible only" toggle (per session)
let strict = false;     // entered from a kit slot: show ONLY items that fit the active camera (no neutral/unknown noise)
let kind = null;        // kit slot kind (card / reader / battery / charger) — restricts the list to that kind
export function presetCatalog(o) { preset = o; }

export function render(ctx, { id }, root) {
  const { store, t, catalog } = ctx;
  if (st.pid !== id) st = { pid: id, q: '', view: 'depts', dept: null, subcat: null, brand: null, sub: null };
  if (preset) { st = { pid: id, q: '', view: 'depts', dept: preset.dept ?? null, subcat: preset.subcat ?? null, brand: null, sub: null }; strict = !!preset.strict; kind = preset.kind || null; compatOnly = true; preset = null; }
  const lang = ctx.lang();
  const { compat } = ctx;
  const project = store.getProject(id);
  const active = project.buildCameraId != null ? ctx.resolve(project.buildCameraId) : null;
  const prof = active ? compat.profileFor(active) : null;
  const verdicts = new Map();
  const chosenMedia = prof ? compat.chosenMedia(prof, project.items, ctx.resolve) : [];
  const verdictOf = (p) => { if (!verdicts.has(p.id)) verdicts.set(p.id, prof ? compat.verdict(p, prof, { chosenMedia }) : { status: 'neutral' }); return verdicts.get(p.id); };
  const grade = (p) => verdictOf(p).status;
  let hidden = 0;
  const RANK = { native: 0, adapter: 1, partial: 2, neutral: 3, unknown: 4, no: 5 };
  // Strict (kit slot): only graded-compatible items. Normal build mode: hide "no" only. Always sort best fit first.
  // In strict mode "neutral" items (monitors, heads…) stay only when nothing in the list is graded — otherwise
  // e.g. a media slot would still show readers/recorders next to the matching cards.
  const visible = (list) => {
    if (!prof || !compatOnly) return list;
    if (strict && kind) list = list.filter(p => verdictOf(p).kind === kind);
    const graded = strict && list.some(p => RANK[grade(p)] <= 2);
    // Strict with nothing graded (monitors, heads…): keep everything that isn't a hard "no".
    const fits = (g) => (strict ? RANK[g] <= 2 || (!graded && g !== 'no') : g !== 'no');
    const out = list.filter(p => fits(grade(p)));
    return out.map((p, i) => [RANK[grade(p)] * 100 + (verdictOf(p).pref ?? 50), i, p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  };
  // shown(): the list that is actually rendered — the hidden counter is derived from it alone.
  const shown = (list) => { const out = visible(list); hidden = list.length - out.length; return out; };
  const TAG = { native: ['ok', '✓ ' + t('tag_native')], adapter: ['adp', '↻ ' + t('tag_adapter')], partial: ['warn', '⚠ ' + t('tag_partial')], unknown: ['dim', t('tag_unknown')], no: ['bad', '✕ ' + t('tag_no')] };
  const tagHTML = (p) => { if (!prof) return ''; const g = grade(p); return TAG[g] ? `<span class="ctag ${TAG[g][0]}">${TAG[g][1]}</span>` : ''; };
  const items = () => store.getProject(id).items;
  const rerender = () => render(ctx, { id }, root);
  const deptName = (d) => (lang === 'he' ? d.he : d.en);
  const subName = (s) => (lang === 'he' ? s.he : s.en);
  const allSubcats = catalog.departments.flatMap(d => d.subcategories);
  const subOf = (p) => p.subcats.map(sid => allSubcats.find(s => s.id === sid)).filter(Boolean)[0];
  const arrow = `<span class="arrow">›</span>`;

  const back = () => {
    if (st.q) return () => { st.q = ''; rerender(); };
    if (st.brand && st.dept) return () => { st.brand = null; st.sub = null; rerender(); };
    if (st.brand) return () => { st.brand = null; rerender(); };
    if (st.subcat) return () => { st.subcat = null; rerender(); };
    if (st.dept) return () => { st.dept = null; rerender(); };
    return `#/p/${id}`;
  };
  ctx.setTopbar({ title: esc(t('add_gear')), back: back() });

  // ---- row / group renderers ----
  const productRow = (p, { showBrand = true } = {}) => {
    const q = getQty(items(), p.id);
    const sub = subOf(p);
    return `<div class="row ${q ? 'in-list' : ''}" data-pid="${esc(p.id)}">
      ${thumbHTML(p, catalog.deptKey(p.dept))}
      <div class="body"><div class="name" dir="auto">${esc(p.name)}</div>
        <div class="sub">${showBrand && p.brand ? `<span class="brandname">${esc(p.brandName)}</span>` : ''}${sub ? `<span class="chip">${esc(subName(sub))}</span>` : ''}${p.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}${tagHTML(p)}</div></div>
      ${q ? `<div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${q}</span><button class="plus" data-d="1" aria-label="+">+</button></div>` : `<button class="addbtn" data-d="1" aria-label="${t('add')}">+</button>`}
    </div>`;
  };
  // Products grouped under a brand header (logo + full name + count), brands ordered by count desc.
  const groupedByBrand = (prods) => {
    // Kit slots for cards/readers/batteries/chargers group by family (CFexpress A, SD, BP-U…) in the camera's preference order.
    if (strict && kind && prof) {
      const groups = new Map();
      for (const p of prods) { const k = verdictOf(p).family || '—'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
      const prefOf = (k) => { const i = [...(prof.media || []), ...(prof.battery || [])].indexOf(k); return i < 0 ? 99 : i; };
      const order = [...groups.entries()].sort((a, b) => prefOf(a[0]) - prefOf(b[0]));
      return order.map(([k, list]) => `
        <section class="bgroup">
          <div class="bgroup-head"><span class="brandname">${esc(k)}</span><span class="count">${list.length}</span></div>
          ${list.map(p => productRow(p, { showBrand: true })).join('')}
        </section>`).join('');
    }
    const groups = new Map();
    for (const p of prods) { const k = p.brand || '__none'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    const order = [...groups.entries()].sort((a, b) => (a[0] === '__none') - (b[0] === '__none') || b[1].length - a[1].length);
    return order.map(([k, list]) => `
      <section class="bgroup">
        <div class="bgroup-head" id="bg-${esc(k)}">${k === '__none' ? `<span class="brandname">${t('no_brand')}</span>` : logoHTML(k, catalog.brandName(k), 'head')}<span class="count">${list.length}</span></div>
        ${list.map(p => productRow(p, { showBrand: false })).join('')}
      </section>`).join('') + brandRail(order.map(([k]) => k));
  };
  // Side rail of brand shortcuts for long grouped lists — tap to jump to that brand's header.
  const brandRail = (keys) => (keys.length < 4 ? '' : `<nav class="rail" aria-label="${t('jump_to_brand')}">${keys.map(k => `<button data-jump="bg-${esc(k)}" title="${esc(k === '__none' ? t('no_brand') : catalog.brandName(k))}">${k === '__none' ? `<span class="logo logo-mini logo-text" style="--bg:var(--surface-3);--fg:var(--muted)">…</span>` : logoHTML(k, catalog.brandName(k), 'mini')}</button>`).join('')}</nav>`);
  const brandGrid = (brands) => `<div class="brand-grid">${brands.map(b => `<div class="brand-tile" data-brand="${esc(b.id)}">${logoHTML(b.id, b.name, 'tile')}<span class="c">${t('models_count', { n: b.count })}</span></div>`).join('')}</div>`;
  const brandsIn = (prods) => {
    const m = new Map();
    for (const p of prods) if (p.brand) m.set(p.brand, (m.get(p.brand) || 0) + 1);
    return [...m].map(([id, count]) => ({ id, name: catalog.brandName(id), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  const manualCTA = `<button class="btn block ghost" data-manual style="margin-top:8px">${t('not_found_add_manual')}</button>`;
  const SUGGEST_READER = { 'CFexpress A': 'Sony MRW-G2 CFexpress Type A / SD Card Reader', 'CFexpress B': 'ProGrade CFexpress Type B Card Reader', 'CFast': 'CFast 2.0 Card Reader', 'XQD': 'Sony MRW-E90 XQD Card Reader', 'SxS': 'Sony SBAC-US30 SxS Card Reader', 'AXS': 'Sony AXS-CR1 Card Reader', 'Codex': 'Codex Compact Drive Dock', 'SD': 'SD UHS-II Card Reader', 'microSD': 'microSD Card Reader', 'P2': 'Panasonic AU-XPD1 P2 Card Reader', 'RED MINI-MAG': 'RED Station Mini-Mag', 'SSD': 'USB-C SSD Dock' };
  let manualPrefill = '';
  const readerNote = () => {
    const wanted = chosenMedia.length ? chosenMedia : (prof.media || []);
    const missing = wanted.filter(f => !compat.readersFor(f).length);
    if (!missing.length) return '';
    return `<div class="card note-missing"><b>${t('no_reader_at_utopia', { fam: esc(missing.join(' / ')) })}</b><p>${t('no_reader_hint')}</p>${missing.map(f => `<button class="btn sm" data-manual-reader="${esc(SUGGEST_READER[f] || f + ' Card Reader')}">＋ ${esc(SUGGEST_READER[f] || f + ' Card Reader')}</button>`).join(' ')}</div>`;
  };
  const heroImage = (d) => { const list = catalog.byDept(d.id); return (list.find(p => p.image && HERO[d.slug]?.test(p.name)) || list.find(p => p.image))?.image || null; };

  // ---- content ----
  let content = '';
  let crumbs = '';
  if (st.q.length >= 1) {
    const res = shown(catalog.search(st.q, { limit: 160 }));
    content = (res.length ? groupedByBrand(res) : `<div class="empty"><p>${t('no_results', { q: esc(st.q) })}</p></div>`) + manualCTA;
  } else if (st.view === 'brands' && !st.brand) {
    content = brandGrid(catalog.brands);
  } else if (st.view === 'brands' && st.brand) {
    const all = catalog.byBrand(st.brand);
    const depts = catalog.departments.filter(d => visible(all).some(p => p.dept === d.id));
    const prods = shown(all.filter(p => !st.dept || p.dept === st.dept));
    crumbs = `<div class="crumbs"><button data-crumb="brands">${t('brands')}</button>${arrow}<span>${esc(catalog.brandName(st.brand))}</span></div>`;
    content = `${depts.length > 1 ? `<div class="chips"><button class="${st.dept ? '' : 'active'}" data-chip="">${t('all')}</button>${depts.map(d => `<button class="${st.dept === d.id ? 'active' : ''}" data-chip="${d.id}">${DEPT_EMOJI[d.slug]} ${esc(deptName(d))}</button>`).join('')}</div>` : ''}
      <div class="brand-hero">${logoHTML(st.brand, catalog.brandName(st.brand), 'tile')}<div><small>${t('models_count', { n: prods.length })}</small></div></div>
      ${prods.map(p => productRow(p, { showBrand: false })).join('')}${manualCTA}`;
  } else if (!st.dept) {
    content = `<div class="dept-grid">${catalog.departments.map(d => { const img = heroImage(d); return `<div class="dept-card" data-dept="${d.id}" ${img ? `style="--img:url('${esc(img)}')"` : ''}><div class="dept-card-body"><span class="emoji">${DEPT_EMOJI[d.slug]}</span><h3>${esc(deptName(d))}</h3><div class="n">${catalog.byDept(d.id).length} ${t('products')}</div></div></div>`; }).join('')}</div>`;
  } else {
    const d = catalog.deptById(st.dept);
    const deptProds = visible(catalog.byDept(st.dept));
    if (BRAND_FIRST.has(d.slug)) {
      if (!st.brand) {
        crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<span>${esc(deptName(d))}</span></div>`;
        content = `<div class="section-title">${t('choose_brand')}</div>${brandGrid(brandsIn(deptProds))}`;
      } else {
        const all = deptProds.filter(p => p.brand === st.brand);
        const subs = catalog.subcatsOf(st.dept).filter(s => all.some(p => p.subcats.includes(s.id)));
        const prods = shown(st.sub ? all.filter(p => p.subcats.includes(st.sub)) : all);
        crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<button data-crumb="dept">${esc(deptName(d))}</button>${arrow}<span>${esc(catalog.brandName(st.brand))}</span></div>`;
        content = `<div class="brand-hero">${logoHTML(st.brand, catalog.brandName(st.brand), 'tile')}<div><small>${esc(deptName(d))} · ${t('models_count', { n: prods.length })}</small></div></div>
          ${subs.length > 1 ? `<div class="chips"><button class="${st.sub ? '' : 'active'}" data-sub-chip="">${t('all')}</button>${subs.map(s => `<button class="${st.sub === s.id ? 'active' : ''}" data-sub-chip="${s.id}">${esc(subName(s))}</button>`).join('')}</div>` : ''}
          ${prods.map(p => productRow(p, { showBrand: false })).join('')}${manualCTA}`;
      }
    } else if (!st.subcat) {
      crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<span>${esc(deptName(d))}</span></div>`;
      content = `<div class="section-title">${t('choose_subcat')}</div><div class="sub-list">${catalog.subcatsOf(st.dept).map(s => `<div class="card" data-sub="${s.id}"><b>${esc(subName(s))}</b><span class="n">${visible(catalog.bySubcat(s.id)).length}</span></div>`).join('')}</div>`;
    } else {
      const s = d.subcategories.find(x => x.id === st.subcat);
      crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<button data-crumb="dept">${esc(deptName(d))}</button>${arrow}<span>${esc(subName(s))}</span></div>`;
      content = groupedByBrand(shown(catalog.bySubcat(st.subcat))) + manualCTA;
    }
  }

  root.innerHTML = `
    <div class="search"><div class="field"><span>🔍</span><input type="search" value="${esc(st.q)}" placeholder="${t('search_placeholder')}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" data-q>${st.q ? `<button class="clear" data-clear aria-label="clear">×</button>` : ''}</div>
      ${prof ? `<div class="cbar"><div class="thumb">${active.image ? `<img src="${esc(active.image)}" alt="">` : '📷'}</div><div class="cbar-body"><small>${t('building_around')}</small><b dir="auto">${esc(active.name)}</b><div class="pchips">${profileChips(prof, t)}</div></div><label class="cbar-toggle"><input type="checkbox" data-compat-only ${compatOnly ? 'checked' : ''}><span>${t('compat_only')}</span></label></div>` : ''}
      ${st.q || st.dept || st.brand ? '' : `<div class="tabs"><button class="${st.view === 'depts' ? 'active' : ''}" data-tab="depts">${t('departments')}</button><button class="${st.view === 'brands' ? 'active' : ''}" data-tab="brands">${t('all_brands')}</button></div>`}
    </div>
    ${crumbs}
    ${strict && kind === 'reader' && prof ? readerNote() : ''}
    <div data-content>${content}${hidden && compatOnly ? `<p class="hidden-note">${strict ? t('strict_note', { n: hidden, cam: esc(active.name) }) : t('hidden_count', { n: hidden })} · <button data-show-all>${t('show_all_items')}</button></p>` : ''}</div>
    <div class="bottombar"><button class="btn primary" data-done>${icons.check}${t('back_to_list', { n: totalQty(items()) })}</button></div>`;

  root.classList.toggle('has-rail', !!root.querySelector('.rail'));
  root.style.setProperty('--search-h', root.querySelector('.search').offsetHeight + 'px');
  root.querySelector('[data-compat-only]')?.addEventListener('change', (e) => { compatOnly = e.target.checked; rerender(); });
  root.querySelector('[data-show-all]')?.addEventListener('click', () => { if (strict) { strict = false; kind = null; } else compatOnly = false; rerender(); });
  const input = root.querySelector('[data-q]');
  let timer;
  input.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      st.q = input.value.trim();
      const pos = input.selectionStart;
      rerender();
      const i2 = root.querySelector('[data-q]'); i2.focus(); try { i2.setSelectionRange(pos, pos); } catch { /* ignore */ }
    }, 120);
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') input.blur(); };
  root.querySelector('[data-clear]')?.addEventListener('click', () => { st.q = ''; rerender(); root.querySelector('[data-q]').focus(); });
  root.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { st.view = b.dataset.tab; st.dept = null; st.subcat = null; st.brand = null; st.sub = null; rerender(); }; });
  root.querySelectorAll('[data-dept]').forEach(c => { c.onclick = () => { st.dept = Number(c.dataset.dept); st.brand = null; st.subcat = null; st.sub = null; rerender(); }; });
  root.querySelectorAll('[data-sub]').forEach(c => { c.onclick = () => { st.subcat = Number(c.dataset.sub); rerender(); }; });
  root.querySelectorAll('[data-brand]').forEach(c => { c.onclick = () => { st.brand = c.dataset.brand; st.sub = null; if (st.view === 'brands') st.dept = null; rerender(); }; });
  root.querySelectorAll('[data-chip]').forEach(c => { c.onclick = () => { st.dept = c.dataset.chip ? Number(c.dataset.chip) : null; rerender(); }; });
  root.querySelectorAll('[data-sub-chip]').forEach(c => { c.onclick = () => { st.sub = c.dataset.subChip ? Number(c.dataset.subChip) : null; rerender(); }; });
  root.querySelectorAll('[data-crumb]').forEach(c => { c.onclick = () => {
    const k = c.dataset.crumb;
    if (k === 'root') { st.dept = null; st.subcat = null; st.brand = null; st.sub = null; }
    if (k === 'dept') { st.subcat = null; st.brand = null; st.sub = null; }
    if (k === 'brands') { st.brand = null; st.dept = null; }
    rerender();
  }; });
  root.querySelector('[data-done]').onclick = () => ctx.navigate(`#/p/${id}`);
  root.querySelectorAll('[data-jump]').forEach(b => { b.onclick = () => { const h = document.getElementById(b.dataset.jump); if (!h) return; const y = h.getBoundingClientRect().top + window.scrollY - (document.getElementById('topbar').offsetHeight + 70); window.scrollTo({ top: y, behavior: 'smooth' }); }; });

  const bindRow = (row) => {
    const productId = parseId(row.dataset.pid);
    const showBrand = !!row.querySelector('.brandname');
    row.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => {
      const p = catalog.byId(productId);
      const cur = getQty(items(), productId); const next = cur + Number(b.dataset.d);
      store.setItems(id, cur ? setQty(items(), productId, next) : addItem(items(), p, 1));
      const fresh = document.createElement('template'); fresh.innerHTML = productRow(catalog.byId(productId), { showBrand });
      const nr = fresh.content.firstElementChild; row.replaceWith(nr); bindRow(nr);
      root.querySelector('[data-done]').innerHTML = `${icons.check}${t('back_to_list', { n: totalQty(items()) })}`;
      if (!cur) toast(t('added'), { kind: 'ok', ms: 900 });
    }; });
  };
  root.querySelectorAll('.row').forEach(bindRow);

  const openManual = () => openSheet({
    title: t('manual_item'),
    bodyHTML: `<div class="form">
      <label>${t('item_name')}<input name="name" value="${esc(manualPrefill || st.q)}" autocomplete="off" required></label>
      <label>${t('brand')}<input name="brand" list="brand-list" autocomplete="off" value="${st.brand ? esc(catalog.brandName(st.brand)) : ''}"><datalist id="brand-list">${catalog.brands.map(b => `<option value="${esc(b.name)}">`).join('')}</datalist></label>
      <label>${t('department')}<select name="dept">${catalog.departments.map(d => `<option value="${d.id}" ${st.dept === d.id ? 'selected' : ''}>${esc(deptName(d))}</option>`).join('')}<option value="other">${t('other')}</option></select></label>
    </div>`,
    actions: [{ label: t('cancel'), kind: 'ghost' }, { label: t('add'), kind: 'primary', onClick: (body) => {
      const name = body.querySelector('[name=name]').value.trim(); if (!name) { body.querySelector('[name=name]').focus(); return false; }
      const brandName = body.querySelector('[name=brand]').value.trim() || null;
      const deptV = body.querySelector('[name=dept]').value; const dept = deptV === 'other' ? 'other' : Number(deptV);
      const m = store.addManualProduct({ name, brand: brandName ? slugify(brandName) : null, brandName, dept });
      store.setItems(id, addItem(items(), catalog.byId(m.id) || { ...m, manual: true }, 1));
      st.q = ''; toast(t('added'), { kind: 'ok' }); rerender();
    } }],
    onOpen: (body) => body.querySelector('[name=name]').focus(),
  });
  root.querySelector('[data-manual]')?.addEventListener('click', () => { manualPrefill = ''; openManual(); });
  root.querySelectorAll('[data-manual-reader]').forEach(b => { b.onclick = () => { manualPrefill = b.dataset.manualReader; openManual(); }; });
}
