import test from 'node:test';
import assert from 'node:assert/strict';
import { isSplitRoute, SPLIT_MIN, panesToRefresh } from '../js/layout.js';

test('the list and the catalog share one screen on a desktop-wide window', () => {
  assert.equal(SPLIT_MIN, 1024);
  assert.equal(isSplitRoute('#/p/x', 1280), true);
  assert.equal(isSplitRoute('#/p/p_mu5o23/add', 1280), true);
  assert.equal(isSplitRoute('#/p/x/export', 1280), false);
  assert.equal(isSplitRoute('#/p/x/print', 1280), false);
  assert.equal(isSplitRoute('#/p/x', 800), false);
  assert.equal(isSplitRoute('#/p/x', 1024), true);
  assert.equal(isSplitRoute('#/', 1280), false);
  assert.equal(isSplitRoute('#/tools', 1280), false);
});

test('after a change only the pane you are not working in redraws', () => {
  // Redrawing the pane under your finger would swallow the click that caused the change.
  assert.deepEqual(panesToRefresh({ inList: true, inCat: false }), { list: false, cat: true });
  assert.deepEqual(panesToRefresh({ inList: false, inCat: true }), { list: true, cat: false });
  assert.deepEqual(panesToRefresh({ inList: false, inCat: false }), { list: true, cat: true });
});
