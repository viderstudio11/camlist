import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProduct, brandSlug, decodeEntities, buildDeptIndex } from '../scripts/fetch-catalog.js';

const cats = [
  { id: 7, name: 'מצלמות', slug: '%d7%9e%d7%a6%d7%9c%d7%9e%d7%95%d7%aa', parent: 0, count: 138 },
  { id: 12, name: 'Digital Cinema', slug: 'digital-cinema', parent: 7, count: 55 },
  { id: 9, name: 'אביזרים', slug: '%d7%90%d7%91%d7%99%d7%96%d7%a8%d7%99%d7%9d', parent: 0, count: 687 },
  { id: 40, name: 'תת ימי', slug: 'x', parent: 9, count: 5 },
  { id: 99, name: 'תאורה', slug: 'y', parent: 0, count: 300 },
];

test('decodeEntities handles numeric and named entities', () => {
  assert.equal(decodeEntities('ENG 2/3&#8243; B4 &amp; more'), 'ENG 2/3″ B4 & more');
});

test('brandSlug normalizes case and punctuation', () => {
  assert.equal(brandSlug('BLACKMAGIC DESIGN'), 'blackmagic-design');
  assert.equal(brandSlug(' Sony '), 'sony');
  assert.equal(brandSlug("O'Connor"), 'oconnor');
});

test('buildDeptIndex finds the four roots and their descendants', () => {
  const idx = buildDeptIndex(cats);
  assert.deepEqual(idx.departments.map(d => d.slug), ['cameras', 'accessories']);
  assert.deepEqual([...idx.descendants.get(7)], [7, 12]);
  assert.deepEqual([...idx.descendants.get(9)], [9, 40]);
});

test('normalizeProduct assigns first department by order and collects subcats', () => {
  const idx = buildDeptIndex(cats);
  const raw = {
    id: 1, name: 'MISSION 1 PRO &amp; case', permalink: 'https://utopiacam.com/shop/m1/', sku: '',
    images: [{ thumbnail: 'https://x/t.jpg' }],
    categories: [{ id: 7 }, { id: 12 }, { id: 40 }],
    attributes: [{ name: 'מותג', terms: [{ name: 'DJI' }] }],
  };
  const p = normalizeProduct(raw, idx);
  delete p._brandName;
  assert.deepEqual(p, {
    id: 1, name: 'MISSION 1 PRO & case', brand: 'dji', dept: 7, subcats: [12],
    image: 'https://x/t.jpg', url: 'https://utopiacam.com/shop/m1/', sku: '',
  });
});

test('normalizeProduct returns null for products outside the four departments', () => {
  const idx = buildDeptIndex(cats);
  assert.equal(normalizeProduct({ id: 2, name: 'Light', categories: [{ id: 99 }], images: [], attributes: [] }, idx), null);
});
