import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify, monogram, logoHTML, fallbackHTML, BUILTIN } from '../js/brands.js';

test('slugify matches fetch script rules', () => {
  assert.equal(slugify('Wooden Camera'), 'wooden-camera');
  assert.equal(slugify("O'Connor"), 'oconnor');
});

test('monogram is deterministic and short', () => {
  const a = monogram('smallhd', 'SmallHD'), b = monogram('smallhd', 'SmallHD');
  assert.deepEqual(a, b);
  assert.ok(a.text.length >= 1 && a.text.length <= 3);
  assert.ok(a.hue >= 0 && a.hue < 360);
  assert.equal(monogram('wooden-camera', 'Wooden Camera').text, 'WC');
});

test('fallbackHTML uses built-in wordmark when known, monogram otherwise', () => {
  assert.ok('arri' in BUILTIN);
  const html = fallbackHTML('arri', 'ARRI', 'row');
  assert.match(html, /class="logo logo-row logo-mark/);
  assert.match(html, /ARRI/);
  const mono = fallbackHTML('unknown-brand', 'Unknown Brand', 'tile');
  assert.match(mono, /logo-mono/);
  assert.match(mono, /UB/);
});

test('logoHTML first tries a user logo file and carries data for the fallback', () => {
  const html = logoHTML('arri', 'ARRI', 'tile');
  assert.match(html, /logo-user/);
  assert.match(html, /src="logos\/arri\.png"/);
  assert.match(html, /data-slug="arri" data-name="ARRI" data-size="tile"/);
  assert.match(html, /logos\/arri\.svg/);
});

test('logoHTML with no brand renders a neutral placeholder', () => {
  assert.match(logoHTML(null, null, 'row'), /logo-none/);
});
