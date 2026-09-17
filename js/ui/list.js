import { esc, icons } from './dom.js';
import { groupByDept, setQty, setNote, totalQty } from '../list.js';
import { logoHTML } from '../brands.js';
import { displayName, formatDateRange } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { editProjectSheet } from './projects.js';

const collapsed = new Set();

export const thumbHTML = (p, key) => `<div class="thumb"><span>${DEPT_EMOJI[key] || '📦'}</span>${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>`;
export const parseId = (s) => (/^\d+$/.test(s) ? Number(s) : s);

export function render(ctx, { id }, root) {
  const { store, t } = ctx;
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

  const groups = groupByDept(p.items, ctx.resolve, ctx.deptOrder());
  const body = groups.map(g => `
    <section class="group ${collapsed.has(g.key) ? 'collapsed' : ''}" data-key="${g.key}">
      <div class="group-head"><span class="emoji">${DEPT_EMOJI[g.key]}</span><h2>${t(`dept_${g.key}`)}</h2><span class="count">${g.entries.reduce((s, e) => s + e.item.qty, 0)}</span><span class="chev">${icons.chev}</span></div>
      <div class="group-body">${g.entries.map(({ item, product }) => `
        <div class="row" data-pid="${esc(item.productId)}">
          ${thumbHTML(product, g.key)}
          <div class="body">
            <div class="name">${esc(displayName(product))}</div>
            <div class="sub">${logoHTML(product.brand, product.brandName, 'row')}${product.manual ? `<span class="chip">${t('manual_item')}</span>` : ''}</div>
            <input class="note" value="${esc(item.note)}" placeholder="${t('note_placeholder')}" data-note>
          </div>
          <div class="stepper compact"><button data-d="-1" aria-label="-">−</button><span class="q">${item.qty}</span><button class="plus" data-d="1" aria-label="+">+</button></div>
        </div>`).join('')}</div>
    </section>`).join('');

  root.innerHTML = groups.length ? body : `<div class="empty"><div class="big">🧰</div><h2>${t('list_empty')}</h2><p>${t('list_empty_hint')}</p></div>`;
  root.insertAdjacentHTML('beforeend', `<div class="bottombar"><button class="btn primary" data-add>${icons.plus}${t('add_gear')}</button><button class="btn" data-export ${n ? '' : 'disabled'}>${icons.share}${t('export')}</button></div>`);

  root.querySelector('[data-add]').onclick = () => ctx.navigate(`#/p/${id}/add`);
  root.querySelector('[data-export]').onclick = () => ctx.navigate(`#/p/${id}/export`);
  root.querySelectorAll('.group-head').forEach(h => { h.onclick = () => { const k = h.parentElement.dataset.key; collapsed.has(k) ? collapsed.delete(k) : collapsed.add(k); h.parentElement.classList.toggle('collapsed'); }; });

  root.querySelectorAll('.row').forEach(row => {
    const productId = parseId(row.dataset.pid);
    row.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => {
      const cur = store.getProject(id).items.find(i => i.productId === productId)?.qty || 0;
      const next = cur + Number(b.dataset.d);
      store.setItems(id, setQty(store.getProject(id).items, productId, next));
      if (next <= 0) ctx.render(); else { row.querySelector('.q').textContent = next; syncCounts(); }
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
  }
}
