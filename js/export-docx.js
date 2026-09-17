import { loadScript, download } from './ui/dom.js';
import { displayName, formatDateRange, fmtDate, todayStr } from './export-text.js';
import { safeName } from './export-xlsx.js';

export async function exportDocx(project, groups, { lang, includeNotes = true, includeLinks = false, t }) {
  await loadScript('vendor/docx.umd.js');
  const D = globalThis.docx;
  const rtl = lang === 'he';
  const P = (text, o = {}) => new D.Paragraph({
    bidirectional: rtl, alignment: rtl ? D.AlignmentType.RIGHT : D.AlignmentType.LEFT, spacing: { after: 80 }, ...(o.para || {}),
    children: [new D.TextRun({ text: String(text ?? ''), rightToLeft: rtl, font: 'Arial', size: o.size || 22, bold: !!o.bold, color: o.color })],
  });
  const cell = (text, o = {}) => new D.TableCell({
    width: { size: o.w, type: D.WidthType.PERCENTAGE }, shading: o.shade ? { fill: o.shade } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [P(text, { bold: o.bold, size: o.size || 20, color: o.color })],
  });
  const cols = [{ k: 'brand', w: 18, label: t('brand') }, { k: 'item', w: 44, label: t('item') }, { k: 'qty', w: 8, label: t('qty') }];
  if (includeNotes) cols.push({ k: 'notes', w: 30, label: t('notes') });
  if (includeLinks) cols.push({ k: 'link', w: 30, label: t('link') });

  const children = [
    P(project.name || t('untitled'), { size: 40, bold: true }),
    P([project.techManager ? `${t('tech_manager')}: ${project.techManager}` : '', formatDateRange(project.dateFrom, project.dateTo)].filter(Boolean).join('   |   '), { color: '555555' }),
  ];
  if (project.notes) children.push(P(project.notes, { color: '555555' }));
  let total = 0;
  for (const g of groups) {
    children.push(P(t(`dept_${g.key}`), { size: 26, bold: true, color: 'E0262B', para: { spacing: { before: 240, after: 100 } } }));
    const rows = [new D.TableRow({ tableHeader: true, children: cols.map(c => cell(c.label, { w: c.w, bold: true, shade: 'EEEEEE' })) })];
    for (const { item, product } of g.entries) {
      total += item.qty;
      const v = { brand: product.brandName || '', item: displayName(product), qty: item.qty, notes: item.note || '', link: product.url || '' };
      rows.push(new D.TableRow({ children: cols.map(c => cell(v[c.k], { w: c.w, bold: c.k === 'qty' })) }));
    }
    children.push(new D.Table({ width: { size: 100, type: D.WidthType.PERCENTAGE }, visuallyRightToLeft: rtl, rows }));
  }
  children.push(P(`${t('total')}: ${t('items_count', { n: total })}`, { bold: true, size: 24, para: { spacing: { before: 240 } } }));
  children.push(P(`${t('signature')}: ____________________        ${fmtDate(todayStr())}`, { color: '555555', para: { spacing: { before: 480 } } }));

  const doc = new D.Document({ creator: 'CamList', title: project.name || 'Gear list', sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 900, right: 900 } } }, children }] });
  const blob = await D.Packer.toBlob(doc);
  download(`${safeName(project.name)}-gearlist.docx`, blob);
}
