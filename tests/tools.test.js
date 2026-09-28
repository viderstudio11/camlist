import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMedia } from '../js/tools/media.js';
import { timeFromAngle, angleFromTime, asFraction, flicker, safeAngles, slowMotion, FRAME_RATES, shutterChoices } from '../js/tools/shutter.js';
import { coverage, focalFor, angleOfView, nearestPrime, sensor, SHOTS, lensFor, frameAt, pickLens, toUnit, fromUnit } from '../js/tools/fov.js';
import { sunDay, crossings } from '../js/tools/solar.js';
import { offload, convert, cToF, fToC, mahToWh } from '../js/tools/convert.js';

const url = (p) => new URL(p, import.meta.url);
const media = createMedia(JSON.parse(readFileSync(url('../data/codecs.json'), 'utf8')));

test('ProRes matches the rates Apple publishes', () => {
  // Apple ProRes White Paper: 422 HQ is 220 Mbps at 1920×1080 29.97p, 707 at UHD 29.97p.
  assert.ok(Math.abs(media.mbps('prores-hq', 'hd', 29.97) - 220) < 3, media.mbps('prores-hq', 'hd', 29.97));
  // 707 Mbps is Apple's UHD figure at 24p; at 29.97 the same codec is four times the HD rate.
  assert.ok(Math.abs(media.mbps('prores-hq', 'uhd', 24) - 707) < 10, media.mbps('prores-hq', 'uhd', 24));
  assert.ok(Math.abs(media.mbps('prores-hq', 'uhd', 29.97) - 880) < 12, media.mbps('prores-hq', 'uhd', 29.97));
  // 4444 XQ: 500 at HD, 1591 at UHD.
  assert.ok(Math.abs(media.mbps('prores-xq', 'hd', 29.97) - 500) < 5);
  assert.ok(Math.abs(media.mbps('prores-xq', 'uhd', 24) - 1591) < 20);
  // Proxy is the cheapest of the family.
  assert.ok(media.mbps('prores-proxy', 'uhd', 25) < media.mbps('prores-lt', 'uhd', 25));
});

test('ProRes scales with frame rate, XAVC-L does not', () => {
  const hq25 = media.mbps('prores-hq', 'uhd', 25);
  const hq50 = media.mbps('prores-hq', 'uhd', 50);
  assert.ok(Math.abs(hq50 / hq25 - 2) < 0.01, `${hq25} → ${hq50}`);
  assert.equal(media.mbps('xavc-l', 'uhd', 25), media.mbps('xavc-l', 'uhd', 50));
});

test('XAVC-I follows the figures in the Sony manuals', () => {
  assert.ok(Math.abs(media.mbps('xavc-i', 'uhd', 25) - 240) < 1, media.mbps('xavc-i', 'uhd', 25));
  assert.ok(Math.abs(media.mbps('xavc-i', 'uhd', 50) - 500) < 1);
  assert.ok(Math.abs(media.mbps('xavc-i', 'hd', 25) - 112) < 1);
  // 40p is not published, so it lands between 30p and 50p.
  const at40 = media.mbps('xavc-i', 'uhd', 40);
  assert.ok(at40 > 300 && at40 < 500, at40);
});

test('card hours and how many cards a day needs', () => {
  const rate = media.mbps('xavc-i', 'uhd', 25);        // 240 Mbps
  const hours = media.hoursOn(160, rate);               // a 160GB CFexpress A
  assert.ok(Math.abs(hours - 1.48) < 0.05, hours);
  assert.equal(media.cardsFor(10, 160, rate), 7);
  assert.ok(Math.abs(media.gbPerHour(rate) - 108) < 1);
});

test('ARRIRAW is huge, and huge in the right proportion', () => {
  const raw = media.mbps('arriraw', '4.6kog', 24);
  // 4608 × 3164 × 24 × 12 bits ≈ 4.2 Gbps
  assert.ok(raw > 4000 && raw < 4300, raw);
  assert.ok(media.mbps('prores-hq', 'uhd', 24) < raw / 5);
});

test('shutter angle and exposure time are the same statement', () => {
  assert.ok(Math.abs(timeFromAngle(25, 180) - 1 / 50) < 1e-9);
  assert.equal(asFraction(timeFromAngle(25, 180)), '1/50');
  assert.equal(asFraction(timeFromAngle(24, 172.8)), '1/50');
  assert.ok(Math.abs(angleFromTime(25, 1 / 50) - 180) < 1e-9);
});

test('flicker: 1/50 is safe on 50 Hz, 1/60 is not', () => {
  assert.equal(flicker(1 / 50, 50).safe, true);
  assert.equal(flicker(1 / 100, 50).safe, true);
  assert.equal(flicker(1 / 60, 50).safe, false);
  assert.equal(flicker(1 / 60, 60).safe, true);
  const angles = safeAngles(25, 50);
  assert.equal(angles[0].angle, 180);           // nearest to 180 comes first
  assert.ok(angles.every(a => flicker(a.seconds, 50).safe));
});

