import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCatalog } from '../js/catalog.js';
import { companionsFor } from '../js/companions.js';

const read = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const catalog = createCatalog(read('catalog.json'), [], read('extra.json'));
const find = (rx) => catalog.products.find(p => rx.test(p.name));
const names = (list) => list.map(p => p.name);

test('a big monitor wants a stand and its cables', () => {
  const got = names(companionsFor(find(/LMD-A180/), catalog));
  assert.deepEqual(got.slice(0, 3), ['Monitor Stand', 'BNC Cable', 'HDMI Cable']);
});

test('a fluid head suggests tripod legs', () => {
  const got = companionsFor(find(/Video 18 Fluid Head/), catalog);
  assert.ok(got.length);
  assert.ok(got.every(p => p.subcats.includes(catalog.departments.find(d => d.slug === 'tripods').subcategories.find(s => s.en === 'Tripod Legs').id)));
});

test('a V-Mount battery suggests V-Mount chargers, its own brand first', () => {
  const got = companionsFor(find(/250Wh V-Mount Battery BP-250S/), catalog);
  assert.ok(got.length);
  assert.ok(got.every(p => /charger|station/i.test(p.name) && /v[-\s]?mount|v[-\s]?lock|fx-?m2s|d-?3004/i.test(p.name)), names(got).join(' | '));
  assert.equal(got[0].brand, 'fxlion');
});

test('a laptop suggests readers for the cards already in the list, and leaves out what is there', () => {
  const card = find(/160GB CFexpress Type A TOUGH/);
  const hub = find(/^USB-C Hub$/);
  const items = [{ productId: card.id, qty: 8 }, { productId: hub.id, qty: 1 }];
  const got = names(companionsFor(find(/^Laptop — Mac$/), catalog, { items, resolve: (id) => catalog.byId(id) }));
  assert.ok(got.some(n => /CFexpress Type A/.test(n) && /reader/i.test(n)), got.join(' | '));
  assert.ok(!got.includes('USB-C Hub'));
});

test('nothing to suggest for a lens', () => {
  assert.deepEqual(companionsFor(find(/FE 28-70mm f\/2 GM/), catalog), []);
});
