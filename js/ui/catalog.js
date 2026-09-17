import { esc, icons, openSheet, toast } from './dom.js';
import { addItem, setQty, getQty, totalQty } from '../list.js';
import { logoHTML, slugify } from '../brands.js';
import { displayName } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { thumbHTML, parseId } from './list.js';

let st = { pid: null, q: '', tab: 'depts', dept: null, subcat: null, brand: null };

export function render(ctx, { id }, root) {
  const { store, t, catalog } = ctx;
  if (st.pid !== id) st = { pid: id, q: '', tab: 'depts', dept: null, subcat: null, brand: null };
  const lang = ctx.lang();
  const items = () => store.getProject(id).items;
  const rerender = () => render(ctx, { id }, root);

  const backTarget = () => {
    if (st.q) return () => { st.q = ''; rerender(); };
    if (st.subcat) return () => { st.subcat = null; rerender(); };
    if (st.dept || st.brand) return () => { st.dept = null; st.brand = null; rerender(); };
    return `#/p/${id}`;
  };
  ctx.setTopbar({ title: esc(t('add_gear')), back: backTarget() });

  const deptName = (d) => (lang === 'he' ? d.he : d.en);
  const subName = (s) => (lang === 'he' ? s.he : s.en);
  const allSubcats = catalog.departments.flatMap(d => d.subcategories);
  const arrow = `<span class="arrow">›</span>`;

  const productRow = (p) => {
    const q = getQty(items(), p.id);
    const sub = p.subcats.map(sid => allSubcats.find(s => s.id === sid)).filter(Boolean)[0];
    return `<div class="row ${q ? 'in-list' : ''}" data-pid="${esc(p.id)}">
      ${thumbHTML(p, catalog.deptKey(p.dept))}
      <div class="body"><div class="name">${esc(displayName(p))}</div>
        <div class="sub">${logoHTML(p.brand, p.brandName, 'row')}${sub ? `<span class="chip">${esc(subName(sub))}</span>` : ''}${p.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}</div></div>
      ${q ? `<div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${q}</span><button class="plus" data-d="1" aria-label="+">+</button></div>` : `<button class="addbtn" data-d="1" aria-label="${t('add')}">+</button>`}
    </div>`;
  };
  const manualCTA = `<button class="btn block ghost" data-manual style="margin-top:8px">${t('not_found_add_manual')}</button>`;

  let content = '';
  if (st.q.length >= 1) {
    const res = catalog.search(st.q, { limit: 100 });
    content = res.length ? res.map(productRow).join('') : `<div class="empty"><p>${t('no_results', { q: esc(st.q) })}</p></div>`;
    content += manualCTA;
  } else if (st.tab === 'depts') {
    if (!st.dept) {
      content = `<div class="dept-grid">${catalog.departments.map(d => `<div class="dept-card" data-dept="${d.id}"><span class="emoji">${DEPT_EMOJI[d.slug]}</span><div><h3>${esc(deptName(d))}</h3><div class="n">${catalog.byDept(d.id).length} ${t('products')}</div></div></div>`).join('')}</div>`;
    } else if (!st.subcat) {
      const d = catalog.deptById(st.dept);
      content = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<span>${esc(deptName(d))}</span></div>
        <div class="sub-list">${catalog.subcatsOf(st.dept).map(s => `<div class="card" data-sub="${s.id}"><b>${esc(subName(s))}</b><span class="n">${catalog.bySubcat(s.id).length}</span></div>`).join('')}</div>`;
    } else {
      const d = catalog.deptById(st.dept); const s = d.subcategories.find(x => x.id === st.subcat);
      content = `<div class="crumbs"><button data-crumb="root">${t('departments')}</button>${arrow}<button data-crumb="dept">${esc(deptName(d))}</button>${arrow}<span>${esc(subName(s))}</span></div>` + catalog.bySubcat(st.subcat).map(productRow).join('') + manualCTA;
    }
  } else if (!st.brand) {
    content = `<div class="brand-grid">${catalog.brands.map(b => `<div class="brand-tile" data-brand="${esc(b.id)}">${logoHTML(b.id, b.name, 'tile')}<span class="n">${esc(b.name)} · ${b.count}</span></div>`).join('')}</div>`;
  } else {
    const all = catalog.byBrand(st.brand);
    const prods = all.filter(p => !st.dept || p.dept === st.dept);
    const depts = catalog.departments.filter(d => all.some(p => p.dept === d.id));
    content = `<div class="crumbs"><button data-crumb="brands">${t('brands')}</button>${arrow}<span>${logoHTML(st.brand, catalog.brandName(st.brand), 'row')} ${esc(catalog.brandName(st.brand))}</span></div>
      ${depts.length > 1 ? `<div class="chips"><button class="${st.dept ? '' : 'active'}" data-chip="">${t('all')}</button>${depts.map(d => `<button class="${st.dept === d.id ? 'active' : ''}" data-chip="${d.id}">${DEPT_EMOJI[d.slug]} ${esc(deptName(d))}</button>`).join('')}</div>` : ''}
      ${prods.map(productRow).join('')}${manualCTA}`;
  }

  root.innerHTML = `
    <div class="search"><div class="field"><span>🔍</span><input type="search" value="${esc(st.q)}" placeholder="${t('search_placeholder')}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" data-q>${st.q ? `<button class="clear" data-clear aria-label="clear">×</button>` : ''}</div>
      ${st.q ? '' : `<div class="tabs"><button class="${st.tab === 'depts' ? 'active' : ''}" data-tab="depts">${t('departments')}</button><button class="${st.tab === 'brands' ? 'active' : ''}" data-tab="brands">${t('brands')}</button></div>`}
    </div>
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
  root.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { st.tab = b.dataset.tab; st.dept = null; st.subcat = null; st.brand = null; rerender(); }; });
  root.querySelectorAll('[data-dept]').forEach(c => { c.onclick = () => { st.dept = Number(c.dataset.dept); rerender(); }; });
  root.querySelectorAll('[data-sub]').forEach(c => { c.onclick = () => { st.subcat = Number(c.dataset.sub); rerender(); }; });
  root.querySelectorAll('[data-brand]').forEach(c => { c.onclick = () => { st.brand = c.dataset.brand; st.dept = null; rerender(); }; });
  root.querySelectorAll('[data-chip]').forEach(c => { c.onclick = () => { st.dept = c.dataset.chip ? Number(c.dataset.chip) : null; rerender(); }; });
  root.querySelectorAll('[data-crumb]').forEach(c => { c.onclick = () => { const k = c.dataset.crumb; if (k === 'root') { st.dept = null; st.subcat = null; } if (k === 'dept') st.subcat = null; if (k === 'brands') { st.brand = null; st.dept = null; } rerender(); }; });
  root.querySelector('[data-done]').onclick = () => ctx.navigate(`#/p/${id}`);

  const bindRow = (row) => {
    const productId = parseId(row.dataset.pid);
    row.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => {
      const p = catalog.byId(productId);
      const cur = getQty(items(), productId); const next = cur + Number(b.dataset.d);
      store.setItems(id, cur ? setQty(items(), productId, next) : addItem(items(), p, 1));
      const fresh = document.createElement('template'); fresh.innerHTML = productRow(catalog.byId(productId));
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
      <label>${t('brand')}<input name="brand" list="brand-list" autocomplete="off"><datalist id="brand-list">${catalog.brands.map(b => `<option value="${esc(b.name)}">`).join('')}</datalist></label>
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
