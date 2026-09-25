import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

const mem = () => { let s = null; return { get: () => s, set: (v) => { s = v; } }; };

test('starts empty with default settings and persists on change', () => {
  const st = mem();
  const store = createStore(st);
  assert.deepEqual(store.state.settings, { lang: 'he', techManager: '', theme: 'light' });
  store.setSettings({ lang: 'en' });
  assert.equal(JSON.parse(st.get()).settings.lang, 'en');
  assert.equal(createStore(st).state.settings.lang, 'en');
});

test('project CRUD + duplicate + items', () => {
  const store = createStore(mem());
  const p = store.createProject({ name: 'Race', techManager: 'Amir' });
  assert.match(p.id, /^p_/);
  assert.equal(store.getProject(p.id).name, 'Race');
  store.setItems(p.id, [{ productId: 1, qty: 2, note: '', snapshot: { name: 'FX6', brand: 'sony', brandName: 'Sony', dept: 7 } }]);
  const d = store.duplicateProject(p.id);
  assert.notEqual(d.id, p.id);
  assert.equal(d.items.length, 1);
  assert.equal(d.name, 'Race (2)');
  store.updateProject(p.id, { name: 'Race 12' });
  assert.equal(store.getProject(p.id).name, 'Race 12');
  store.deleteProject(p.id);
  assert.equal(store.state.projects.length, 1);
});

test('manual products: add, refuse delete when used', () => {
  const store = createStore(mem());
  const m = store.addManualProduct({ name: 'Shogun', brand: 'atomos', brandName: 'Atomos', dept: 'other' });
  assert.match(m.id, /^m_/);
  const p = store.createProject({ name: 'X' });
  store.setItems(p.id, [{ productId: m.id, qty: 1, note: '', snapshot: {} }]);
  assert.deepEqual(store.deleteManualProduct(m.id), { ok: false, usedBy: ['X'] });
  store.setItems(p.id, []);
  assert.deepEqual(store.deleteManualProduct(m.id), { ok: true, usedBy: [] });
});

test('backup export/import merges by id, rejects invalid', () => {
  const a = createStore(mem());
  const p = a.createProject({ name: 'A' });
  const m = a.addManualProduct({ name: 'M', brand: null, brandName: null, dept: 'other' });
  const backup = a.exportBackup();
  assert.equal(backup.app, 'camlist');
  const b = createStore(mem());
  b.createProject({ name: 'B' });
  const r = b.importBackup(backup);
  assert.deepEqual(r, { projects: 1, manual: 1 });
  assert.deepEqual(b.state.projects.map(x => x.name).sort(), ['A', 'B']);
  assert.equal(b.state.manualProducts[0].id, m.id);
  b.importBackup({ ...backup, projects: [{ ...p, name: 'A2' }] });
  assert.equal(b.getProject(p.id).name, 'A2');
  assert.throws(() => b.importBackup({ app: 'other' }));
  assert.throws(() => b.importBackup(null));
});

test('subscribe fires on every mutation', () => {
  const store = createStore(mem());
  let n = 0; store.subscribe(() => n++);
  store.createProject({ name: 'X' });
  store.setSettings({ techManager: 'A' });
  assert.equal(n, 2);
});
