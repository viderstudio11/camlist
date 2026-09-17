import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog, normalize } from '../js/catalog.js';

const data = {
  departments: [
    { id: 7, slug: 'cameras', he: 'מצלמות', en: 'Cameras', order: 1, subcategories: [{ id: 12, parent: null, he: 'Digital Cinema', en: 'Digital Cinema', count: 2 }] },
    { id: 8, slug: 'lenses', he: 'עדשות', en: 'Lenses', order: 2, subcategories: [{ id: 20, parent: null, he: 'Full Frame', en: 'Full Frame', count: 1 }] },
  ],
  brands: [{ id: 'sony', name: 'Sony', count: 2 }, { id: 'arri', name: 'ARRI', count: 1 }],
  products: [
    { id: 1, name: 'FX6', brand: 'sony', dept: 7, subcats: [12], image: null, url: 'u1', sku: '' },
    { id: 2, name: 'ALEXA 35', brand: 'arri', dept: 7, subcats: [12], image: null, url: 'u2', sku: '' },
    { id: 3, name: 'FE 24-70mm f/2.8 GM II', brand: 'sony', dept: 8, subcats: [20], image: null, url: 'u3', sku: '' },
  ],
};

test('normalize lowercases and unifies separators', () => {
  assert.equal(normalize('FE 24-70mm f/2.8 GM II'), 'fe 24 70mm f 2 8 gm ii');
});

test('search is AND over tokens, dash/space insensitive, ranks name-prefix first', () => {
  const c = createCatalog(data);
  assert.deepEqual(c.search('24 70').map(p => p.id), [3]);
  assert.deepEqual(c.search('24-70').map(p => p.id), [3]);
  assert.deepEqual(c.search('sony').map(p => p.id), [1, 3]);
  assert.deepEqual(c.search('fx').map(p => p.id), [1]);
  assert.deepEqual(c.search('sony gm').map(p => p.id), [3]);
  assert.deepEqual(c.search('digital cinema').map(p => p.id).sort(), [1, 2]);
});

test('search filters by dept/brand and respects limit', () => {
  const c = createCatalog(data);
  assert.deepEqual(c.search('sony', { dept: 8 }).map(p => p.id), [3]);
  assert.deepEqual(c.search('', { brand: 'sony' }).map(p => p.id), [1, 3]);
  assert.equal(c.search('', { limit: 1 }).length, 1);
});

test('manual products are included and flagged', () => {
  const c = createCatalog(data, [{ id: 'm_1', name: 'Shogun 7', brand: 'atomos', brandName: 'Atomos', dept: 'other' }]);
  const r = c.search('shogun');
  assert.equal(r.length, 1);
  assert.equal(r[0].manual, true);
  assert.equal(c.byId('m_1').name, 'Shogun 7');
  assert.equal(c.brandName('atomos'), 'Atomos');
  c.setManual([]);
  assert.equal(c.search('shogun').length, 0);
});

test('indexes and helpers', () => {
  const c = createCatalog(data);
  assert.deepEqual(c.byDept(7).map(p => p.id), [1, 2]);
  assert.deepEqual(c.bySubcat(20).map(p => p.id), [3]);
  assert.deepEqual(c.byBrand('sony').map(p => p.id), [1, 3]);
  assert.equal(c.deptKey(7), 'cameras');
  assert.equal(c.deptKey('other'), 'other');
  assert.equal(c.deptKey(999), 'other');
  assert.equal(c.byId(2).brandName, 'ARRI');
  assert.deepEqual(c.subcatsOf(7).map(s => s.id), [12]);
});
