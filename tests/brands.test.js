import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, logoHTML, fallbackHTML, setLogoIndex, hasLogoFile, hueOf, BUILTIN } from '../js/brands.js';

test('slugify matches fetch script rules', () => {
  assert.equal(slugify('Wooden Camera'), 'wooden-camera');
  assert.equal(slugify("O'Connor"), 'oconnor');
});

test('fallbackHTML always shows the full brand name, never initials', () => {
  assert.ok('arri' in BUILTIN);
  assert.match(fallbackHTML('arri', 'ARRI', 'row'), /class="logo logo-row logo-text[^>]*>ARRI</);
  const html = fallbackHTML('wooden-camera', 'Wooden Camera', 'tile');
  assert.match(html, />Wooden Camera</);
  assert.doesNotMatch(html, />WC</);
  const unknown = fallbackHTML('some-new-brand', 'Some New Brand', 'row');
  assert.match(unknown, />Some New Brand</);
  assert.match(unknown, /hsl\(/);
});

test('hueOf is deterministic', () => {
  assert.equal(hueOf('smallhd'), hueOf('smallhd'));
  assert.ok(hueOf('smallhd') >= 0 && hueOf('smallhd') < 360);
});

test('logoHTML uses the index file with its plate, falls back to text otherwise', () => {
  setLogoIndex({ 'arri.svg': 'light', 'teradek.svg': 'dark' });
  assert.ok(hasLogoFile('arri') && !hasLogoFile('sony'));
  assert.match(logoHTML('arri', 'ARRI', 'tile'), /logo-img plate-light[^>]*><img src="logos\/arri\.svg"/);
  assert.match(logoHTML('teradek', 'Teradek', 'row'), /plate-dark/);
  assert.match(logoHTML('sony', 'Sony', 'row'), /logo-text[^>]*>Sony</);
  setLogoIndex(['sony.png']); // legacy array form
  assert.match(logoHTML('sony', 'Sony', 'row'), /logos\/sony\.png/);
});

test('logoHTML with no brand renders a neutral placeholder', () => {
  assert.match(logoHTML(null, null, 'row'), /logo-none/);
});
