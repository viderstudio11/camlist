import { createStore } from './store.js';
import { createCatalog, loadCatalog } from './catalog.js';
import { t, setLang, getLang, dirFor } from './i18n.js';
import { esc, el, toast, icons, download } from './ui/dom.js';
import { fallbackHTML, setLogoIndex } from './brands.js';
import * as Projects from './ui/projects.js';
import * as List from './ui/list.js';
import * as Catalog from './ui/catalog.js';
import * as Export from './ui/export.js';

const store = createStore();
setLang(store.state.settings.lang);
let catalog = createCatalog({ departments: [], brands: [], products: [] }, store.state.manualProducts);
let catalogError = null;

// Called by the inline onerror in brands.logoHTML if a listed logo file fails to load.
window.__logoFallback = (slug, size) => fallbackHTML(slug, catalog.brandName(slug), size);

const ctx = {
  store, t, get catalog() { return catalog; },
  lang: getLang,
  setLang(l) { setLang(l); store.setSettings({ lang: l }); applyDir(); render(); },
  navigate(hash) { if (location.hash === hash) render(); else location.hash = hash; },
  render,
  deptOrder: () => catalog.departments.map(d => ({ id: d.id, key: d.slug })),
  resolve: (id) => catalog.byId(id),
  setTopbar({ title = '', back = null, right = [] }) {
    const bar = document.getElementById('topbar');
    bar.innerHTML = `${back ? `<button class="iconbtn mirror" data-back aria-label="back">${icons.back}</button>` : ''}<div class="title" dir="auto">${title}</div>${right.map((r, i) => `<button class="iconbtn" data-r="${i}" aria-label="${esc(r.label || '')}">${r.icon || esc(r.text ?? '')}</button>`).join('')}<button class="langpill" data-lang aria-label="language">${t('lang_switch')}</button>`;
    bar.querySelector('[data-lang]').onclick = () => ctx.setLang(getLang() === 'he' ? 'en' : 'he');
    if (back) bar.querySelector('[data-back]').onclick = () => (typeof back === 'string' ? ctx.navigate(back) : back());
    right.forEach((r, i) => { bar.querySelector(`[data-r="${i}"]`).onclick = r.onClick; });
  },
};

function applyDir() {
  document.documentElement.lang = getLang();
  document.documentElement.dir = dirFor(getLang());
}

function route() {
  const h = location.hash || '#/';
  let m;
  if ((m = h.match(/^#\/p\/([^/]+)\/add$/))) return { screen: Catalog, params: { id: m[1] } };
  if ((m = h.match(/^#\/p\/([^/]+)\/export$/))) return { screen: Export, params: { id: m[1] } };
  if ((m = h.match(/^#\/p\/([^/]+)\/print$/))) return { screen: Export, params: { id: m[1], print: true } };
  if ((m = h.match(/^#\/p\/([^/]+)$/))) return { screen: List, params: { id: m[1] } };
  if (h === '#/settings') return { screen: { render: renderSettings }, params: {} };
  return { screen: Projects, params: {} };
}

function render() {
  const root = document.getElementById('view');
  document.body.classList.remove('print-mode');
  const sheet = document.getElementById('sheet');
  if (sheet.open) { sheet.close(); sheet.innerHTML = ''; }
  const { screen, params } = route();
  if (params.id && !store.getProject(params.id)) { location.hash = '#/'; return; }
  window.scrollTo(0, 0);
  screen.render(ctx, params, root);
  if (catalogError && !document.getElementById('catalog-error')) {
    root.insertAdjacentHTML('afterbegin', `<div class="card" id="catalog-error" style="border-color:var(--accent);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:12px"><b>${t('catalog_error')}</b><button class="btn sm" data-retry>${t('retry')}</button></div>`);
    root.querySelector('[data-retry]').onclick = boot;
  }
}

function renderSettings(ctx, _p, root) {
  ctx.setTopbar({ title: t('settings'), back: '#/' });
  const s = store.state.settings;
  const locale = getLang() === 'he' ? 'he-IL' : 'en-GB';
  root.innerHTML = `
    <div class="card form">
      <label>${t('default_tech_manager')}<input name="techManager" value="${esc(s.techManager)}" autocomplete="off"></label>
    </div>
    <div class="section-title">${t('backup')}</div>
    <div class="card" style="display:grid;gap:10px">
      <button class="btn" data-export>${t('export_backup')}</button>
      <button class="btn" data-import>${t('import_backup')}</button>
      <input type="file" accept="application/json,.json" hidden data-file>
    </div>
    <div class="section-title">${t('about')}</div>
    <div class="card">
      <div class="kv"><span>${t('catalog_date')}</span><b>${catalog.generatedAt ? new Date(catalog.generatedAt).toLocaleDateString(locale) : '—'}</b></div>
      <div class="kv"><span>${t('products')}</span><b>${catalog.products.length}</b></div>
      <div class="kv"><span>${t('brands')}</span><b>${catalog.brands.length}</b></div>
      <div class="kv"><span>${t('logos_hint')}</span></div>
      <div class="kv"><span>utopiacam.com</span><b>CamList v1</b></div>
    </div>`;
  root.querySelector('[name=techManager]').onchange = (e) => store.setSettings({ techManager: e.target.value.trim() });
  root.querySelector('[data-export]').onclick = () => download(`camlist-backup-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(store.exportBackup(), null, 1)], { type: 'application/json' }));
  const file = root.querySelector('[data-file]');
  root.querySelector('[data-import]').onclick = () => file.click();
  file.onchange = async () => {
    try { const r = store.importBackup(JSON.parse(await file.files[0].text())); catalog.setManual(store.state.manualProducts); toast(t('import_ok', r), { kind: 'ok' }); }
    catch { toast(t('import_failed'), { kind: 'err' }); }
    file.value = '';
  };
}

async function boot() {
  fetch('logos/index.json', { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).then(idx => { if (idx) { setLogoIndex(idx); render(); } }).catch(() => {});
  try {
    const data = await loadCatalog();
    catalog = createCatalog(data, store.state.manualProducts);
    catalogError = null;
  } catch (e) { catalogError = e; }
  render();
}

let warned = false;
store.subscribe(() => {
  catalog.setManual(store.state.manualProducts);
  if (!store.storageOk && !warned) { warned = true; toast(t('storage_warning'), { kind: 'err', ms: 4000 }); }
});
window.addEventListener('hashchange', render);
applyDir();
render();
boot();

// On localhost the SW is skipped (unless ?sw=1) so edits show up on plain reload; production always registers it.
const devNoSW = ['localhost', '127.0.0.1'].includes(location.hostname) && !location.search.includes('sw=1');
if ('serviceWorker' in navigator && !devNoSW) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          const n = el(`<div class="toast" style="pointer-events:auto;cursor:pointer">${esc(t('new_version'))} · ${esc(t('refresh'))}</div>`);
          n.onclick = () => location.reload();
          document.getElementById('toasts').appendChild(n);
        }
      });
    });
  }).catch(() => {});
}
