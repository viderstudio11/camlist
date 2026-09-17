export const normalize = (s = '') => String(s).toLowerCase()
  .replace(/[֑-ׇ]/g, '')            // hebrew diacritics
  .replace(/[-_/\\.,()\[\]"'+:;|]+/g, ' ')
  .replace(/\s+/g, ' ').trim();

export function createCatalog(data, manual = []) {
  const departments = [...(data.departments || [])].sort((a, b) => a.order - b.order);
  const deptMap = new Map(departments.map(d => [d.id, d]));
  const subcatMap = new Map();
  for (const d of departments) for (const s of d.subcategories || []) subcatMap.set(s.id, { ...s, dept: d.id });
  const brandNames = new Map((data.brands || []).map(b => [b.id, b.name]));

  const products = [];
  const byIdMap = new Map();
  let manualProducts = [];

  const decorate = (p, isManual) => ({
    id: p.id, name: p.name, brand: p.brand || null,
    brandName: p.brandName || brandNames.get(p.brand) || p.brand || null,
    dept: p.dept, subcats: p.subcats || [], image: p.image || null, url: p.url || null, manual: !!isManual,
    _n: '', _b: '', _all: '',
  });
  const indexOf = (p) => {
    const sub = p.subcats.map(id => subcatMap.get(id)).filter(Boolean).map(s => `${s.he} ${s.en}`).join(' ');
    p._n = normalize(p.name);
    p._b = normalize(p.brandName || '');
    p._all = normalize(`${p.name} ${p.brandName || ''} ${sub}`);
    return p;
  };
  for (const raw of data.products || []) {
    const p = indexOf(decorate(raw, false));
    if (p.brand && !brandNames.has(p.brand)) brandNames.set(p.brand, p.brandName);
    products.push(p); byIdMap.set(p.id, p);
  }
  const brands = (data.brands || []).map(b => ({ ...b }));

  function setManual(list) {
    for (const m of manualProducts) byIdMap.delete(m.id);
    manualProducts = (list || []).map(m => indexOf(decorate(m, true)));
    for (const m of manualProducts) { byIdMap.set(m.id, m); if (m.brand && !brandNames.has(m.brand)) brandNames.set(m.brand, m.brandName); }
  }
  setManual(manual);

  const all = () => products.concat(manualProducts);

  function search(q, { dept = null, brand = null, subcat = null, limit = 100 } = {}) {
    const nq = normalize(q);
    const tokens = nq ? nq.split(' ') : [];
    const out = [];
    for (const p of all()) {
      if (dept !== null && dept !== undefined && p.dept !== dept) continue;
      if (brand && p.brand !== brand) continue;
      if (subcat && !p.subcats.includes(subcat)) continue;
      if (tokens.length && !tokens.every(tk => p._all.includes(tk))) continue;
      let score = 3;
      if (nq && p._n.startsWith(nq)) score = 0;
      else if (nq && p._n.includes(nq)) score = 1;
      else if (tokens.length && tokens.every(tk => p._b.includes(tk))) score = 2;
      out.push({ p, score });
    }
    out.sort((a, b) => a.score - b.score || a.p.name.localeCompare(b.p.name));
    return out.slice(0, limit).map(o => o.p);
  }

  return {
    departments, brands, products,
    byId: (id) => byIdMap.get(id),
    byDept: (deptId) => all().filter(p => p.dept === deptId),
    bySubcat: (id) => all().filter(p => p.subcats.includes(id)),
    byBrand: (slug) => all().filter(p => p.brand === slug),
    subcatsOf: (deptId) => (deptMap.get(deptId)?.subcategories || []).filter(s => s.parent === null),
    deptById: (id) => deptMap.get(id),
    deptKey: (id) => deptMap.get(id)?.slug || 'other',
    brandName: (slug) => brandNames.get(slug) || slug,
    search, setManual,
    generatedAt: data.generatedAt || null,
  };
}

export async function loadCatalog(url = 'data/catalog.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  return res.json();
}
