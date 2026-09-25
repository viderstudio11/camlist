import { esc, icons } from './dom.js';
import { createMedia } from '../tools/media.js';
import { timeFromAngle, angleFromTime, asFraction, flicker, safeAngles, slowMotion, COMMON_ANGLES } from '../tools/shutter.js';
import { SENSORS, SUBJECTS, coverage, focalFor, nearestPrime, sensor } from '../tools/fov.js';
import { sunDay, PLACES } from '../tools/solar.js';
import { offload, DRIVES, UNIT_GROUPS, convert, cToF, fToC, mahToWh, whToMah } from '../tools/convert.js';
import { num, hm } from '../format.js';

// Tool labels live here rather than in the global dictionary: they are only ever used on this screen,
// and keeping the pair next to the tool makes it obvious when one side is missing.
const L = {
  tools:      { he: 'כלי עזר', en: 'Tools' },
  tools_sub:  { he: 'מחשבונים לשטח — לא נכנסים לרשימה ולא להדפסה', en: 'Field calculators — they stay out of the list and out of the print' },
  media:      { he: 'מדיה וסוללות', en: 'Media & power' },
  media_sub:  { he: 'כמה נכנס לכרטיס, כמה כרטיסים ליום', en: 'What fits on a card, how many a day needs' },
  fov:        { he: 'בחירת עדשה', en: 'Lens choice' },
  fov_sub:    { he: 'איזה מוקד מכסה את הפריים מהמרחק הזה', en: 'Which focal length covers the frame from there' },
  shutter:    { he: 'פריים רייט ושאטר', en: 'Frame rate & shutter' },
  shutter_sub:{ he: 'זווית תריס, מהירות, ופליקר', en: 'Shutter angle, speed and flicker' },
  offload:    { he: 'זמן העתקה', en: 'Offload time' },
  offload_sub:{ he: 'כמה זמן ייקח הדאמפ בסוף היום', en: 'How long the dump takes at wrap' },
  sun:        { he: 'שקיעה וזריחה', en: 'Sun times' },
  sun_sub:    { he: 'שעת זהב, שעה כחולה, אורך יום', en: 'Golden hour, blue hour, day length' },
  units:      { he: 'המרת מידות', en: 'Unit conversion' },
  units_sub:  { he: 'מטרי ואימפריאלי, נתונים, סוללות', en: 'Metric and imperial, data, batteries' },

  codec: { he: 'קודק', en: 'Codec' },
  res: { he: 'רזולוציה', en: 'Resolution' },
  fps: { he: 'פריים רייט', en: 'Frame rate' },
  card: { he: 'גודל כרטיס', en: 'Card size' },
  bitrate: { he: 'קצב נתונים', en: 'Data rate' },
  per_hour: { he: 'לשעה', en: 'Per hour' },
  on_card: { he: 'על כרטיס אחד', en: 'On one card' },
  cards_needed: { he: 'כרטיסים ליום', en: 'Cards per day' },
  shoot_hours: { he: 'שעות צילום ביום', en: 'Shoot hours per day' },
  source: { he: 'מקור', en: 'Source' },

  sensor_f: { he: 'פורמט חיישן', en: 'Sensor format' },
  distance: { he: 'מרחק (מטר)', en: 'Distance (m)' },
  subject: { he: 'גודל פריים', en: 'Frame size' },
  frame_w: { he: 'רוחב פריים (מטר)', en: 'Frame width (m)' },
  need_lens: { he: 'המוקד הדרוש', en: 'Focal length needed' },
  nearest: { he: 'העדשה הקרובה בסט', en: 'Nearest prime in the set' },
  covers: { he: 'מכסה', en: 'Covers' },
  angle_h: { he: 'זווית אופקית', en: 'Horizontal angle' },
  check_lens: { he: 'בדיקה הפוכה — מה עדשה נתונה מכסה', en: 'The other way round — what a given lens covers' },
  focal: { he: 'מוקד (מ״מ)', en: 'Focal length (mm)' },

  angle: { he: 'זווית תריס', en: 'Shutter angle' },
  speed: { he: 'מהירות תריס', en: 'Shutter speed' },
  mains: { he: 'תדר רשת החשמל', en: 'Mains frequency' },
  flicker_ok: { he: 'נקי מפליקר', en: 'Flicker free' },
  flicker_bad: { he: 'עלול להבהב בתאורת רשת', en: 'May flicker under mains light' },
  safe_angles: { he: 'זוויות בטוחות בפריים רייט הזה', en: 'Safe angles at this frame rate' },
  project_fps: { he: 'פריים רייט של הפרויקט', en: 'Project frame rate' },
  slowmo: { he: 'סלואו מושן', en: 'Slow motion' },

  footage: { he: 'כמות חומר (GB)', en: 'Footage (GB)' },
  drive: { he: 'יעד', en: 'Destination' },
  speed_mb: { he: 'מהירות (MB/s)', en: 'Speed (MB/s)' },
  copies: { he: 'מספר עותקים', en: 'Copies' },
  verify: { he: 'כולל אימות', en: 'Verify each copy' },
  per_copy: { he: 'עותק אחד', en: 'One copy' },
  total_time: { he: 'סה״כ', en: 'Total' },
  total_space: { he: 'מקום נדרש', en: 'Space needed' },

  place: { he: 'מקום', en: 'Place' },
  date: { he: 'תאריך', en: 'Date' },
  my_location: { he: 'המיקום שלי', en: 'My location' },
  sunrise: { he: 'זריחה', en: 'Sunrise' },
  sunset: { he: 'שקיעה', en: 'Sunset' },
  golden_am: { he: 'שעת זהב · בוקר', en: 'Golden hour · morning' },
  golden_pm: { he: 'שעת זהב · ערב', en: 'Golden hour · evening' },
  blue_am: { he: 'שעה כחולה · בוקר', en: 'Blue hour · morning' },
  blue_pm: { he: 'שעה כחולה · ערב', en: 'Blue hour · evening' },
  noon: { he: 'שיא היום', en: 'Solar noon' },
  day_len: { he: 'אורך יום', en: 'Day length' },
  polar: { he: 'במקום הזה השמש לא זורחת או לא שוקעת בתאריך הזה', en: 'At this place the sun does not rise or set on this date' },

  group: { he: 'סוג', en: 'Type' },
  value: { he: 'ערך', en: 'Value' },
  temp: { he: 'טמפרטורה', en: 'Temperature' },
  battery_wh: { he: 'סוללה — mAh ל-Wh', en: 'Battery — mAh to Wh' },
  volts: { he: 'מתח (V)', en: 'Voltage (V)' },
  back_tools: { he: 'כל הכלים', en: 'All tools' },
};

