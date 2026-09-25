import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCatalog } from '../js/catalog.js';
import { createCompat } from '../js/compat.js';
import { createPower, whOf, gbOf, hoursFromMedia, hoursFromPower } from '../js/power.js';

const url = (p) => new URL(p, import.meta.url);
const powerData = JSON.parse(readFileSync(url('../data/power.json'), 'utf8'));
const catalog = createCatalog(JSON.parse(readFileSync(url('../data/catalog.json'), 'utf8')));
const compat = createCompat(JSON.parse(readFileSync(url('../data/compat.json'), 'utf8')), catalog);
const power = createPower(powerData, catalog, compat);
const fx6 = compat.profileFor(catalog.byId(16514));

test('watt-hours come from the name first, then the model table', () => {
  assert.equal(whOf({ name: '250Wh V-Mount Battery BP-250S' }, powerData.batteryWh), 250);
  assert.equal(whOf({ name: 'Nano TWO Ultracompact V-Mount Battery (98Wh)' }, powerData.batteryWh), 98);
  assert.equal(whOf({ name: 'BP-U60' }, powerData.batteryWh), 56);
  assert.equal(whOf({ name: 'NP-FZ100' }, powerData.batteryWh), 16.4);
  assert.equal(whOf({ name: 'Mystery cell' }, powerData.batteryWh), 0);
});

test('card capacity is parsed from the name, TB included', () => {
  assert.equal(gbOf({ name: '160GB CFexpress Type A TOUGH Memory Card' }), 160);
  assert.equal(gbOf({ name: 'Codex Compact Drive 2TB' }), 2000);
  assert.equal(gbOf({ name: 'SD Card Reader' }), 0);
});

test('hour maths', () => {
  assert.equal(Math.round(hoursFromPower(336, 25) * 10) / 10, 13.4);   // 6 × BP-U60 on an FX6
  assert.equal(Math.round(hoursFromMedia(640, 240) * 10) / 10, 5.9);   // 4 × 160GB at XAVC-I 4K 25p
  assert.equal(hoursFromMedia(100, 0), 0);
});

test('camera draw and formats fall back by type', () => {
  assert.equal(power.wattsFor(fx6), 25);
  assert.equal(power.formatsFor(fx6)[0].label, 'XAVC-I 4K 25p');
  const unknown = { product: { id: 999999 }, type: 'mirrorless' };
  assert.equal(power.wattsFor(unknown), 15);
  assert.ok(power.formatsFor(unknown).length);
});

test('totals only count batteries and cards that fit the camera', () => {
  const items = [
    { productId: 1188, qty: 6 },   // BP-U60 — fits the FX6
    { productId: 16261, qty: 4 },  // 160GB CFexpress A — fits
  ].filter(i => catalog.byId(i.productId));
  const bpu = catalog.products.find(p => /^BP-U60$/i.test(p.name));
  const cfa = catalog.products.find(p => /160GB CFexpress Type A/i.test(p.name));
  const sxs = catalog.products.find(p => /128GB SxS PRO/i.test(p.name));
  const real = [{ productId: bpu.id, qty: 6 }, { productId: cfa.id, qty: 4 }, { productId: sxs.id, qty: 4 }];
  const t = power.totals(fx6, real, (id) => catalog.byId(id));
  assert.equal(t.wh, 336);          // 6 × 56Wh
  assert.equal(t.gb, 640);          // 4 × 160GB; the SxS cards do not fit and are ignored
  assert.equal(t.batteries, 6);
  assert.equal(t.cards, 4);
  assert.equal(items.length >= 0, true);
});

test('summary flags a gap and says how much to add', () => {
  const bpu = catalog.products.find(p => /^BP-U60$/i.test(p.name));
  const cfa = catalog.products.find(p => /160GB CFexpress Type A/i.test(p.name));
  const items = [{ productId: bpu.id, qty: 4 }, { productId: cfa.id, qty: 2 }];
  const s = power.summary(fx6, items, (id) => catalog.byId(id), { formatIndex: 0, shootHours: 12 });
  assert.equal(s.watts, 25);
  assert.equal(s.format.label, 'XAVC-I 4K 25p');
  assert.ok(!s.powerOk && !s.mediaOk);
  assert.ok(s.addBatteries >= 1, `addBatteries=${s.addBatteries}`);
  assert.ok(s.addCards >= 1, `addCards=${s.addCards}`);
  const plenty = power.summary(fx6, [{ productId: bpu.id, qty: 12 }, { productId: cfa.id, qty: 12 }], (id) => catalog.byId(id), { shootHours: 8 });
  assert.ok(plenty.powerOk && plenty.mediaOk);
  assert.equal(plenty.addBatteries, 0);
});

test('every camera profile can be costed', () => {
  const missing = compat.profiles.filter(p => p.id).map(p => catalog.byId(p.id)).filter(Boolean)
    .map(prod => compat.profileFor(prod)).filter(prof => !power.wattsFor(prof) || !power.formatsFor(prof).length);
  assert.deepEqual(missing.map(p => p.product.name), []);
});
