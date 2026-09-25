import { esc } from './ui/dom.js';
import { displayName, formatDateRange, fmtDate, todayStr } from './export-text.js';

// The printed list is laid out like a slate: one tight grid of fields, hairline rules, no padding to spare.
// Rental houses print these in black and white, so the only solid ink on the page is the clapper strip.
const COLS = 6;
const cell = (label, value, span = 1) => (value ? { label, value, span } : null);
// The grid draws its rules with a 1px black gap, so every row has to be filled to the last column.
const grid = (cells, extraClass = '') => {
  const list = cells.filter(Boolean);
  const used = list.reduce((n, c) => n + c.span, 0) % COLS;
  if (used) list.push({ label: '', value: '', span: COLS - used, blank: true });
  return `<div class="grid">${list.map(c => `<div class="cell ${c.blank ? 'blank' : ''} ${extraClass}" style="grid-column:span ${c.span}"><i>${esc(c.label)}</i><b dir="auto">${esc(c.value)}</b></div>`).join('')}</div>`;
};

export function renderPrint(ctx, project, groups, root, { includeNotes = true, includeImages = false } = {}) {
  const { t } = ctx;
  document.body.classList.add('print-mode');
  ctx.setTopbar({ title: esc(t('pdf')), back: `#/p/${project.id}/export` });
  const total = groups.reduce((n, g) => n + g.entries.reduce((m, e) => m + e.item.qty, 0), 0);
  const hasNotes = includeNotes && groups.some(g => g.entries.some(e => e.item.note));
  const cols = 2 + (includeImages ? 1 : 0) + (hasNotes ? 1 : 0);

  const sections = groups.map(g => {
    const qty = g.entries.reduce((m, e) => m + e.item.qty, 0);
    return `<tbody>
      <tr class="dept"><td colspan="${cols}">${esc(t(`dept_${g.key}`))}</td><td class="q">${qty}</td></tr>
      ${g.entries.map(({ item, product }) => `<tr>
        ${includeImages ? `<td class="im">${product.image ? `<img src="${esc(product.image)}" alt="" onerror="this.remove()">` : ''}</td>` : ''}
        <td class="br" dir="auto">${esc(product.brandName || '')}</td>
        <td dir="auto">${esc(displayName(product))}</td>
        ${hasNotes ? `<td class="nt" dir="auto">${esc(item.note || '')}</td>` : ''}
        <td class="q">${item.qty}</td></tr>`).join('')}
    </tbody>`;
  }).join('');

  const dates = formatDateRange(project.dateFrom, project.dateTo);
  const contact = [project.phone, project.email].filter(Boolean).join(' · ');
  root.innerHTML = `<div class="print" dir="${document.documentElement.dir}">
    <div class="screen-only card"><b>${t('pdf_hint')}</b><button class="btn sm primary" data-print>🖨️ ${t('pdf')}</button></div>
    <div class="slate">
      <div class="sticks"><span class="mark">CAM<b>LIST</b></span></div>
      ${grid([
        cell(t('project_name'), project.name || t('untitled'), 3),
        cell(t('total'), String(total)),
        cell(t('date'), fmtDate(todayStr()), 2),
        cell(t('production_co'), project.productionCo, 2),
        cell(t('tech_manager'), project.techManager, 2),
        cell(dates ? t('dates') : '', dates, 2),
        cell(contact ? t('contact') : '', contact, 3),
        cell(project.notes ? t('notes') : '', project.notes, 3),
      ])}
    </div>
    <table>${sections}</table>
    <div class="slate foot">
      ${grid([
        { label: t('received_by'), value: ' ', span: 3 },
        { label: t('date_received'), value: ' ', span: 3 },
      ], 'sig')}
    </div>
  </div>`;

  const go = () => window.print();
  root.querySelector('[data-print]').onclick = go;
  const imgs = [...root.querySelectorAll('img')];
  Promise.race([
    Promise.all(imgs.map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))),
    new Promise(r => setTimeout(r, 1500)),
  ]).then(() => setTimeout(go, 100));
}