let media = createMedia({});
export const setCodecs = (data) => { media = createMedia(data); };

// Everything the user typed, kept while the app is open so switching tools does not reset the work.
const S = {
  media: { codec: 'xavc-i', res: 'uhd', fps: 25, card: 160, hours: 10 },
  fov: { sensor: 's35', distance: 4, frameW: 2.2, focal: 50 },
  shutter: { fps: 25, angle: 180, mains: 50, projectFps: 25 },
  offload: { gb: 1000, mbPerSec: 700, copies: 2, verify: true },
  sun: { place: 'tlv', date: new Date().toISOString().slice(0, 10), lat: null, lon: null },
  units: { group: 'length', from: 'mm', to: 'in', value: 100, c: 20, mah: 6600, volts: 14.4 },
};

const TOOLS = ['media', 'fov', 'shutter', 'offload', 'sun', 'units'];
const ICON = {
  media: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v5h10V5M8 14h8"/></svg>',
  fov: '<svg viewBox="0 0 24 24"><path d="M3 12h4M17 12h4"/><rect x="7" y="7" width="10" height="10" rx="1.5"/><circle cx="12" cy="12" r="2.6"/></svg>',
  shutter: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v8.5l7.4 4.2M12 12 4.6 16.2M12 12l7.4-4.2"/></svg>',
  offload: '<svg viewBox="0 0 24 24"><path d="M12 3v11M8 10.5 12 14.5l4-4"/><path d="M4 17v3h16v-3"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="4"/><path d="M12 4v2M4.9 7.9l1.4 1.4M19.1 7.9l-1.4 1.4M3 18h18M6 13H4M20 13h-2"/></svg>',
  units: '<svg viewBox="0 0 24 24"><rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M7 8v4M11 8v6M15 8v4M19 8v6"/></svg>',
};

const fmtTime = (d, lang) => (d instanceof Date && !Number.isNaN(+d)
  ? d.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  : '—');

