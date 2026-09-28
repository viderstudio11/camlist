// Reads the three lighting blocks straight out of style.css and checks the text/background pairs
// against WCAG contrast, so a palette tweak can never quietly bring back faded text in daylight.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

function block(selector) {
  const i = css.indexOf(`${selector} {`);
  assert.ok(i >= 0, `no ${selector} block in style.css`);
  const body = css.slice(i, css.indexOf('}', i));
  const out = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) out[m[1]] = m[2];
  return out;
}

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

const THEMES = { light: ':root', sun: ':root[data-theme="sun"]', dark: ':root[data-theme="dark"]' };

for (const [name, sel] of Object.entries(THEMES)) {
  test(`${name}: text stays readable`, () => {
    const t = block(sel);
    for (const k of ['bg', 'surface', 'text', 'text-2', 'accent', 'accent-ink', 'on-accent']) assert.ok(t[k], `${name} is missing --${k}`);
    const min = name === 'sun' ? 7 : 4.5;
    assert.ok(ratio(t.text, t.bg) >= min, `${name} text/bg ${ratio(t.text, t.bg).toFixed(2)}`);
    assert.ok(ratio(t.text, t.surface) >= 4.5, `${name} text/surface`);
    assert.ok(ratio(t['text-2'], t.bg) >= 4.5, `${name} text-2/bg ${ratio(t['text-2'], t.bg).toFixed(2)}`);
    assert.ok(ratio(t['on-accent'], t.accent) >= 4.5, `${name} on-accent/accent ${ratio(t['on-accent'], t.accent).toFixed(2)}`);
    assert.ok(ratio(t['accent-ink'], t.bg) >= 4.5, `${name} accent-ink/bg ${ratio(t['accent-ink'], t.bg).toFixed(2)}`);
  });
}
