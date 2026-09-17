import test from 'node:test';
import assert from 'node:assert/strict';
import { t, setLang, getLang, dirFor, dict } from '../js/i18n.js';

test('default language is Hebrew and dir is rtl', () => {
  assert.equal(getLang(), 'he');
  assert.equal(dirFor('he'), 'rtl');
  assert.equal(dirFor('en'), 'ltr');
});

test('t interpolates params and falls back to key', () => {
  assert.equal(t('items_count', { n: 3 }, 'en'), '3 items');
  assert.equal(t('nope', {}, 'en'), 'nope');
});

test('setLang switches active language', () => {
  setLang('en');
  assert.equal(t('add_gear'), 'Add gear');
  setLang('he');
  assert.equal(t('add_gear'), 'הוסף ציוד');
});

test('every key exists in both languages', () => {
  assert.deepEqual(Object.keys(dict.he).sort(), Object.keys(dict.en).sort());
});