export function render(ctx, { tool: id }, root) {
  const lang = ctx.lang();
  const T = (k) => L[k]?.[lang] ?? L[k]?.he ?? k;

  if (!id) {
    ctx.setTopbar({ title: esc(T('tools')), back: '#/' });
    root.innerHTML = `
      <p class="screen-sub">${esc(T('tools_sub'))}</p>
      <div class="tool-grid">${TOOLS.map(k => `
        <button class="tool-tile" data-tool="${k}">
          <span class="tool-ico">${ICON[k]}</span>
          <b>${esc(T(k))}</b>
          <small>${esc(T(`${k}_sub`))}</small>
        </button>`).join('')}</div>`;
    root.querySelectorAll('[data-tool]').forEach(btn => {
      btn.onclick = () => ctx.navigate(`#/tools/${btn.dataset.tool}`);
    });
    return;
  }

  ctx.setTopbar({ title: esc(T(id)), back: '#/tools' });
  const body = { media: mediaTool, fov: fovTool, shutter: shutterTool, offload: offloadTool, sun: sunTool, units: unitsTool }[id];
  if (!body) { ctx.navigate('#/tools'); return; }
  root.innerHTML = `<div class="tool">${body(T, lang)}</div>`;
  wire(root, ctx, id, T, lang);
}

