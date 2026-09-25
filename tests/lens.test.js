import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lensTypes } from '../js/lens.js';
import { createCatalog } from '../js/catalog.js';

test('zoom vs prime from the name', () => {
  assert.deepEqual(lensTypes({ name: 'FE 24-70mm f/2.8 GM II' }), ['zoom']);
  assert.deepEqual(lensTypes({ name: 'Supreme Prime 50mm T1.5' }), ['prime']);
  assert.deepEqual(lensTypes({ name: 'HJ14ex4.3B-IRSE HD Wide Lens' }), ['zoom']);
  assert.deepEqual(lensTypes({ name: 'Optimo 24-290 T2.8' }), ['zoom']);
});

test('subcategories win over the name', () => {
  assert.deepEqual(lensTypes({ name: 'Mystery glass' }, ['35mm Zoom']), ['zoom']);
  assert.deepEqual(lensTypes({ name: 'Mystery glass' }, ['35mm Prime']), ['prime']);
});

test('adapters and extenders are their own type and nothing else', () => {
  assert.deepEqual(lensTypes({ name: 'PL TO LPL LENS ADAPTER' }), ['adapter']);
  assert.deepEqual(lensTypes({ name: 'Optimo PLx2 Extender' }), ['adapter']);
  assert.deepEqual(lensTypes({ name: 'EF lens mount' }), ['adapter']);
});

test('sets, anamorphics, macro and vintage can overlap with prime/zoom', () => {
  assert.deepEqual(lensTypes({ name: 'Master Prime T1.3 Lens Set' }).sort(), ['prime', 'set']);
  const orion = lensTypes({ name: 'Orion ANAMORPHIC T2 Lens set' }).sort();
  assert.deepEqual(orion, ['anamorphic', 'set']);
  assert.ok(lensTypes({ name: '100mm T2.9 Macro Lens PL' }).includes('macro'));
  assert.ok(lensTypes({ name: '100mm T2.9 Macro Lens PL' }).includes('prime'));
  assert.ok(lensTypes({ name: 'Canon K35 55mm' }, ['Vintage Lenses']).includes('vintage'));
});

test('every lens in the real catalog gets at least one type', () => {
  const cat = createCatalog(JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8')));
  const dept = cat.departments.find(d => d.slug === 'lenses');
  const subName = (id) => dept.subcategories.find(s => s.id === id)?.en;
  const lenses = cat.byDept(dept.id);
  const untyped = lenses.filter(p => !lensTypes(p, p.subcats.map(subName).filter(Boolean)).length);
  assert.equal(untyped.length, 0, `untyped: ${untyped.slice(0, 5).map(p => p.name).join(' | ')}`);
});
