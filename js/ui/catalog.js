import { esc, icons, openSheet, toast } from './dom.js';
import { addItem, setQty, getQty, totalQty } from '../list.js';
import { logoHTML, slugify } from '../brands.js';
import { DEPT_EMOJI } from '../i18n.js';
import { thumbHTML, parseId } from './list.js';

// Departments that drill Brand → models (the rest drill Subcategory → models grouped by brand).
const BRAND_FIRST = new Set(['cameras', 'lenses']);
// Preferred hero image per department (first matching product with an image wins).
const HERO = { cameras: /alexa 35$|fx6|venice/i, lenses: /supreme prime|cooke|s7/i, video: /smallhd|ultra 7|bolt/i, grip: /doorway dolly|dolly|slider/i, accessories: /matte ?box|mb-?\d|filter/i };

let st = { pid: null, q: '', view: 'depts', dept: null, subcat: null, brand: null, sub: null };

export function render(ctx, { id }, root) {
  const { store, t, catalog } = ctx;
  if (st.pid !== id) st = { pid: id, q: '', view: 'depts', dept: null, subcat: null, brand: null, sub: null };
  const lang = ctx.lang();
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
        <div class="sub">${showBrand && p.brand ? `<span class="brandname">${esc(p.brandName)}</span>` : ''}${sub ? `<span class="chip">${esc(subName(sub))}</span>` : ''}${p.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}</div></div>
      ${q ? `<div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${q}</span><button class="plus" data-d="1" aria-label="+">+</button></div>` : `<button class="addbtn" data-d="1" aria-label="${t('add')}">+</button>`}
    </div>`;
  };
  // Products grouped under a brand header (logo + full name + count), brands ordered by count desc.
  const groupedByBrand = (prods) => {
    const groups = new Map();
    for (const p of prods) { const k = p.brand || '__none'; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(p); }
    const order = [...groups.entries()].sort((a, b) => (a[0] === '__none') - (b[0] === '__none') || b[1].length - a[1].length);
    return order.map(([k, list]) => `
      <section class="bgroup">
        <div class="bgroup-head">${k === '__none' ? `<span class="brandname">${t('no_brand')}</span>` : `${logoHTML(k, catalog.brandName(k), 'row')}<span class="brandname">${esc(catalog.brandName(k))}</span>`}<span class="count">${list.length}</span></div>
        ${list.map(p => productRow(p, { showBrand: false })).join('')}
      </section>`).join('');
  };
  const brandGrid = (brands) => `<div class="brand-grid">${brands.map(b => `<div class="brand-tile" data-brand="${esc(b.id)}">${logoHTML(b.id, b.name, 'tile')}<span class="n">${esc(b.name)}</span><span class="c">${t('models_count', { n: b.count })}</span></div>`).join('')}</div>`;
  const brandsIn = (prods) => {
    const m = new Map();
    for (const p of prods) if (p.brand) m.set(p.brand, (m.get(p.brand) || 0) + 1);
    return [...m].map(([id, count]) => ({ id, name: catalog.brandName(id), count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  const manualCTA = `<button class="btn block ghost" data-manual style="margin-top:8px">${t('not_found_add_manual')}</button>`;
  const heroImage = (d) => { const list = catalog.byDept(d.id); return (list.find(p => p.image && HERO[d.slug]?.test(p.name)) || list.find(p => p.image))?.image || null; };

  // ---- content ----
  let content = '';
  let crumbs = '';
  if (st.q.length >= 1) {
    const res = catalog.search(st.q, { limit: 120 });
    content = (res.length ? groupedByBrand(res) : `<div class="empty"><p>${t('no_results', { q: esc(st.q) })}</p></div>`) + manualCTA;
  } else if (st.view === 'brands' && !st.brand) {
    content = brandGrid(catalog.brands);
  } else if (st.view === 'brands' && st.brand) {
    const all = catalog.byBrand(st.brand);
    const depts = catalog.departments.filter(d => all.some(p => p.dept === d.id));
    const prods = all.filter(p => !st.dept || p.dept === st.dept);
    crumbs = `<div class="crumbs"><button data-crumb="brands">${t('brands')}</button>${arrow}<span>${esc(catalog.brandName(st.brand))}</span></div>`;
    content = `${depts.length > 1 ? `<div class="chips"><button class="${st.dept ? '' : 'active'}" data-chip="">${t('all')}</button>${depts.map(d => `<button class="${st.dept === d.id ? 'active' : ''}" data-chip="${d.id}">${DEPT_EMOJI[d.slug]} ${esc(deptName(d))}</button>`).join('')}</div>` : ''}
      <div class="brand-hero">${logoHTML(st.brand, catalog.brandName(st.brand), 'tile')}<div><b>${esc(catalog.brandName(st.brand))}</b><small>${t('models_count', { n: prods.length })}</small></div></div>
      ${prods.map(p => productRow(p, { showBrand: false })).join('')}${manualCTA}`;
  } else if (!st.dept) {
    content = `<div class="dept-grid">${catalog.departments.map(d => { const img = heroImage(d); return `<div class="dept-card" data-dept="${d.id}" ${img ? `style="--img:url('${esc(img)}')"` : ''}><div class="dept-card-body"><span class="emoji">${DEPT_EMOJI[d.slug]}</span><h3>${esc(deptName(d))}</h3><div class="n">${catalog.byDept(d.id).length} ${t('products')}</div></div></div>`; }).join('')}</div>`;
  } else {
    const d = catalog.deptById(st.dept);
    const deptProds = catalog.byDept(st.dept);
    if (BRAND_FIRST.has(d.slug)) {
      if (!st.brand) {
        crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<span>${esc(deptName(d))}</span></div>`;
        content = `<div class="section-title">${t('choose_brand')}</div>${brandGrid(brandsIn(deptProds))}`;
      } else {
        const all = deptProds.filter(p => p.brand === st.brand);
        const subs = catalog.subcatsOf(st.dept).filter(s => all.some(p => p.subcats.includes(s.id)));
        const prods = st.sub ? all.filter(p => p.subcats.includes(st.sub)) : all;
        crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<button data-crumb="dept">${esc(deptName(d))}</button>${arrow}<span>${esc(catalog.brandName(st.brand))}</span></div>`;
        content = `<div class="brand-hero">${logoHTML(st.brand, catalog.brandName(st.brand), 'tile')}<div><b>${esc(catalog.brandName(st.brand))}</b><small>${esc(deptName(d))} · ${t('models_count', { n: prods.length })}</small></div></div>
          ${subs.length > 1 ? `<div class="chips"><button class="${st.sub ? '' : 'active'}" data-sub-chip="">${t('all')}</button>${subs.map(s => `<button class="${st.sub === s.id ? 'active' : ''}" data-sub-chip="${s.id}">${esc(subName(s))}</button>`).join('')}</div>` : ''}
          ${prods.map(p => productRow(p, { showBrand: false })).join('')}${manualCTA}`;
      }
    } else if (!st.subcat) {
      crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<span>${esc(deptName(d))}</span></div>`;
      content = `<div class="section-title">${t('choose_subcat')}</div><div class="sub-list">${catalog.subcatsOf(st.dept).map(s => `<div class="card" data-sub="${s.id}"><b>${esc(subName(s))}</b><span class="n">${catalog.bySubcat(s.id).length}</span></div>`).join('')}</div>`;
    } else {
      const s = d.subcategories.find(x => x.id === st.subcat);
      crumbs = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<button data-crumb="dept">${esc(deptName(d))}</button>${arrow}<span>${esc(subName(s))}</span></div>`;
      content = groupedByBrand(catalog.bySubcat(st.subcat)) + manualCTA;
    }
  }

  root.innerHTML = `
    <div class="search"><div class="field"><span>🔍</span><input type="search" value="${esc(st.q)}" placeholder="${t('search_placeholder')}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" data-q>${st.q ? `<button class="clear" data-clear aria-label="clear">×</button>` : ''}</div>
      ${st.q || st.dept || st.brand ? '' : `<div class="tabs"><button class="${st.view === 'depts' ? 'active' : ''}" data-tab="depts">${t('departments')}</button><button class="${st.view === 'brands' ? 'active' : ''}" data-tab="brands">${t('all_brands')}</button></div>`}
    </div>
    ${crumbs}
    <div data-content>${content}</div>
    <div class="bottombar"><button class="btn primary" data-done>${icons.check}${t('back_to_list', { n: totalQty(items()) })}</button></div>`;

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

  root.querySelector('[data-manual]')?.addEventListener('click', () => openSheet({
    title: t('manual_item'),
    bodyHTML: `<div class="form">
      <label>${t('item_name')}<input name="name" value="${esc(st.q)}" autocomplete="off" required></label>
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
  }));
}