// ---------- shared field helpers ----------
const field = (label, inner) => `<label class="tfield"><span>${esc(label)}</span>${inner}</label>`;
const sel = (name, options, value) => `<select data-f="${name}">${options.map(o =>
  `<option value="${esc(o.v)}" ${String(o.v) === String(value) ? 'selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
const numIn = (name, value, { min = 0, max = 100000, step = 'any' } = {}) =>
  `<input type="number" data-f="${name}" value="${esc(value)}" min="${min}" max="${max}" step="${step}" inputmode="decimal">`;
const out = (rows) => `<div class="tout">${rows.map(([k, v, cls = '']) =>
  `<div class="torow ${cls}"><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;

// ---------- media ----------
function mediaTool(T) {
  const s = S.media;
  const rate = media.mbps(s.codec, s.res, s.fps);
  const perHour = media.gbPerHour(rate);
  const onCard = media.hoursOn(s.card, rate);
  const cards = media.cardsFor(s.hours, s.card, rate);
  const c = media.codec(s.codec);
  return `
    <div class="card tform">
      ${field(T('codec'), sel('codec', media.codecs.map(x => ({ v: x.id, l: `${x.label}${x.brand && x.brand !== '—' ? ` · ${x.brand}` : ''}` })), s.codec))}
      ${field(T('res'), sel('res', media.resolutions.map(x => ({ v: x.id, l: x.label })), s.res))}
      ${field(T('fps'), sel('fps', media.frameRates.map(x => ({ v: x, l: `${x} fps` })), s.fps))}
      ${field(T('card'), sel('card', media.cards.map(x => ({ v: x, l: x >= 1000 ? `${x / 1000} TB` : `${x} GB` })), s.card))}
      ${field(T('shoot_hours'), numIn('hours', s.hours, { min: 1, max: 24, step: 1 }))}
    </div>
    ${out([
      [T('bitrate'), `${num(rate, 0)} Mbps`],
      [T('per_hour'), `${num(perHour, 0)} GB`],
      [T('on_card'), hm(onCard), onCard < 0.5 ? 'warn' : ''],
      [T('cards_needed'), cards || '—', 'big'],
    ])}
    ${c?.note ? `<p class="tnote"><b>${esc(T('source'))}:</b> ${esc(c.note)}</p>` : ''}`;
}

// ---------- field of view ----------
function fovTool(T, lang) {
  const s = S.fov;
  const sn = sensor(s.sensor);
  const need = focalFor(sn.w, s.frameW, s.distance);
  const prime = nearestPrime(need);
  const cov = coverage(s.sensor, s.focal, s.distance);
  return `
    <div class="card tform">
      ${field(T('sensor_f'), sel('sensor', SENSORS.map(x => ({ v: x.id, l: x.label })), s.sensor))}
      ${field(T('distance'), numIn('distance', s.distance, { min: 0.2, max: 200, step: 0.1 }))}
      ${field(T('subject'), sel('subject', SUBJECTS.map(x => ({ v: x.width, l: `${lang === 'he' ? x.he : x.en} · ${x.width} m` })), s.frameW))}
      ${field(T('frame_w'), numIn('frameW', s.frameW, { min: 0.1, max: 100, step: 0.05 }))}
    </div>
    ${out([
      [T('need_lens'), `${num(need, 1)} mm`],
      [T('nearest'), `${prime} mm`, 'big'],
    ])}
    <div class="card tform" style="margin-top:14px">
      <div class="tsub">${esc(T('check_lens'))}</div>
      ${field(T('focal'), numIn('focal', s.focal, { min: 4, max: 2000, step: 1 }))}
    </div>
    ${out([
      [T('covers'), `${num(cov.widthM, 2)} × ${num(cov.heightM, 2)} m`],
      [T('angle_h'), `${num(cov.hFov, 1)}°`],
    ])}`;
}

// ---------- shutter ----------
function shutterTool(T) {
  const s = S.shutter;
  const seconds = timeFromAngle(s.fps, s.angle);
  const f = flicker(seconds, s.mains);
  const safe = safeAngles(s.fps, s.mains).slice(0, 6);
  const slow = slowMotion(s.fps, s.projectFps);
  return `
    <div class="card tform">
      ${field(T('fps'), numIn('fps', s.fps, { min: 1, max: 1000, step: 1 }))}
      ${field(T('angle'), sel('angle', COMMON_ANGLES.map(a => ({ v: a, l: `${a}°` })), s.angle))}
      ${field(T('mains'), sel('mains', [{ v: 50, l: '50 Hz' }, { v: 60, l: '60 Hz' }], s.mains))}
      ${field(T('project_fps'), numIn('projectFps', s.projectFps, { min: 1, max: 120, step: 1 }))}
    </div>
    ${out([
      [T('speed'), asFraction(seconds), 'big'],
      [f.safe ? T('flicker_ok') : T('flicker_bad'), f.safe ? '✓' : '⚠', f.safe ? 'ok' : 'warn'],
      [T('slowmo'), slow.label],
    ])}
    <div class="card" style="margin-top:14px;padding:12px 14px">
      <div class="tsub">${esc(T('safe_angles'))}</div>
      <div class="chips">${safe.map(a =>
        `<button class="chip pick ${Math.abs(a.angle - s.angle) < 0.6 ? 'on' : ''}" data-angle="${a.angle}">${a.angle}° · ${a.label}</button>`).join('')}</div>
    </div>`;
}

// ---------- offload ----------
function offloadTool(T, lang) {
  const s = S.offload;
  const r = offload(s);
  return `
    <div class="card tform">
      ${field(T('footage'), numIn('gb', s.gb, { min: 1, max: 200000, step: 1 }))}
      ${field(T('drive'), sel('drive', DRIVES.map(d => ({ v: d.mbPerSec, l: `${lang === 'he' ? d.he : d.en} · ${d.mbPerSec} MB/s` })), s.mbPerSec))}
      ${field(T('speed_mb'), numIn('mbPerSec', s.mbPerSec, { min: 1, max: 10000, step: 10 }))}
      ${field(T('copies'), sel('copies', [{ v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }], s.copies))}
      <label class="switch"><span>${esc(T('verify'))}</span><input type="checkbox" data-f="verify" ${s.verify ? 'checked' : ''}></label>
    </div>
    ${out([
      [T('per_copy'), hm(r.perCopyHours)],
      [T('total_time'), hm(r.totalHours), 'big'],
      [T('total_space'), `${num(r.totalGb, 0)} GB`],
    ])}`;
}

// ---------- sun ----------
function sunTool(T, lang) {
  const s = S.sun;
  const place = PLACES.find(p => p.id === s.place);
  const lat = s.lat ?? place?.lat ?? 32.0853;
  const lon = s.lon ?? place?.lon ?? 34.7818;
  const [y, m, d] = s.date.split('-').map(Number);
  const day = sunDay(new Date(Date.UTC(y, m - 1, d)), lat, lon);
  const span = (w) => (w ? `${fmtTime(w.from, lang)} – ${fmtTime(w.to, lang)}` : '—');
  return `
    <div class="card tform">
      ${field(T('place'), sel('place', PLACES.map(p => ({ v: p.id, l: lang === 'he' ? p.he : p.en })), s.place))}
      ${field(T('date'), `<input type="date" data-f="date" value="${esc(s.date)}">`)}
      <button class="btn sm" data-geo>${icons.pin || '◎'} ${esc(T('my_location'))}</button>
    </div>
    ${day.polar ? `<p class="tnote warn">${esc(T('polar'))}</p>` : out([
      [T('sunrise'), fmtTime(day.sunrise, lang), 'big'],
      [T('sunset'), fmtTime(day.sunset, lang), 'big'],
      [T('golden_am'), span(day.goldenMorning)],
      [T('golden_pm'), span(day.goldenEvening), 'ok'],
      [T('blue_am'), span(day.blueMorning)],
      [T('blue_pm'), span(day.blueEvening)],
      [T('noon'), fmtTime(day.noon, lang)],
      [T('day_len'), hm(day.dayLengthHours)],
    ])}`;
}

// ---------- units ----------
function unitsTool(T, lang) {
  const s = S.units;
  const g = UNIT_GROUPS.find(x => x.id === s.group) || UNIT_GROUPS[0];
  const from = g.units.find(u => u.id === s.from) ? s.from : g.units[0].id;
  const to = g.units.find(u => u.id === s.to) ? s.to : g.units[1].id;
  const result = convert(g.id, from, to, s.value);
  return `
    <div class="card tform">
      ${field(T('group'), sel('group', UNIT_GROUPS.map(x => ({ v: x.id, l: lang === 'he' ? x.he : x.en })), g.id))}
      ${field(T('value'), numIn('value', s.value))}
      ${field('', sel('from', g.units.map(u => ({ v: u.id, l: u.label })), from))}
      ${field('', sel('to', g.units.map(u => ({ v: u.id, l: u.label })), to))}
    </div>
    ${out([[`${num(s.value, 2)} ${g.units.find(u => u.id === from)?.label}`, `${num(result, 3)} ${esc(g.units.find(u => u.id === to)?.label)}`, 'big']])}
    <div class="card tform" style="margin-top:14px">
      <div class="tsub">${esc(T('temp'))}</div>
      ${field('°C', numIn('c', s.c, { min: -80, max: 200, step: 0.5 }))}
    </div>
    ${out([['°F', num(cToF(s.c), 1)], ['°C', num(fToC(cToF(s.c)), 1)]])}
    <div class="card tform" style="margin-top:14px">
      <div class="tsub">${esc(T('battery_wh'))}</div>
      ${field('mAh', numIn('mah', s.mah, { min: 1, max: 100000, step: 10 }))}
      ${field(T('volts'), numIn('volts', s.volts, { min: 1, max: 60, step: 0.1 }))}
    </div>
    ${out([['Wh', num(mahToWh(s.mah, s.volts), 1), 'big'], ['mAh', num(whToMah(mahToWh(s.mah, s.volts), s.volts), 0)]])}`;
}

// ---------- wiring ----------
function wire(root, ctx, id, T, lang) {
  const s = S[id];
  const redraw = () => ctx.render();

  root.querySelectorAll('[data-f]').forEach(el => {
    el.onchange = () => {
      const k = el.dataset.f;
      if (el.type === 'checkbox') s[k] = el.checked;
      else if (el.type === 'date' || el.tagName === 'SELECT' && Number.isNaN(Number(el.value))) s[k] = el.value;
      else s[k] = el.type === 'number' || !Number.isNaN(Number(el.value)) ? Number(el.value) : el.value;

      if (id === 'fov' && k === 'subject') s.frameW = Number(el.value);
      if (id === 'offload' && k === 'drive') s.mbPerSec = Number(el.value);
      if (id === 'sun' && k === 'place') { s.lat = null; s.lon = null; }
      if (id === 'units' && k === 'group') {
        const g = UNIT_GROUPS.find(x => x.id === s.group);
        s.from = g.units[0].id; s.to = g.units[1].id;
      }
      redraw();
    };
  });

  root.querySelectorAll('[data-angle]').forEach(b => {
    b.onclick = () => { S.shutter.angle = Number(b.dataset.angle); redraw(); };
  });

  root.querySelector('[data-geo]')?.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { S.sun.lat = pos.coords.latitude; S.sun.lon = pos.coords.longitude; redraw(); },
      () => {},
      { timeout: 8000 },
    );
  });
}
