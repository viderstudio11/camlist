import test from 'node:test';
import assert from 'node:assert/strict';
import { addItem, setQty, setNote, removeItem, getQty, totalQty, groupByDept } from '../js/list.js';

const fx6 = { id: 1, name: 'FX6', brand: 'sony', brandName: 'Sony', dept: 7 };
const lens = { id: 3, name: '24-70', brand: 'sony', brandName: 'Sony', dept: 8 };
const manual = { id: 'm_1', name: 'Shogun', brand: 'atomos', brandName: 'Atomos', dept: 'other' };

test('addItem appends with snapshot, increments if present, never mutates', () => {
  const a = addItem([], fx6);
  assert.deepEqual(a, [{ productId: 1, qty: 1, note: '', snapshot: { name: 'FX6', brand: 'sony', brandName: 'Sony', dept: 7 } }]);
  const b = addItem(a, fx6, 2);
  assert.equal(b[0].qty, 3);
  assert.equal(a[0].qty, 1);
});

test('setQty updates, removes at <=0, ignores unknown', () => {
  const a = addItem(addItem([], fx6), lens);
  assert.equal(setQty(a, 1, 5)[0].qty, 5);
  assert.deepEqual(setQty(a, 1, 0).map(i => i.productId), [3]);
  assert.equal(setQty(a, 42, 5).length, 2);
});

test('setNote and removeItem', () => {
  const a = addItem([], fx6);
  assert.equal(setNote(a, 1, 'Cam A')[0].note, 'Cam A');
  assert.deepEqual(removeItem(a, 1), []);
});

test('getQty and totalQty', () => {
  const a = addItem(addItem([], fx6, 2), lens, 3);
  assert.equal(getQty(a, 1), 2);
  assert.equal(getQty(a, 99), 0);
  assert.equal(totalQty(a), 5);
});

test('groupByDept keeps dept order, insertion order, falls back to snapshot, puts other last', () => {
  const items = addItem(addItem(addItem([], manual), lens), fx6);
  const order = [{ id: 7, key: 'cameras' }, { id: 8, key: 'lenses' }];
  const resolve = (id) => (id === 1 ? fx6 : undefined); // lens + manual missing from catalog
  const g = groupByDept(items, resolve, order);
  assert.deepEqual(g.map(x => x.key), ['cameras', 'lenses', 'other']);
  assert.equal(g[1].entries[0].product.name, '24-70');
  assert.equal(g[2].entries[0].product.name, 'Shogun');
  assert.equal(g[0].entries[0].product, fx6);
});
