import { esc, openSheet, confirmDialog, icons } from './dom.js';
import { totalQty } from '../list.js';
import { formatDateRange } from '../export-text.js';

export function projectForm(t, p = {}) {
  return `<div class="form">
    <label>${t('project_name')}<input name="name" value="${esc(p.name || '')}" autocomplete="off"></label>
    <label>${t('tech_manager')}<input name="techManager" value="${esc(p.techManager || '')}" autocomplete="off"></label>
    <div class="two">
      <label>${t('date_from')}<input type="date" name="dateFrom" value="${esc(p.dateFrom || '')}"></label>
      <label>${t('date_to')}<input type="date" name="dateTo" value="${esc(p.dateTo || '')}"></label>
    </div>
    <label>${t('notes')}<textarea name="notes">${esc(p.notes || '')}</textarea></label>
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
  const { store, t } = ctx;
  const projects = store.state.projects;
  ctx.setTopbar({ title: `<span class="brandmark">CAM<b>LIST</b></span>`, right: [{ icon: icons.gear, onClick: () => ctx.navigate('#/settings'), label: t('settings') }] });

  const locale = ctx.lang() === 'he' ? 'he-IL' : 'en-GB';
  const list = projects.map(p => {
    const n = totalQty(p.items);
    const range = formatDateRange(p.dateFrom, p.dateTo);
    return `<article class="card project-card" data-id="${esc(p.id)}">
      <div><h3>${esc(p.name || t('untitled'))}</h3>
        <div class="meta">${p.techManager ? `<span>${esc(p.techManager)}</span>` : ''}${range ? `<span>${range}</span>` : ''}<span>${t('updated')} ${new Date(p.updatedAt).toLocaleDateString(locale)}</span></div></div>
      <span class="pill">${n === 1 ? t('item_count_one') : t('items_count', { n })}</span>
      <button class="iconbtn more" data-more aria-label="more">${icons.more}</button>
    </article>`;
  }).join('');

  root.innerHTML = projects.length ? list : `<div class="empty"><div class="big">🎬</div><h2>${t('no_projects')}</h2><p>${t('no_projects_hint')}</p></div>`;
  root.insertAdjacentHTML('beforeend', `<div class="bottombar"><button class="btn primary" data-new>${icons.plus}${t('new_project')}</button></div>`);

  root.querySelector('[data-new]').onclick = () => openSheet({
    title: t('new_project'), bodyHTML: projectForm(t, { techManager: store.state.settings.techManager }),
    actions: [{ label: t('cancel'), kind: 'ghost' }, { label: t('save'), kind: 'primary', onClick: (body) => { const p = store.createProject(readForm(body)); ctx.navigate(`#/p/${p.id}`); } }],
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