test('slow motion factor', () => {
  assert.equal(slowMotion(50, 25).factor, 2);
  assert.equal(slowMotion(25, 25).label, '1:1');
  assert.ok(slowMotion(120, 25).label.includes('slower'));
});

test('field of view: the lens that frames a full figure', () => {
  const s = sensor('s35');
  // A 2.2 m frame width from 4 m on Super 35
  const f = focalFor(s.w, 2.2, 4);
  assert.ok(Math.abs(f - 45.3) < 0.5, f);
  assert.equal(nearestPrime(f), 50);
  const c = coverage('s35', 50, 4);
  assert.ok(Math.abs(c.widthM - 1.99) < 0.02, c.widthM);
  // A 50 mm is wider on full frame than on Super 35
  assert.ok(angleOfView(36, 50) > angleOfView(24.89, 50));
});

test('sun: Tel Aviv in late September', () => {
  const day = sunDay(new Date(Date.UTC(2026, 8, 26)), 32.0853, 34.7818);
  assert.ok(day.sunrise instanceof Date && day.sunset instanceof Date);
  // Four days after the equinox the day is a little under twelve hours.
  assert.ok(day.dayLengthHours > 11.6 && day.dayLengthHours < 12.2, day.dayLengthHours);
  assert.ok(day.sunrise < day.noon && day.noon < day.sunset);
  // Golden hour sits against sunrise and sunset, and lasts well under two hours.
  assert.equal(+day.goldenMorning.from, +day.sunrise);
  assert.equal(+day.goldenEvening.to, +day.sunset);
  const goldenMin = (day.goldenMorning.to - day.goldenMorning.from) / 60000;
  assert.ok(goldenMin > 20 && goldenMin < 90, goldenMin);
  // Blue hour comes before sunrise and after sunset.
  assert.ok(day.blueMorning.from < day.sunrise);
  assert.ok(day.blueEvening.to > day.sunset);
});

test('sun: the poles do not have a sunrise in midwinter', () => {
  const c = crossings(new Date(Date.UTC(2026, 11, 21)), 78.2, 15.6); // Svalbard
  assert.equal(c.rise, null);
  assert.equal(sunDay(new Date(Date.UTC(2026, 11, 21)), 78.2, 15.6).polar, true);
});

test('offload time counts every copy and the read-back', () => {
  const r = offload({ gb: 1000, mbPerSec: 500, copies: 2, verify: true });
  assert.ok(Math.abs(r.perCopyHours - 0.555) < 0.01, r.perCopyHours);
  assert.equal(r.passes, 4);
  assert.ok(Math.abs(r.totalHours - 2.22) < 0.02, r.totalHours);
  assert.equal(r.totalGb, 2000);
  assert.equal(offload({ gb: 0, mbPerSec: 500 }).totalHours, 0);
});

test('unit conversion', () => {
  assert.ok(Math.abs(convert('length', 'in', 'mm', 1) - 25.4) < 1e-6);
  assert.ok(Math.abs(convert('length', 'm', 'ft', 1) - 3.28084) < 1e-4);
  assert.ok(Math.abs(convert('weight', 'kg', 'lb', 1) - 2.20462) < 1e-4);
  assert.ok(Math.abs(convert('data', 'tb', 'gb', 1) - 1000) < 1e-9);
  assert.ok(Math.abs(convert('rate', 'mbs', 'mbps', 1) - 8) < 1e-9);
  assert.equal(cToF(0), 32);
  assert.ok(Math.abs(fToC(212) - 100) < 1e-9);
  assert.ok(Math.abs(mahToWh(6600, 14.4) - 95.04) < 0.01);
});

test('frame rates are the ones cameras offer today, up to 240', () => {
  assert.deepEqual(FRAME_RATES, [23.98, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 100, 119.88, 120, 150, 180, 200, 240]);
});

test('shutter speeds: only what the frame allows, flicker-safe marked, 180° recommended', () => {
  const pal = shutterChoices(25, 50, 'speed');
  assert.equal(pal.recommended.label, '1/50');
  assert.ok(pal.anySafe);
  assert.ok(pal.options.every(o => o.seconds <= 1 / 25 + 1e-9), 'no exposure longer than a frame');
  assert.ok(pal.options.find(o => o.label === '1/50').safe);
  assert.equal(pal.options.find(o => o.label === '1/60').safe, false);

  // 24p under 60 Hz light: 1/48 would flicker, the nearest safe speed is 1/60.
  assert.equal(shutterChoices(24, 60, 'speed').recommended.label, '1/60');

  // 120 fps under 50 Hz: nothing short enough is flicker-free — say so, still recommend 180°.
  const hs = shutterChoices(120, 50, 'speed');
  assert.equal(hs.anySafe, false);
  assert.equal(hs.recommended.label, '1/240');
});

