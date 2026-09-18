import { esc } from './dom.js';
import { logoHTML } from '../brands.js';
import { DEPT_EMOJI } from '../i18n.js';
import { fmtDate } from '../export-text.js';

let tab = 'market';
const cache = { news: null, changes: null };

async function load(name) {
  if (cache[name]) return cache[name];
  try { const r = await fetch(`data/${name}.json`, { cache: 'no-cache' }); cache[name] = r.ok ? await r.json() : null; } catch { cache[name] = null; }
  return cache[name];
}

export function render(ctx, _p, root) {
  const { t, catalog } = ctx;
  ctx.setTopbar({ title: esc(t('whats_new')), back: '#/' });
  root.innerHTML = `<div class="tabs"><button class="${tab === 'market' ? 'active' : ''}" data-tab="market">${t('new_in_market')}</button><button class="${tab === 'utopia' ? 'active' : ''}" data-tab="utopia">${t('new_at_utopia')}</button></div><div data-content><div class="empty"><p>…</p></div></div>`;
  root.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { tab = b.dataset.tab; render(ctx, _p, root); }; });
  const box = root.querySelector('[data-content]');

  if (tab === 'market') {
    load('news').then(n => {
      if (!n?.items?.length) { box.innerHTML = `<div class="empty"><div class="big">📰</div><h2>${t('no_news')}</h2></div>`; return; }
      const inUtopia = (it) => it.brand && catalog.brands.some(b => b.id === it.brand);
      box.innerHTML = `<p class="news-meta">${t('news_sources', { n: n.items.length })} · ${(n.sources || []).join(' · ')} · ${t('updated')} ${fmtDate((n.generatedAt || '').slice(0, 10))}</p>` +
        n.items.map(it => `<a class="card news" href="${esc(it.url)}" target="_blank" rel="noopener">
          <div class="news-head">${it.brand ? logoHTML(it.brand, catalog.brandName(it.brand), 'row') : ''}<span class="news-src">${esc(it.source)}</span><span class="news-date">${fmtDate(it.date)}</span></div>
          <h3 dir="auto">${esc(it.title)}</h3>
          ${it.summary ? `<p dir="auto">${esc(it.summary)}…</p>` : ''}
          ${it.brand ? `<span class="ctag ${inUtopia(it) ? 'dim' : 'warn'}">${inUtopia(it) ? t('brand_at_utopia') : t('not_at_utopia')}</span>` : ''}
        </a>`).join('');
    });
  } else {
    load('changes').then(c => {
      const added = c?.added || [];
      if (!added.length) { box.innerHTML = `<div class="empty"><div class="big">🆕</div><h2>${t('no_changes')}</h2><p>${t('no_changes_hint')}</p></div>`; return; }
      box.innerHTML = `<p class="news-meta">${t('updated')} ${fmtDate((c.generatedAt || '').slice(0, 10))}</p>` + added.map(p => `
        <a class="row" href="${esc(p.url || '#')}" target="_blank" rel="noopener" style="text-decoration:none">
          <div class="thumb"><span>${DEPT_EMOJI[p.dept] || '📦'}</span>${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</div>
          <div class="body"><div class="name" dir="auto">${esc(p.name)}</div><div class="sub">${logoHTML(p.brand, p.brandName, 'row')}<span class="chip">${t(`dept_${p.dept}`)}</span><span class="chip">${fmtDate(p.date)}</span></div></div>
        </a>`).join('');
    });
  }
}

// Badge count for the home screen: items added at Utopia in the last 30 days + market news from the last 14 days.
export async function newCounts() {
  const [n, c] = await Promise.all([load('news'), load('changes')]);
  const since = (days) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  return { market: (n?.items || []).filter(i => i.date >= since(14)).length, utopia: (c?.added || []).filter(i => i.date >= since(30)).length };
}
