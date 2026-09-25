import { esc, icons, toast, openSheet, confirmDialog } from './dom.js';
import { groupByDept, setQty, setNote, totalQty } from '../list.js';
import { brandText } from '../brands.js';
import { displayName, formatDateRange } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { deptIcon } from './icons-dept.js';
import { editProjectSheet } from './projects.js';
import { presetCatalog } from './catalog.js';

const collapsed = new Set();
let pickup = false; // prep day: the list turns into a check-off sheet

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
  const packed = p.packed || {};
  const packedQty = p.items.reduce((s, i) => s + Math.min(packed[i.productId] || 0, i.qty), 0);
  ctx.setTopbar({
    title: `${esc(p.name || t('untitled'))}<small>${[p.techManager, formatDateRange(p.dateFrom, p.dateTo)].filter(Boolean).map(esc).join(' · ')}</small>`,
    back: '#/',
    right: [
      { text: n, label: t('items_count', { n }), onClick: () => {} },
      { icon: icons.check || '☑', label: t('pickup_mode'), onClick: () => { pickup = !pickup; ctx.render(); } },
      { icon: icons.clock || '⟲', label: t('versions'), onClick: () => versionsSheet(ctx, id) },
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

  const tailHTML = (item) => {
    if (!pickup) return `<div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${item.qty}</span><button class="plus" data-d="1" aria-label="+">+</button></div>`;
    const have = Math.min(packed[item.productId] || 0, item.qty);
    return `<button class="packbtn ${have >= item.qty ? 'done' : ''}" data-pack aria-label="${t('pickup_mode')}"><span class="pk-check">${have >= item.qty ? '✓' : ''}</span><span class="pk-count">${have}/${item.qty}</span></button>`;
  };

  const body = groups.map(g => `
    <section class="group ${collapsed.has(g.key) ? 'collapsed' : ''}" data-key="${g.key}">
      <div class="group-head"><span class="dept-ico sm">${deptIcon(g.key)}</span><h2>${t(`dept_${g.key}`)}</h2><span class="count">${g.entries.reduce((s, e) => s + e.item.qty, 0)}</span><span class="chev">${icons.chev}</span></div>
      <div class="group-body">${g.entries.map(({ item, product }) => `
        <div class="row ${p.buildCameraId === product.id ? 'is-build' : ''} ${pickup && Math.min(packed[item.productId] || 0, item.qty) < item.qty ? 'unpacked' : ''}" data-pid="${esc(item.productId)}">
          ${thumbHTML(product, g.key)}
          <div class="body">
            <div class="name">${esc(displayName(product))}</div>
            <div class="sub">${brandText(product.brand, product.brandName)}${product.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}${product.extra ? `<span class="chip extra">${t('not_at_utopia_item')}</span>` : ''}${pickup ? '' : buildBtn(product)}</div>
            ${pickup ? (item.note ? `<div class="sub dim" dir="auto">${esc(item.note)}</div>` : '') : `<input class="note" value="${esc(item.note)}" placeholder="${t('note_placeholder')}" data-note>`}
          </div>
          ${tailHTML(item)}
        </div>`).join('')}</div>
    </section>`).join('');

  // Prep day banner: how much of the list is already in the truck.
  const pickHTML = !pickup ? '' : `<section class="card pickbar ${packedQty >= n && n ? 'done' : ''}">
    <div class="pick-top"><b>${packedQty >= n && n ? t('pickup_done') : t('packed_of', { a: packedQty, b: n })}</b>
      <div class="pick-acts"><button class="btn sm ghost" data-copy-missing>${t('pickup_report')}</button><button class="btn sm" data-mark-all>${t('mark_all')}</button></div></div>
    <div class="m-bar"><i style="width:${n ? Math.round((packedQty / n) * 100) : 0}%"></i></div>
    ${packedQty < n ? `<div class="m-note">${t('missing_items', { n: n - packedQty })}</div>` : ''}
  </section>`;

  // Base kit checklist for the active camera
  let kitHTML = '';
  if (active && activeProf && !pickup) {
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

  root.classList.toggle('pickup', pickup);
  // A quiet project header: who it is for and what is in it, with the iris ring behind it.
  const headHTML = `<header class="phead">
    <div class="phead-iris" aria-hidden="true"></div>
    <h1 dir="auto">${esc(p.name || t('untitled'))}</h1>
    <p>${[p.productionCo, p.techManager, formatDateRange(p.dateFrom, p.dateTo)].filter(Boolean).map(esc).join(' · ')}</p>
    <div class="phead-n">${t('items_count', { n })}</div>
  </header>`;
  const listHTML = groups.length ? body
    : `<div class="empty"><div class="big">🧰</div><h2>${t('list_empty')}</h2><p>${t('list_empty_hint')}</p></div>`;
  root.innerHTML = headHTML + pickHTML + listHTML + (pickup ? '' : kitHTML);
  root.insertAdjacentHTML('beforeend', `<div class="bottombar">${pickup
    ? `<button class="btn primary" data-pick-off>${t('pickup_off')}</button>`
    : `<button class="btn primary" data-add>${icons.plus}${t('add_gear')}</button><button class="btn" data-export ${n ? '' : 'disabled'}>${icons.share}${t('export')}</button>`}</div>`);

  root.querySelector('[data-add]')?.addEventListener('click', () => ctx.navigate(`#/p/${id}/add`));
  root.querySelector('[data-export]')?.addEventListener('click', () => ctx.navigate(`#/p/${id}/export`));
  root.querySelector('[data-pick-off]')?.addEventListener('click', () => { pickup = false; ctx.render(); });
  root.querySelector('[data-mark-all]')?.addEventListener('click', () => {
    const all = packedQty < n;
    store.getProject(id).items.forEach(i => store.setPacked(id, i.productId, all ? i.qty : 0));
    ctx.render();
  });
  root.querySelector('[data-copy-missing]')?.addEventListener('click', async () => {
    const lines = groups.flatMap(g => {
      const miss = g.entries.filter(({ item }) => Math.min(packed[item.productId] || 0, item.qty) < item.qty);
      return miss.length ? [`— ${t(`dept_${g.key}`)}`, ...miss.map(({ item, product }) => `• ${displayName(product)} ×${item.qty - Math.min(packed[item.productId] || 0, item.qty)}`)] : [];
    });
    const txt = [`${p.name || t('untitled')} — ${t('pickup_report')}`, t('packed_of', { a: packedQty, b: n }), '', ...lines].join('\n');
    try { await navigator.clipboard.writeText(txt); toast(t('copied'), { kind: 'ok' }); } catch { toast(t('export_failed'), { kind: 'err' }); }
  });
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
    row.querySelector('[data-pack]')?.addEventListener('click', () => {
      const item = store.getProject(id).items.find(i => i.productId === productId);
      const have = Math.min((store.getProject(id).packed || {})[productId] || 0, item.qty);
      store.setPacked(id, productId, have >= item.qty ? 0 : item.qty);
      ctx.render();
    });
    const note = row.querySelector('[data-note]');
    if (note) {
      note.onchange = () => store.setItems(id, setNote(store.getProject(id).items, productId, note.value.trim()));
      note.onkeydown = (e) => { if (e.key === 'Enter') note.blur(); };
    }
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


// A list changes all week. A version is a snapshot you can come back to.
export function versionsSheet(ctx, id) {
  const { store, t } = ctx;
  const lang = ctx.lang();
  const locale = lang === 'he' ? 'he-IL' : 'en-GB';
  const draw = () => {
    const p = store.getProject(id);
    const list = p?.versions || [];
    return `
      <label class="vlabel"><span>${esc(t('version_label'))}</span><input data-vlabel maxlength="60" autocomplete="off"></label>
      <button class="btn primary" data-vsave style="width:100%;margin-bottom:12px">${esc(t('save_version'))}</button>
      ${list.length ? `<div class="vlist">${list.map(v => `
        <div class="vrow" data-vid="${esc(v.id)}">
          <div class="vmain">
            <b dir="auto">${esc(v.label || t('auto_version'))}</b>
            <small>${new Date(v.at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })} · ${esc(t('items_in_version', { n: v.items.reduce((s, x) => s + x.qty, 0) }))}</small>
          </div>
          <button class="btn sm" data-vrestore>${esc(t('restore'))}</button>
          <button class="iconbtn sm" data-vdel aria-label="${esc(t('delete'))}">×</button>
        </div>`).join('')}</div>`
        : `<p class="tnote">${esc(t('no_versions'))}</p>`}`;
  };

  const { body, close } = openSheet({ title: t('versions'), bodyHTML: draw() });
  const rewire = () => { body.innerHTML = draw(); bind(); };

  function bind() {
    body.querySelector('[data-vsave]').onclick = () => {
      store.saveVersion(id, body.querySelector('[data-vlabel]')?.value.trim() || '');
      toast(t('version_saved'), { kind: 'ok' });
      rewire();
    };
    body.querySelectorAll('[data-vrestore]').forEach(b => {
      b.onclick = async () => {
        const vid = b.closest('.vrow').dataset.vid;
        if (!(await confirmDialog(t('restore') + '?', { okLabel: t('restore'), cancelLabel: t('cancel'), danger: false }))) return;
        store.restoreVersion(id, vid, t('before_restore'));
        toast(t('version_restored'), { kind: 'ok' });
        close();
        ctx.render();
      };
    });
    body.querySelectorAll('[data-vdel]').forEach(b => {
      b.onclick = () => { store.deleteVersion(id, b.closest('.vrow').dataset.vid); rewire(); };
    });
  }
  bind();
}
