import { esc, icons } from './dom.js';
import { groupByDept, setQty, setNote, totalQty } from '../list.js';
import { logoHTML } from '../brands.js';
import { displayName, formatDateRange } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { editProjectSheet } from './projects.js';
import { presetCatalog } from './catalog.js';

const collapsed = new Set();

export const thumbHTML = (p, key) => `<div class="thumb"><span>${DEPT_EMOJI[key] || '📦'}</span>${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
export const parseId = (s) => (/^\d+$/.test(s) ? Number(s) : s);

// Camera profile summary chips (mount · sensor · media · battery)
export function profileChips(prof, t) {
  if (!prof) return '';
  const chips = [];
  if (prof.mount?.length) chips.push(`${t('mount')}: ${prof.mount.join(' / ')}`);
  if (prof.format) chips.push(t(`fmt_${prof.format}`));
  if (prof.media?.length) chips.push(prof.media.join(' / '));
  if (prof.battery?.length) chips.push(prof.battery.join(' / '));
  return chips.map(c => `<span class="pchip">${esc(c)}</span>`).join('');
}

export function render(ctx, { id }, root) {
  const { store, t, compat } = ctx;
  const p = store.getProject(id);
  const n = totalQty(p.items);
  ctx.setTopbar({
    title: `${esc(p.name || t('untitled'))}<small>${[p.techManager, formatDateRange(p.dateFrom, p.dateTo)].filter(Boolean).map(esc).join(' · ')}</small>`,
    back: '#/',
    right: [
      { text: n, label: t('items_count', { n }), onClick: () => {} },
      { icon: icons.edit, label: t('rename'), onClick: () => editProjectSheet(ctx, id) },
    ],
  });

  const active = p.buildCameraId != null ? ctx.resolve(p.buildCameraId) : null;
  const activeProf = active ? compat.profileFor(active) : null;
  const groups = groupByDept(p.items, ctx.resolve, ctx.deptOrder());

  const buildBtn = (product) => {
    if (!compat.isCamera(product) || !compat.profileFor(product)) return '';
    const isActive = p.buildCameraId === product.id;
    return `<button class="buildbtn ${isActive ? 'active' : ''}" data-build="${esc(product.id)}">${isActive ? `✓ ${t('active_camera')}` : `⚙ ${t('build_around')}`}</button>`;
  };

  const body = groups.map(g => `
    <section class="group ${collapsed.has(g.key) ? 'collapsed' : ''}" data-key="${g.key}">
      <div class="group-head"><span class="emoji">${DEPT_EMOJI[g.key]}</span><h2>${t(`dept_${g.key}`)}</h2><span class="count">${g.entries.reduce((s, e) => s + e.item.qty, 0)}</span><span class="chev">${icons.chev}</span></div>
      <div class="group-body">${g.entries.map(({ item, product }) => `
        <div class="row ${p.buildCameraId === product.id ? 'is-build' : ''}" data-pid="${esc(item.productId)}">
          ${thumbHTML(product, g.key)}
          <div class="body">
            <div class="name">${esc(displayName(product))}</div>
            <div class="sub">${logoHTML(product.brand, product.brandName, 'row')}${product.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}${buildBtn(product)}</div>
            <input class="note" value="${esc(item.note)}" placeholder="${t('note_placeholder')}" data-note>
          </div>
          <div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${item.qty}</span><button class="plus" data-d="1" aria-label="+">+</button></div>
        </div>`).join('')}</div>
    </section>`).join('');

  // Base kit checklist for the active camera
  let kitHTML = '';
  if (active && activeProf) {
    const slots = compat.kitStatus(activeProf, p.items, ctx.resolve);
    const lang = ctx.lang();
    kitHTML = `<section class="kit">
      <div class="kit-head">
        ${thumbHTML(active, 'cameras')}
        <div class="kit-title"><small>${t('base_kit')} · ${t('building_around')}</small><b dir="auto">${esc(displayName(active))}</b><div class="pchips">${profileChips(activeProf, t)}</div></div>
        <button class="iconbtn" data-clear-build aria-label="${t('clear_build')}" title="${t('clear_build')}">×</button>
      </div>
      <div class="slots">${slots.map(s => `
        <div class="slot ${s.done ? 'done' : ''}" data-slot="${esc(s.slot)}">
          <span class="slot-check">${s.done ? '✓' : ''}</span>
          <span class="slot-label">${esc(lang === 'he' ? s.he : s.en)}${s.missing?.length ? `<small class="slot-warn">⚠ ${t('no_reader_short', { fam: esc(s.missing.join(' / ')) })}</small>` : ''}</span>
          <span class="slot-have">${s.have} / ${s.qty}</span>
          <button class="btn sm ${s.done ? 'ghost' : ''}" data-choose="${esc(s.slot)}">${s.done ? '+' : t('choose')}</button>
        </div>`).join('')}</div>
    </section>`;
  }

  root.innerHTML = (groups.length ? body : `<div class="empty"><div class="big">🧰</div><h2>${t('list_empty')}</h2><p>${t('list_empty_hint')}</p></div>`) + kitHTML;
  root.insertAdjacentHTML('beforeend', `<div class="bottombar"><button class="btn primary" data-add>${icons.plus}${t('add_gear')}</button><button class="btn" data-export ${n ? '' : 'disabled'}>${icons.share}${t('export')}</button></div>`);

  root.querySelector('[data-add]').onclick = () => ctx.navigate(`#/p/${id}/add`);
  root.querySelector('[data-export]').onclick = () => ctx.navigate(`#/p/${id}/export`);
  root.querySelectorAll('.group-head').forEach(h => { h.onclick = () => { const k = h.parentElement.dataset.key; collapsed.has(k) ? collapsed.delete(k) : collapsed.add(k); h.parentElement.classList.toggle('collapsed'); }; });
  root.querySelectorAll('[data-build]').forEach(b => { b.onclick = () => { const pid = parseId(b.dataset.build); store.setBuildCamera(id, p.buildCameraId === pid ? null : pid); ctx.render(); }; });
  root.querySelector('[data-clear-build]')?.addEventListener('click', () => { store.setBuildCamera(id, null); ctx.render(); });
  root.querySelectorAll('[data-choose]').forEach(b => { b.onclick = () => {
    const slot = compat.kitStatus(activeProf, p.items, ctx.resolve).find(s => s.slot === b.dataset.choose);
    presetCatalog({ dept: slot.deptId, subcat: slot.subId, strict: true, kind: slot.kind || null });
    ctx.navigate(`#/p/${id}/add`);
  }; });

  root.querySelectorAll('.row').forEach(row => {
    const productId = parseId(row.dataset.pid);
    row.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => {
      const cur = store.getProject(id).items.find(i => i.productId === productId)?.qty || 0;
      const next = cur + Number(b.dataset.d);
      store.setItems(id, setQty(store.getProject(id).items, productId, next));
      if (next <= 0) { if (p.buildCameraId === productId) store.setBuildCamera(id, null); ctx.render(); } else { row.querySelector('.q').textContent = next; syncCounts(); }
    }; });
    const note = row.querySelector('[data-note]');
    note.onchange = () => store.setItems(id, setNote(store.getProject(id).items, productId, note.value.trim()));
    note.onkeydown = (e) => { if (e.key === 'Enter') note.blur(); };
  });

  function syncCounts() {
    const items = store.getProject(id).items;
    const total = totalQty(items);
    const badge = document.querySelector('#topbar [data-r="0"]');
    if (badge) badge.textContent = total;
    groupByDept(items, ctx.resolve, ctx.deptOrder()).forEach(g => { const c = root.querySelector(`.group[data-key="${g.key}"] .count`); if (c) c.textContent = g.entries.reduce((s, e) => s + e.item.qty, 0); });
    if (activeProf) compat.kitStatus(activeProf, items, ctx.resolve).forEach(s => { const el = root.querySelector(`.slot[data-slot="${s.slot}"]`); if (!el) return; el.classList.toggle('done', s.done); el.querySelector('.slot-have').textContent = `${s.have} / ${s.qty}`; el.querySelector('.slot-check').textContent = s.done ? '✓' : ''; });
  }
}
