import { esc } from './ui/dom.js';
import { displayName, formatDateRange, fmtDate, todayStr } from './export-text.js';
import { logoHTML } from './brands.js';
import { DEPT_EMOJI } from './i18n.js';

export function renderPrint(ctx, project, groups, root, { includeNotes = true } = {}) {
  const { t } = ctx;
  document.body.classList.add('print-mode');
  ctx.setTopbar({ title: esc(t('pdf')), back: `#/p/${project.id}/export` });
  let total = 0;
  const sections = groups.map(g => `
    <h2>${DEPT_EMOJI[g.key]} ${esc(t(`dept_${g.key}`))}</h2>
    <table><thead><tr><th></th><th>${t('brand')}</th><th>${t('item')}</th><th>${t('qty')}</th>${includeNotes ? `<th>${t('notes')}</th>` : ''}</tr></thead><tbody>
    ${g.entries.map(({ item, product }) => { total += item.qty; return `<tr><td class="im">${product.image ? `<img src="${esc(product.image)}" alt="" onerror="this.remove()">` : ''}</td><td>${logoHTML(product.brand, product.brandName, 'inline')}${esc(product.brandName || '')}</td><td>${esc(displayName(product))}</td><td class="q">${item.qty}</td>${includeNotes ? `<td>${esc(item.note)}</td>` : ''}</tr>`; }).join('')}
    </tbody></table>`).join('');
  root.innerHTML = `<div class="print" dir="${document.documentElement.dir}">
    <div class="screen-only card" style="background:#fff3f3;border-color:#e0262b;color:#111"><b>${t('pdf_hint')}</b><button class="btn sm primary" data-print>🖨️ ${t('pdf')}</button></div>
    <header><div><h1>${esc(project.name || t('untitled'))}</h1><div class="meta">${[project.techManager ? `${t('tech_manager')}: ${esc(project.techManager)}` : '', formatDateRange(project.dateFrom, project.dateTo)].filter(Boolean).join(' · ')}</div>${project.notes ? `<div class="meta">${esc(project.notes)}</div>` : ''}</div><div class="brandmark" style="color:#111">CAM<b style="color:#e0262b">LIST</b></div></header>
    ${sections}
    <footer><div>${t('total')}: ${t('items_count', { n: total })}</div><div>${fmtDate(todayStr())}</div></footer>
    <div class="sig">${t('signature')}</div>
  </div>`;
  const go = () => window.print();
  root.querySelector('[data-print]').onclick = go;
  const imgs = [...root.querySelectorAll('img')];
  Promise.race([
    Promise.all(imgs.map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))),
    new Promise(r => setTimeout(r, 1500)),
  ]).then(() => setTimeout(go, 100));
}
