import { esc, openSheet, confirmDialog, icons } from './dom.js';
import { totalQty, groupByDept } from '../list.js';
import { formatDateRange } from '../export-text.js';
import { DEPT_EMOJI } from '../i18n.js';
import { newCounts } from './news.js';

export function projectForm(t, p = {}) {
  const opt = `<em class="opt">(${t('optional')})</em>`;
  return `<div class="form">
    <label>${t('project_name')}<input name="name" value="${esc(p.name || '')}" autocomplete="off" enterkeyhint="done"></label>
    <label>${t('tech_manager')} ${opt}<input name="techManager" value="${esc(p.techManager || '')}" autocomplete="off"></label>
    <div class="two">
      <label>${t('date_from')} ${opt}<input type="date" name="dateFrom" value="${esc(p.dateFrom || '')}"></label>
      <label>${t('date_to')} ${opt}<input type="date" name="dateTo" value="${esc(p.dateTo || '')}"></label>
    </div>
    <label>${t('notes')} ${opt}<textarea name="notes">${esc(p.notes || '')}</textarea></label>
  </div>`;
}
export const readForm = (body) => Object.fromEntries([...body.querySelectorAll('[name]')].map(i => [i.name, i.value.trim()]));

export function editProjectSheet(ctx, id) {
  const { store, t } = ctx;
  const p = store.getProject(id);
  openSheet({
    title: t('rename'), bodyHTML: projectForm(t, p),
    actions: [{ label: t('cancel'), kind: 'ghost' }, { label: t('save'), kind: 'primary', onClick: (b) => { store.updateProject(id, readForm(b)); ctx.render(); } }],
  });
}

export function render(ctx, _params, root) {
  const { store, t, catalog } = ctx;
  const projects = store.state.projects;
  ctx.setTopbar({ title: `<span class="brandmark">CAM<b>LIST</b></span>`, right: [{ icon: icons.gear, onClick: () => ctx.navigate('#/settings'), label: t('settings') }] });

  const locale = ctx.lang() === 'he' ? 'he-IL' : 'en-GB';
  const hero = `<section class="hero">
    <div class="hero-mark">CAM<b>LIST</b></div>
    <p class="hero-sub">${t('hero_sub')}</p>
    <div class="stats">
      <div><b>${catalog.products.length || '—'}</b><span>${t('stat_products')}</span></div>
      <div><b>${catalog.brands.length || '—'}</b><span>${t('stat_brands')}</span></div>
      <div><b>${projects.length}</b><span>${t('stat_projects')}</span></div>
    </div>
    <button class="newsbtn" data-news>📰 ${t('whats_new')}<span class="badge" data-news-badge hidden></span><span class="arrow">›</span></button>
  </section>`;

  const list = projects.map(p => {
    const n = totalQty(p.items);
    const range = formatDateRange(p.dateFrom, p.dateTo);
    const groups = groupByDept(p.items, ctx.resolve, ctx.deptOrder());
    const chips = groups.map(g => `<span class="dchip">${DEPT_EMOJI[g.key]} ${g.entries.reduce((s, e) => s + e.item.qty, 0)}</span>`).join('');
    return `<article class="card project-card" data-id="${esc(p.id)}">
      <div class="pc-main">
        <h3 dir="auto">${esc(p.name || t('untitled'))}</h3>
        <div class="meta">${p.techManager ? `<span>👤 ${esc(p.techManager)}</span>` : ''}${range ? `<span>📅 ${range}</span>` : ''}</div>
        <div class="dchips">${chips || `<span class="dchip muted">${t('list_empty')}</span>`}</div>
      </div>
      <div class="pc-side">
        <span class="pill">${n === 1 ? t('item_count_one') : t('items_count', { n })}</span>
        <button class="iconbtn more" data-more aria-label="more">${icons.more}</button>
      </div>
      <div class="pc-foot">${t('updated')} ${new Date(p.updatedAt).toLocaleDateString(locale)}</div>
    </article>`;
  }).join('');

  root.innerHTML = hero + (projects.length ? `<div class="section-title">${t('projects')} <span class="count">${projects.length}</span></div>${list}` : `<div class="empty"><div class="big">🎬</div><h2>${t('no_projects')}</h2><p>${t('no_projects_hint')}</p></div>`);
  root.insertAdjacentHTML('beforeend', `<div class="bottombar"><button class="btn primary" data-new>${icons.plus}${t('new_project')}</button></div>`);

  root.querySelector('[data-news]').onclick = () => ctx.navigate('#/news');
  newCounts().then(({ market, utopia }) => { const b = root.querySelector('[data-news-badge]'); if (!b) return; const n = market + utopia; if (n) { b.textContent = n; b.hidden = false; } });
  root.querySelector('[data-new]').onclick = () => openSheet({
    title: t('new_project'), bodyHTML: projectForm(t, { techManager: store.state.settings.techManager }),
    actions: [{ label: t('cancel'), kind: 'ghost' }, { label: t('save'), kind: 'primary', onClick: (body) => { const f = readForm(body); if (!f.name) { body.querySelector('[name=name]').focus(); return false; } const p = store.createProject(f); ctx.navigate(`#/p/${p.id}`); } }],
    onOpen: (body) => body.querySelector('[name=name]').focus(),
  });

  root.querySelectorAll('.project-card').forEach(card => {
    const id = card.dataset.id;
    card.onclick = (e) => { if (!e.target.closest('[data-more]')) ctx.navigate(`#/p/${id}`); };
    card.querySelector('[data-more]').onclick = () => {
      const p = store.getProject(id);
      openSheet({ title: p.name || t('untitled'), stack: true, actions: [
        { label: t('rename'), onClick: () => { setTimeout(() => editProjectSheet(ctx, id), 60); } },
        { label: t('duplicate'), onClick: () => { const d = store.duplicateProject(id); ctx.navigate(`#/p/${d.id}`); } },
        { label: t('delete'), kind: 'danger', onClick: () => { setTimeout(async () => { if (await confirmDialog(t('confirm_delete_project', { name: p.name || t('untitled') }), { okLabel: t('delete'), cancelLabel: t('cancel') })) { store.deleteProject(id); ctx.render(); } }, 60); } },
        { label: t('cancel'), kind: 'ghost' },
      ] });
    };
  });
}