test('shutter angles: common angles plus the safe ones, 180° recommended at 25p', () => {
  const a = shutterChoices(25, 50, 'angle');
  assert.equal(a.recommended.value, 180);
  assert.ok(a.options.every(o => o.value > 0 && o.value <= 360));
  assert.ok(a.options.some(o => o.value === 172.8));
  // 24p under 50 Hz: 180° (1/48) flickers, 172.8° (1/50) is the safe classic.
  assert.equal(shutterChoices(24, 50, 'angle').recommended.value, 172.8);
});

test('shot sizes are framed by height, like an operator frames a person', () => {
  assert.deepEqual(SHOTS.map(s => s.id), ['ecu', 'cu', 'chest', 'waist', 'knees', 'full', 'wide']);
  assert.ok(SHOTS.every((s, i) => i === 0 || s.height > SHOTS[i - 1].height), 'tighter to wider');
  assert.equal(SHOTS.find(s => s.id === 'full').height, 2.0);
});

test('lens for a shot: sensor height × distance ÷ frame height', () => {
  // FX6 in UHD (20.0 mm high), 4 m away, waist shot (1.1 m of person): 72.7 mm.
  const fx6 = { w: 35.6, h: 20.0 };
  assert.ok(Math.abs(lensFor(fx6, 4, 1.1) - 72.73) < 0.01);
  // What that lens then shows: the frame height comes back to 1.1 m, the width follows 16:9.
  const f = frameAt(fx6, lensFor(fx6, 4, 1.1), 4);
  assert.ok(Math.abs(f.heightM - 1.1) < 1e-9);
  assert.ok(Math.abs(f.widthM - 1.958) < 0.001);
});

test('pickLens names a real lens: a zoom that covers it, else the nearest prime', () => {
  const lenses = [{ min: 25, max: 25 }, { min: 35, max: 35 }, { min: 50, max: 50 }, { min: 85, max: 85 }];
  assert.deepEqual(pickLens(72.7, lenses), { min: 85, max: 85, focal: 85 });
  assert.deepEqual(pickLens(40, lenses), { min: 35, max: 35, focal: 35 });
  assert.deepEqual(pickLens(72.7, [...lenses, { min: 24, max: 70 }, { min: 70, max: 200 }]), { min: 70, max: 200, focal: 73 });
  assert.equal(pickLens(50, []), null);
});

test('distances read in metres or feet', () => {
  assert.ok(Math.abs(toUnit(4, 'ft') - 13.1234) < 0.001);
  assert.equal(toUnit(4, 'm'), 4);
  assert.ok(Math.abs(fromUnit(10, 'ft') - 3.048) < 1e-9);
  assert.equal(fromUnit(3, 'm'), 3);
});

test('camera formats: official recording times become rates that give the same times back', () => {
  const m = createMedia({
    frameRates: [25, 50],
    codecs: [{ id: 'xavc-i', label: 'XAVC-I', model: 'points', src: 'published', points: { uhd: { 25: 240, 50: 500 } } }],
    resolutions: [{ id: 'uhd', label: 'UHD 3840×2160', w: 3840, h: 2160, tier: 'uhd' }],
    cameras: [
      { id: 'fx5', brand: 'Sony', label: 'FX5', formats: [
        { id: 'si-uhd', codec: 'XAVC S-I', res: 'UHD 3840×2160', card: 960, minutes: { '59.94': 205, 25: 488, '23.98': 508 }, src: 'Sony Help Guide' },
      ] },
      { id: 'fx6', brand: 'Sony', label: 'PXW-FX6', formats: [['xavc-i', 'uhd']] },
    ],
  });
  const fx5 = m.formatsOf(m.cameras[0]);
  assert.equal(fx5.length, 1);
  assert.deepEqual(fx5[0].fps, [23.98, 25, 59.94]);
  assert.equal(fx5[0].official, true);
  const r = fx5[0].rate(25);
  assert.ok(Math.abs(r - 262.3) < 0.1, r);
  assert.ok(Math.abs(m.hoursOn(960, r) * 60 - 488) < 1e-6, 'gives Sony\'s 488 minutes back');
  assert.equal(fx5[0].rate(30), 0, 'a frame rate the format does not record gives nothing');

  const fx6 = m.formatsOf(m.cameras[1]);
  assert.deepEqual(fx6[0].fps, [25, 50]);
  assert.equal(fx6[0].rate(25), 240);
  assert.equal(fx6[0].label, 'XAVC-I · UHD 3840×2160');
  assert.equal(fx6[0].official, true);
});
