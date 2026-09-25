import { esc, icons, toast } from './dom.js';
import { groupByDept, setQty, setNote, totalQty } from '../list.js';
import { logoHTML } from '../brands.js';
import { displayName, formatDateRange } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { deptIcon } from './icons-dept.js';
import { editProjectSheet } from './projects.js';
import { presetCatalog } from './catalog.js';

const collapsed = new Set();
let pickup = false; // prep day: the list turns into a check-off sheet

export const thumbHTML = (p, key) => `<div class="thumb"><span>${DEPT_EMOJI[key] || '📦'}</span>${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
export const parseId = (s) => (/^\d+$/.test(s) ? Number(s) : s);
const hrs = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10).toString();
// "4 סוללות" but "סוללה" for one — Hebrew reads badly with a bare 1 in front of a plural.
const unit = (t, n, one, many) => (Number(n) === 1 ? t(one) : `${n} ${t(many)}`);
// One block per shooting hour, the way a camera shows a battery: lit blocks are hours you have.
const segBlocks = (hours, need) => {
  const total = Math.max(Math.ceil(need) || 1, 1);
  const lit = Math.max(0, Math.min(Math.round(hours), total));
  return Array.from({ length: total }, (_, i) => `<i class="${i < lit ? '' : 'off'}"></i>`).join('');
};

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
    if (!pickup) return `<div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q px">${item.qty}</span><button class="plus" data-d="1" aria-label="+">+</button></div>`;
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
            <div class="sub">${logoHTML(product.brand, product.brandName, 'row')}${product.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}${product.extra ? `<span class="chip extra">${t('not_at_utopia_item')}</span>` : ''}${pickup ? '' : buildBtn(product)}</div>
            ${pickup ? (item.note ? `<div class="sub dim" dir="auto">${esc(item.note)}</div>` : '') : `<input class="note" value="${esc(item.note)}" placeholder="${t('note_placeholder')}" data-note>`}
          </div>
          ${tailHTML(item)}
        </div>`).join('')}</div>
    </section>`).join('');

  // Prep day banner: how much of the list is already in the truck.
  const fmtLabel = (activeProf && ctx.power) ? (ctx.power.formatsFor(activeProf)[Math.min(Number(p.formatIndex || 0), ctx.power.formatsFor(activeProf).length - 1)]?.label || '') : '';
  const statusHTML = `<div class="statusbar">
    ${pickup ? `<span class="rec"><i></i>PREP</span>` : ''}
    ${active ? `<span><span class="k">CAM</span><span class="v">${esc((displayName(active) || '').slice(0, 14))}</span></span>` : ''}
    ${fmtLabel ? `<span><span class="k">FMT</span><span class="v">${esc(fmtLabel)}</span></span>` : ''}
    <span class="sp"></span>
    <span><span class="k">ITEMS</span><span class="v">${n}</span></span>
  </div>`;

  const pickHTML = !pickup ? '' : `<section class="card pickbar ${packedQty >= n && n ? 'done' : ''}">
    <div class="pick-top"><b>${packedQty >= n && n ? t('pickup_done') : t('packed_of', { a: packedQty, b: n })}</b>
      <div class="pick-acts"><button class="btn sm ghost" data-copy-missing>${t('pickup_report')}</button><button class="btn sm" data-mark-all>${t('mark_all')}</button></div></div>
    <div class="m-bar"><i style="width:${n ? Math.round((packedQty / n) * 100) : 0}%"></i></div>
    ${packedQty < n ? `<div class="m-note">${t('missing_items', { n: n - packedQty })}</div>` : ''}
  </section>`;

  // Power & media: what the chosen batteries and cards actually give at the selected recording format.
  let powerHTML = '';
  if (activeProf && ctx.power) {
    const fi = Number(p.formatIndex || 0);
    const need = Number(p.shootHours ?? 10);
    const s = ctx.power.summary(activeProf, p.items, ctx.resolve, { formatIndex: fi, shootHours: need });
    const hoursTxt = (v) => unit(t, hrs(v), 'u_hour', 'u_hours');
    const meter = (kind, have, hours, ok, gap, add, emptyKey) => `
      <div class="meter ${have ? (ok ? 'ok' : 'bad') : 'none'}">
        <div class="m-top"><span>${t(kind === 'power' ? 'power_have' : 'media_have', { n: unit(t, have, kind === 'power' ? 'u_batt' : 'u_card', kind === 'power' ? 'u_batts' : 'u_cards') })}</span><b>${have ? hoursTxt(hours) : '—'}</b></div>
        <div class="seg ${have ? (ok ? '' : 'bad') : 'none'}">${segBlocks(hours, need)}</div>
        <div class="m-note">${have ? (ok ? `✓ ${t('enough')}` : t(kind === 'power' ? 'add_batteries' : 'add_cards', { gap: hoursTxt(gap), n: unit(t, add || 1, kind === 'power' ? 'u_batt' : 'u_card', kind === 'power' ? 'u_batts' : 'u_cards') })) : t(emptyKey)}</div>
      </div>`;
    powerHTML = `<section class="card pw">
      <div class="pw-head"><b>${t('power_media')}</b><span class="pchip">${t('draw_w', { n: s.watts })}</span></div>
      <div class="pw-ctl">
        <label><span>${t('rec_format')}</span><select data-fmt>${s.formats.map((f, k) => `<option value="${k}" ${k === Math.min(fi, s.formats.length - 1) ? 'selected' : ''}>${esc(f.label)} · ${f.mbps} Mbps</option>`).join('')}</select></label>
        <label class="sm"><span>${t('shoot_hours')}</span><input type="number" min="1" max="24" step="1" value="${need}" data-hrs inputmode="numeric"></label>
      </div>
      ${meter('power', s.batteries, s.powerHours, s.powerOk, s.powerGap, s.addBatteries, 'no_batteries')}
      ${meter('media', s.cards, s.mediaHours, s.mediaOk, s.mediaGap, s.addCards, 'no_cards')}
      ${s.unknownBatteries ? `<div class="m-note dim">${t('unknown_wh', { n: unit(t, s.unknownBatteries, 'u_batt', 'u_batts') })}</div>` : ''}
    </section>`;
  }

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
  const framed = groups.length
    ? `<section class="arri">
        <div class="arri-hd"><span class="k">MENU</span><b dir="auto">${esc(p.name || t('gear_list'))}</b><span class="n">${n}</span></div>
        <div class="arri-bd">${body}</div>
        <div class="arri-ft"><button data-home>HOME</button><button data-back-menu>BACK</button></div>
      </section>`
    : `<div class="empty"><div class="big">🧰</div><h2>${t('list_empty')}</h2><p>${t('list_empty_hint')}</p></div>`;
  root.innerHTML = statusHTML + pickHTML + framed + (pickup ? '' : powerHTML + kitHTML);
  root.insertAdjacentHTML('beforeend', `<div class="bottombar">${pickup
    ? `<button class="btn primary" data-pick-off>${t('pickup_off')}</button>`
    : `<button class="btn primary" data-add>${icons.plus}${t('add_gear')}</button><button class="btn" data-export ${n ? '' : 'disabled'}>${icons.share}${t('export')}</button>`}</div>`);

  root.querySelector('[data-home]')?.addEventListener('click', () => ctx.navigate('#/'));
  root.querySelector('[data-back-menu]')?.addEventListener('click', () => { if (pickup) { pickup = false; ctx.render(); } else ctx.navigate('#/'); });
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
  root.querySelector('[data-fmt]')?.addEventListener('change', (e) => { store.setShoot(id, { formatIndex: Number(e.target.value) }); ctx.render(); });
  root.querySelector('[data-hrs]')?.addEventListener('change', (e) => {
    const v = Math.min(Math.max(Number(e.target.value) || 1, 1), 24);
    store.setShoot(id, { shootHours: v }); ctx.render();
  });
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
