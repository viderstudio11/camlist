import { esc, icons, toast } from './dom.js';
import { logoHTML } from '../brands.js';
import { toolIcon } from './icons.js';
import { createMedia } from '../tools/media.js';
import { timeFromAngle, angleFromTime, asFraction, flicker, safeAngles, slowMotion, COMMON_ANGLES } from '../tools/shutter.js';
import { SENSORS, SUBJECTS, coverage, focalFor, nearestPrime, sensor } from '../tools/fov.js';
import { sunDay } from '../tools/solar.js';
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
  units_sub2: { he: '', en: '' },
  luts:       { he: 'מאגר לוטים', en: 'LUT bank' },
  luts_sub:   { he: 'איזה לוט הולך עם איזה לוג, ומאיפה מורידים', en: 'Which LUT goes with which log, and where to get it' },
  lut_cameras:{ he: 'מצלמות', en: 'Cameras' },
  lut_files:  { he: 'לוטים', en: 'LUTs' },
  lut_source: { he: 'מקור', en: 'Source' },
  lut_open:   { he: 'פתח', en: 'Open' },
  lut_verified:{ he: 'קישור מאומת', en: 'Link verified' },
  lut_nolink: { he: 'אין קישור ישיר — חפש בעמוד התמיכה של היצרן', en: 'No direct link — look on the maker’s support page' },
  lut_all: { he: 'הכול', en: 'All' },
  lut_camera: { he: 'דגם', en: 'Model' },
  all_models: { he: 'כל הדגמים', en: 'All models' },
  brand_pick: { he: 'מותג', en: 'Brand' },
  country: { he: 'מדינה', en: 'Country' },
  hours: { he: 'דוח שעות', en: 'Hours report' },
  hours_sub: { he: 'קול טיים, ראפ, שעות נוספות וטרנאראונד', en: 'Call, wrap, overtime and turnaround' },
  call_time: { he: 'קול טיים', en: 'Call time' },
  wrap_time: { he: 'ראפ', en: 'Wrap' },
  break_min: { he: 'הפסקות (דקות)', en: 'Breaks (minutes)' },
  ot_after: { he: 'שעות נוספות אחרי', en: 'Overtime after' },
  turnaround_h: { he: 'טרנאראונד נדרש', en: 'Required turnaround' },
  worked: { he: 'שעות עבודה', en: 'Hours worked' },
  straight: { he: 'רגילות', en: 'Straight' },
  overtime: { he: 'נוספות', en: 'Overtime' },
  next_call: { he: 'הקול המוקדם ביותר מחר', en: 'Earliest call tomorrow' },
  next_day: { he: 'למחרת', en: 'next day' },
  lut_disclaimer: { he: 'הערות החשיפה הן נוהג מקובל על הסט, לא הוראה של היצרן. תמיד בדוק על הגוף שלך.', en: 'Exposure notes are common practice on set, not manufacturer instruction. Always test on your own body.' },
  units_sub:  { he: 'מטרי ואימפריאלי, נתונים, סוללות', en: 'Metric and imperial, data, batteries' },

  codec: { he: 'קודק', en: 'Codec' },
  camera_pick: { he: 'מצלמה', en: 'Camera' },
  format_pick: { he: 'פורמט', en: 'Format' },
  manual_fmt: { he: 'בחירה ידנית', en: 'Choose manually' },
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
  from_camera: { he: 'לפי מצלמה מהמאגר', en: 'From a camera in the catalog' },
  any_camera: { he: 'בחירה חופשית', en: 'Free choice' },
  matching_lenses: { he: 'עדשות שמתאימות', en: 'Lenses that fit' },
  no_lenses: { he: 'לא נמצאו עדשות מתאימות במאגר', en: 'No matching lenses in the catalog' },
  lens_count: { he: '{n} מהמאגר', en: '{n} in the catalog' },
  distance: { he: 'מרחק (מטר)', en: 'Distance (m)' },
  subject: { he: 'גודל פריים', en: 'Frame size' },
  frame_w: { he: 'רוחב פריים (מטר)', en: 'Frame width (m)' },
  need_lens: { he: 'המוקד הדרוש', en: 'Focal length needed' },
  nearest: { he: 'העדשה הקרובה בסט', en: 'Nearest prime in the set' },
  lens_note: { he: 'מסומנות העדשות שמכסות את המוקד הזה', en: 'The lenses that cover this focal length are marked' },
  covers: { he: 'מכסה', en: 'Covers' },
  angle_h: { he: 'זווית אופקית', en: 'Horizontal angle' },
  check_lens: { he: 'בדיקה הפוכה — מה עדשה נתונה מכסה', en: 'The other way round — what a given lens covers' },
  framing: { he: 'איך זה ייראה', en: 'How it frames' },
  person_note: { he: 'הדמות בגובה 1.75 מ׳ — לפי זה אפשר לקרוא את הפריים', en: 'The figure is 1.75 m — read the frame against it' },
  viewfinder: { he: 'ויופיינדר חי', en: 'Live viewfinder' },
  vf_start: { he: 'פתח את מצלמת הטלפון', en: 'Open the phone camera' },
  vf_stop: { he: 'סגור', en: 'Close' },
  vf_lens: { he: 'עדשת הטלפון', en: 'Phone lens' },
  vf_hint: { he: 'המסגרת מראה מה העדשה שבחרת תתפוס מכאן', en: 'The frame shows what your chosen lens takes in from here' },
  vf_wider: { he: 'העדשה שבחרת רחבה יותר ממצלמת הטלפון — עבור לאולטרה־רחב', en: 'Your lens is wider than this phone camera — switch to the ultra-wide' },
  vf_denied: { he: 'אין גישה למצלמה. צריך לאשר הרשאה בדפדפן.', en: 'No camera access. The browser needs permission.' },
  vf_approx: { he: 'הערכה — מבוססת על שדה הראייה האופייני של עדשת הטלפון שבחרת', en: 'Approximate — based on the typical field of view of the phone lens you picked' },
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

let lutData = { logs: [] };
export const setLuts = (data) => { lutData = data || lutData; };

let placeData = { countries: [], defaultCountry: 'IL' };
export const setPlaces = (data) => { placeData = data || placeData; };

// Everything the user typed, kept while the app is open so switching tools does not reset the work.
const S = {
  media: { cam: 'fx6', codec: 'xavc-i', res: 'uhd', fps: 25, card: 160, hours: 10 },
  fov: { sensor: 's35', distance: 4, frameW: 2.2, focal: 50, phone: 'main', vf: false, cam: '', camBrand: '' },
  shutter: { fps: 25, angle: 180, mains: 50, projectFps: 25 },
  offload: { gb: 1000, mbPerSec: 700, copies: 2, verify: true },
  sun: { country: 'IL', city: 0, date: new Date().toISOString().slice(0, 10), lat: null, lon: null },
  units: { group: 'length', from: 'mm', to: 'in', value: 100, c: 20, mah: 6600, volts: 14.4 },
  luts: { brand: '', model: '' },
  hours: { call: '07:00', wrap: '19:30', breaks: 60, otAfter: 12, turnaround: 11 },
};

// A phone camera's field of view, given as the 35 mm equivalent focal length its maker quotes.
// Used only to scale the overlay: the phone is the reference frame, the cine lens is drawn inside it.
const PHONE_LENSES = [
  { id: 'uw', he: 'אולטרה־רחב 0.5×', en: 'Ultra-wide 0.5×', eq: 13 },
  { id: 'main', he: 'ראשית 1×', en: 'Main 1×', eq: 26 },
  { id: 'tele2', he: 'טלה 2×', en: 'Tele 2×', eq: 48 },
  { id: 'tele3', he: 'טלה 3×', en: 'Tele 3×', eq: 77 },
  { id: 'tele5', he: 'טלה 5×', en: 'Tele 5×', eq: 120 },
];
const phoneLens = (id) => PHONE_LENSES.find(p => p.id === id) || PHONE_LENSES[1];
// Horizontal angle of view of a 35 mm-equivalent focal length, on a 36 mm-wide frame.
const eqHFov = (eq) => (2 * Math.atan(18 / eq) * 180) / Math.PI;

const TOOLS = ['media', 'fov', 'shutter', 'hours', 'offload', 'sun', 'luts', 'units'];

const fmtTime = (d, lang) => (d instanceof Date && !Number.isNaN(+d)
  ? d.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  : '—');

export function render(ctx, { tool: id }, root) {
  const lang = ctx.lang();
  const T = (k) => L[k]?.[lang] ?? L[k]?.he ?? k;

  if (!id) {
    if (vfStream) stopViewfinder(null);
    ctx.setTopbar({ title: esc(T('tools')), back: '#/' });
    root.innerHTML = `
      <p class="screen-sub">${esc(T('tools_sub'))}</p>
      <div class="tool-grid">${TOOLS.map(k => `
        <button class="tool-tile" data-tool="${k}">
          <span class="tool-ico">${toolIcon(k)}</span>
          <b>${esc(T(k))}</b>
          <small>${esc(T(`${k}_sub`))}</small>
        </button>`).join('')}</div>`;
    root.querySelectorAll('[data-tool]').forEach(btn => {
      btn.onclick = () => ctx.navigate(`#/tools/${btn.dataset.tool}`);
    });
    return;
  }

  if (id !== 'fov' && vfStream) stopViewfinder(null);
  ctx.setTopbar({ title: esc(T(id)), back: '#/tools' });
  const body = { media: mediaTool, fov: fovTool, shutter: shutterTool, hours: hoursTool, offload: offloadTool, sun: sunTool, luts: lutsTool, units: unitsTool }[id];
  if (!body) { ctx.navigate('#/tools'); return; }
  root.innerHTML = `<div class="tool">${body(T, lang, ctx)}</div>`;
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

// Every tool leads with its answer. The form is what you adjust; this is what you came for.
const headline = (value, unit, caption, cls = '') => `<div class="thead ${cls}">
  <div class="thead-v"><b>${value}</b>${unit ? `<i>${esc(unit)}</i>` : ''}</div>
  ${caption ? `<div class="thead-c">${caption}</div>` : ''}
</div>`;

// ---------- media ----------
function mediaTool(T) {
  const s = S.media;
  // A body records a handful of formats, not the whole catalogue. Picking the camera first
  // turns a list of twenty-odd codecs into a list of three or four real choices.
  const cam = media.cameras.find(x => x.id === s.cam);
  const fmtList = (cam?.formats || []).map(([codecId, resId]) => {
    const cd = media.codec(codecId), rs = media.resolution(resId);
    return { codecId, resId, label: `${cd?.label || codecId} · ${rs?.label || resId}` };
  });
  const fmtIndex = Math.max(0, fmtList.findIndex(f => f.codecId === s.codec && f.resId === s.res));
  if (fmtList.length) { s.codec = fmtList[fmtIndex].codecId; s.res = fmtList[fmtIndex].resId; }
  const rate = media.mbps(s.codec, s.res, s.fps);
  const perHour = media.gbPerHour(rate);
  const onCard = media.hoursOn(s.card, rate);
  const cards = media.cardsFor(s.hours, s.card, rate);
  const c = media.codec(s.codec);
  return `
    ${headline(cards || '—', T('cards_needed'), `${esc(c?.label || '')} · ${num(rate, 0)} Mbps · ${hm(onCard)} ${esc(T('on_card'))}`)}
    <div class="card tform">
      ${field(T('camera_pick'), sel('cam', [
        ...media.cameras.map(x => ({ v: x.id, l: x.brand === '—' ? x.label : `${x.brand} ${x.label}` })),
      ], s.cam))}
      ${fmtList.length
        ? field(T('format_pick'), sel('fmt', fmtList.map((f, i) => ({ v: i, l: f.label })), fmtIndex))
        : `${field(T('codec'), sel('codec', media.codecs.map(x => ({ v: x.id, l: `${x.label}${x.brand && x.brand !== '—' ? ` · ${x.brand}` : ''}` })), s.codec))}
           ${field(T('res'), sel('res', media.resolutions.map(x => ({ v: x.id, l: x.label })), s.res))}`}
      ${field(T('fps'), sel('fps', media.frameRates.map(x => ({ v: x, l: `${x} fps` })), s.fps))}
      ${field(T('card'), sel('card', media.cards.map(x => ({ v: x, l: x >= 1000 ? `${x / 1000} TB` : `${x} GB` })), s.card))}
      ${field(T('shoot_hours'), numIn('hours', s.hours, { min: 1, max: 24, step: 1 }))}
    </div>
    ${out([
      [T('bitrate'), `${num(rate, 0)} Mbps`],
      [T('per_hour'), `${num(perHour, 0)} GB`],
      [T('on_card'), hm(onCard), onCard < 0.5 ? 'warn' : ''],
    ])}
    ${cards ? `<div class="card cardrow">
      <div class="tsub">${esc(T('cards_needed'))}</div>
      <div class="cards">${Array.from({ length: Math.min(cards, 24) }, (_, i) => {
        const last = i === cards - 1;
        const part = last ? (s.hours / onCard) % 1 || 1 : 1;
        return `<span class="cardchip"><i style="height:${(part * 100).toFixed(0)}%"></i><em>${s.card >= 1000 ? s.card / 1000 + 'TB' : s.card + 'GB'}</em></span>`;
      }).join('')}${cards > 24 ? `<span class="cardmore">+${cards - 24}</span>` : ''}</div>
    </div>` : ''}
    ${c?.note ? `<p class="tnote"><b>${esc(T('source'))}:</b> ${esc(c.note)}</p>` : ''}`;
}

// ---------- field of view ----------
function fovTool(T, lang, ctx) {
  const s = S.fov;

  // Pick a body from the catalog and the sensor follows from its profile; the lens list then
  // narrows to what actually mounts and covers it. Sensor sizes come from SENSORS, the mount
  // and coverage from the same compatibility rules the gear list uses.
  const FORMAT_TO_SENSOR = { FF: 'ff', S35: 's35', MFT: 'mft', MF: 'mf', '2/3': '23', '1in': '1in', 16: 's16', action: 's16' };
  const allCams = (ctx?.compat?.profiles || [])
    .map(p => ctx.catalog.byId(p.id))
    .filter(Boolean)
    .sort((a, b) => (a.brandName || '').localeCompare(b.brandName || '') || a.name.localeCompare(b.name));
  // Brand first, then the models that brand makes: seventy bodies in one list is not a choice,
  // it is a search. Two short lists is a choice.
  const camBrands = [...new Map(allCams.map(c => [c.brand, c.brandName || c.brand])).entries()]
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const cameras = s.camBrand ? allCams.filter(c => c.brand === s.camBrand) : [];
  const camProduct = s.cam ? ctx?.catalog?.byId(Number(s.cam) || s.cam) : null;
  const camProf = camProduct ? ctx.compat.profileFor(camProduct) : null;
  if (camProf?.format && FORMAT_TO_SENSOR[camProf.format]) s.sensor = FORMAT_TO_SENSOR[camProf.format];

  // Focal length read off the product name: a prime gives one number, a zoom gives its long end,
  // which is the reach that decides whether it can hold the frame from where you are standing.
  const focalOf = (name = '') => {
    const zoom = name.match(/(\d{1,4})\s*[-–]\s*(\d{1,4})\s*mm/i);
    if (zoom) return { min: Number(zoom[1]), max: Number(zoom[2]) };
    const prime = name.match(/(\d{1,4}(?:\.\d)?)\s*mm/i);
    return prime ? { min: Number(prime[1]), max: Number(prime[1]) } : null;
  };
  const lensMatches = (() => {
    if (!camProf || !ctx?.catalog) return [];
    return ctx.catalog.products
      .filter(p => ctx.catalog.deptKey(p.dept) === 'lenses')
      .map(p => ({ p, f: focalOf(p.name), v: ctx.compat.verdict(p, camProf) }))
      .filter(x => x.f && (x.v.status === 'native' || x.v.status === 'adapter'))
      .sort((a, b) => a.f.min - b.f.min);
  })();

  const sn = sensor(s.sensor);
  const need = focalFor(sn.w, s.frameW, s.distance);
  const prime = nearestPrime(need);
  const cov = coverage(s.sensor, s.focal, s.distance);

  // The frame the chosen lens gives, drawn around a 1.75 m figure so the size reads at a glance.
  // A tight frame is placed where an operator would actually put it — on the upper body — rather
  // than resting on the ground, which is what makes a close-up look like a shot of someone's shins.
  const PERSON_M = 1.75;
  const box = 168;
  const tallest = Math.max(cov.heightM, PERSON_M) * 1.12;
  const pxPerM = box / tallest;
  const fw = cov.widthM * pxPerM;
  const fh = cov.heightM * pxPerM;
  const ph = PERSON_M * pxPerM;
  const vw = Math.max(fw + 34, 230);
  const cx = vw / 2;
  const groundY = box - 4;
  const headY = groundY - ph;
  // Frames shorter than the subject sit around the head and chest; taller ones stand on the ground.
  const frameY = fh >= ph ? groundY - fh : Math.max(headY - fh * 0.12, 2);
  const two = cov.widthM >= PERSON_M * 1.7;

  // Drawn once in a 60 × 175 box — one unit to the centimetre — then placed with a transform,
  // so the proportions hold at any size. Seven and a half heads tall, shoulders a quarter of
  // the height across: the figure a scale drawing would use, in the same line as the charts.
  const FIG_W = 60, FIG_H = 175;
  const FIG = [
    '<ellipse cx="30" cy="14" rx="8.6" ry="11"/>',
    '<path d="M26.6 24.6 L26.6 29 L33.4 29 L33.4 24.6"/>',
    '<path d="M13 33 Q13 29.4 16.6 29 L43.4 29 Q47 29.4 47 33 L44.6 67 L46.4 90 L13.6 90 L15.4 67 Z"/>',
    '<path d="M13.4 33.4 L8.6 35.6 L5.6 88 L10.8 89 L15.2 66"/>',
    '<path d="M46.6 33.4 L51.4 35.6 L54.4 88 L49.2 89 L44.8 66"/>',
    '<path d="M15.6 90 L28.4 90 L27.6 128 L26.4 168 L17.6 168 L18.2 128 Z"/>',
    '<path d="M44.4 90 L31.6 90 L32.4 128 L33.6 168 L42.4 168 L41.8 128 Z"/>',
    '<path d="M16.4 168 L11.6 172 L11.6 174.4 L27 174.4 L27 168"/>',
    '<path d="M43.6 168 L48.4 172 L48.4 174.4 L33 174.4 L33 168"/>',
  ].join('');

  const figure = (x, h) => {
    const k = h / FIG_H;
    return `<g class="fig" transform="translate(${(x - (FIG_W * k) / 2).toFixed(2)} ${(groundY - h).toFixed(2)}) scale(${k.toFixed(4)})">${FIG}</g>`;
  };

  const framing = `<div class="card framing">
    <div class="tsub">${esc(T('framing'))}</div>
    <svg viewBox="0 0 ${vw.toFixed(0)} ${box}" class="frame-svg" role="img" aria-label="${esc(T('framing'))}">
      <line x1="0" y1="${groundY}" x2="${vw.toFixed(0)}" y2="${groundY}" class="ground"/>
      <rect x="${(cx - fw / 2).toFixed(1)}" y="${frameY.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" class="fr"/>
      ${two ? figure(cx - fw * 0.22, ph) : ''}
      ${figure(two ? cx + fw * 0.22 : cx, ph)}
      <rect x="${(cx - fw / 2).toFixed(1)}" y="${frameY.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" class="fr-line"/>
    </svg>
    <div class="frame-cap"><b>${num(cov.widthM, 2)} × ${num(cov.heightM, 2)} m</b><span>${esc(T('person_note'))}</span></div>
  </div>`;

  const ph2 = phoneLens(s.phone);
  const phoneFov = eqHFov(ph2.eq);
  const ratio = Math.tan((cov.hFov / 2) * Math.PI / 180) / Math.tan((phoneFov / 2) * Math.PI / 180);
  const viewfinder = `<div class="card vf-card">
    <div class="pw-head"><b>${esc(T('viewfinder'))}</b><span class="pchip">${num(cov.hFov, 1)}°</span></div>
    ${s.vf ? `
      <div class="vf-stage">
        <video class="vf-video" playsinline autoplay muted></video>
        <div class="vf-overlay">
          ${ratio <= 1
            ? `<div class="vf-frame" style="width:${(ratio * 100).toFixed(1)}%;aspect-ratio:${(sn.w / sn.h).toFixed(3)}"><span>${esc(s.focal)}mm</span></div>`
            : `<div class="vf-wide">${esc(T('vf_wider'))}</div>`}
        </div>
      </div>
      <div class="tform" style="padding:12px 14px">
        ${field(T('vf_lens'), sel('phone', PHONE_LENSES.map(x => ({ v: x.id, l: `${lang === 'he' ? x.he : x.en} · ${x.eq}mm` })), s.phone))}
        ${field(T('focal'), numIn('focal', s.focal, { min: 4, max: 2000, step: 1 }))}
      </div>
      <div class="tnote" style="padding:0 14px 12px">${esc(T('vf_approx'))}</div>
      <div style="padding:0 14px 14px"><button class="btn sm" data-vf-stop>${esc(T('vf_stop'))}</button></div>`
      : `<div style="padding:12px 14px">
          <button class="btn primary" data-vf-start style="width:100%">${esc(T('vf_start'))}</button>
          <div class="tnote" style="margin-top:9px">${esc(T('vf_hint'))}</div>
        </div>`}
  </div>`;

  return `
    ${headline(`${prime}`, 'mm', `${esc(T('nearest'))} · ${num(need,1)} mm ${esc(T('need_lens'))} · ${num(cov.hFov,1)}°`)}
    <div class="card tform">
      ${field(T('brand_pick'), sel('camBrand', [{ v: '', l: T('any_camera') }, ...camBrands.map(([slug, name]) => ({ v: slug, l: name }))], s.camBrand))}
      ${cameras.length ? field(T('from_camera'), sel('cam', [{ v: '', l: T('all_models') }, ...cameras.map(c => ({ v: c.id, l: c.name }))], s.cam)) : ''}
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
    ])}
    ${framing}
    ${lensMatches.length ? `<div class="card lenslist">
      <div class="pw-head"><b>${esc(T('matching_lenses'))}</b><span class="pchip">${esc(T('lens_count', { n: lensMatches.length }))}</span></div>
      <div class="chips">${lensMatches.slice(0, 40).map(({ p, f, v }) => {
        const covers = f.min <= need && need <= f.max;
        return `<button class="chip pick ${covers ? 'on' : ''} ${v.status === 'adapter' ? 'adp' : ''}" data-lens="${f.max}" title="${esc(p.name)}">${f.min === f.max ? f.min : `${f.min}-${f.max}`}mm</button>`;
      }).join('')}</div>
      <div class="tnote">${esc(T('nearest'))}: ${num(need, 1)} mm — ${esc(T('lens_note'))}</div>
    </div>` : (s.cam ? `<p class="tnote">${esc(T('no_lenses'))}</p>` : '')}
    ${viewfinder}`;
}

// ---------- shutter ----------
function shutterTool(T) {
  const s = S.shutter;
  const seconds = timeFromAngle(s.fps, s.angle);
  const f = flicker(seconds, s.mains);
  const safe = safeAngles(s.fps, s.mains).slice(0, 6);
  const slow = slowMotion(s.fps, s.projectFps);
  // A rotating shutter drawn as the opening it actually is.
  const a = Math.max(1, Math.min(s.angle, 360));
  const r = 42, cxy = 50;
  const end = (deg) => [cxy + r * Math.sin((deg * Math.PI) / 180), cxy - r * Math.cos((deg * Math.PI) / 180)];
  const [ex, ey] = end(a);
  const dial = `<svg viewBox="0 0 100 100" class="dial-svg" role="img" aria-label="${a}°">
    <circle cx="${cxy}" cy="${cxy}" r="${r}" class="d-ring"/>
    <path d="M${cxy} ${cxy} L${cxy} ${cxy - r} A${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z" class="d-open"/>
    <circle cx="${cxy}" cy="${cxy}" r="3" class="d-hub"/>
  </svg>`;

  return `
    ${headline(asFraction(seconds), '', `${s.angle}° · ${s.fps} fps`, f.safe ? 'ok' : 'warn')}
    <div class="card dial-card">
      ${dial}
      <div class="dial-side">
        <div class="dial-row"><span>${esc(T('angle'))}</span><b>${s.angle}°</b></div>
        <div class="dial-row"><span>${esc(T('speed'))}</span><b>${asFraction(seconds)}</b></div>
        <div class="dial-row ${f.safe ? 'ok' : 'warn'}"><span>${esc(f.safe ? T('flicker_ok') : T('flicker_bad'))}</span><b>${f.safe ? '✓' : '⚠'}</b></div>
      </div>
    </div>
    <div class="card tform">
      ${field(T('fps'), numIn('fps', s.fps, { min: 1, max: 1000, step: 1 }))}
      ${field(T('angle'), sel('angle', COMMON_ANGLES.map(a => ({ v: a, l: `${a}°` })), s.angle))}
      ${field(T('mains'), sel('mains', [{ v: 50, l: '50 Hz' }, { v: 60, l: '60 Hz' }], s.mains))}
      ${field(T('project_fps'), numIn('projectFps', s.projectFps, { min: 1, max: 120, step: 1 }))}
    </div>
    ${out([[T('slowmo'), slow.label]])}
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
    ${headline(hm(r.totalHours), '', `${num(s.gb, 0)} GB · ${s.copies} × ${num(s.mbPerSec, 0)} MB/s`)}
    <div class="card tform">
      ${field(T('footage'), numIn('gb', s.gb, { min: 1, max: 200000, step: 1 }))}
      ${field(T('drive'), sel('drive', DRIVES.map(d => ({ v: d.mbPerSec, l: `${lang === 'he' ? d.he : d.en} · ${d.mbPerSec} MB/s` })), s.mbPerSec))}
      ${field(T('speed_mb'), numIn('mbPerSec', s.mbPerSec, { min: 1, max: 10000, step: 10 }))}
      ${field(T('copies'), sel('copies', [{ v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }], s.copies))}
      <label class="switch"><span>${esc(T('verify'))}</span><input type="checkbox" data-f="verify" ${s.verify ? 'checked' : ''}></label>
    </div>
    <div class="card">
      <div class="tsub">${esc(T('total_time'))}</div>
      <div class="passes">${Array.from({ length: r.passes }, (_, i) => `<span class="pass ${i % 2 && s.verify ? 'verify' : ''}" style="flex:1">${i % 2 && s.verify ? '✓' : (i / (s.verify ? 2 : 1) | 0) + 1}</span>`).join('')}</div>
      <div class="tnote">${r.passes} × ${hm(r.perCopyHours)}</div>
    </div>
    ${out([
      [T('per_copy'), hm(r.perCopyHours)],
      [T('total_space'), `${num(r.totalGb, 0)} GB`],
    ])}`;
}

// ---------- sun ----------
function sunTool(T, lang) {
  const s = S.sun;
  const countries = placeData.countries || [];
  const country = countries.find(c => c.code === s.country) || countries[0];
  const cityList = country?.cities || [];
  const city = cityList[Math.min(s.city, cityList.length - 1)] || null;
  const lat = s.lat ?? city?.lat ?? 32.0853;
  const lon = s.lon ?? city?.lon ?? 34.7818;
  const [y, m, d] = s.date.split('-').map(Number);
  const day = sunDay(new Date(Date.UTC(y, m - 1, d)), lat, lon);
  const span = (w) => (w ? `${fmtTime(w.from, lang)} – ${fmtTime(w.to, lang)}` : '—');
  // The day drawn as the sun's own path: the horizon, the arc, and the bands either side of it.
  const W = 300, H = 118, horizon = 92;
  const arc = (() => {
    if (!day.sunrise || !day.sunset) return '';
    const t0 = +day.sunrise, t1 = +day.sunset;
    const at = (d) => ((+d - t0) / (t1 - t0));
    const x = (f) => 14 + f * (W - 28);
    const y = (f) => horizon - Math.sin(Math.max(0, Math.min(f, 1)) * Math.PI) * 72;
    const path = Array.from({ length: 41 }, (_, i) => {
      const f = i / 40;
      return `${i ? 'L' : 'M'}${x(f).toFixed(1)} ${y(f).toFixed(1)}`;
    }).join(' ');
    const band = (w, cls) => (w ? `<rect x="${x(at(w.from)).toFixed(1)}" y="8" width="${Math.max(x(at(w.to)) - x(at(w.from)), 2).toFixed(1)}" height="${horizon - 8}" class="${cls}"/>` : '');
    return `
      ${band(day.goldenMorning, 'b-gold')}${band(day.goldenEvening, 'b-gold')}
      ${band(day.blueMorning, 'b-blue')}${band(day.blueEvening, 'b-blue')}
      <line x1="0" y1="${horizon}" x2="${W}" y2="${horizon}" class="b-horizon"/>
      <path d="${path}" class="b-arc"/>
      <circle cx="${x(0.5).toFixed(1)}" cy="${y(0.5).toFixed(1)}" r="6" class="b-sun"/>
      <text x="14" y="${horizon + 15}" class="b-lab">${fmtTime(day.sunrise, lang)}</text>
      <text x="${W - 14}" y="${horizon + 15}" class="b-lab end">${fmtTime(day.sunset, lang)}</text>`;
  })();

  return `
    ${headline(fmtTime(day.sunset, lang), '', `${esc(T('sunrise'))} ${fmtTime(day.sunrise, lang)} · ${esc(T('day_len'))} ${hm(day.dayLengthHours)}`)}
    ${day.polar ? '' : `<div class="card suncard"><svg viewBox="0 0 ${W} ${H}" class="sun-svg" role="img">${arc}</svg>
      <div class="sun-key"><span class="k-gold">${esc(T('golden_pm'))}</span><span class="k-blue">${esc(T('blue_pm'))}</span></div></div>`}
    <div class="card tform">
      ${field(T('country'), sel('country', countries.map(c => ({ v: c.code, l: lang === 'he' ? c.he : c.en })), s.country))}
      ${field(T('place'), sel('city', cityList.map((c, i) => ({ v: i, l: lang === 'he' ? c.he : c.en })), s.city))}
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

// ---------- LUT bank ----------
function lutsTool(T, lang) {
  const logs = lutData.logs || [];
  if (!logs.length) return `<p class="tnote">—</p>`;

  // Twelve formats in one column read as a pile. Filtering by maker turns it into a shelf:
  // you already know whose camera you are on, so that is the first thing you choose.
  const brands = [];
  for (const g of logs) if (!brands.some(b => b.name === g.brand)) brands.push({ name: g.brand, slug: g.slug });
  const active = brands.some(b => b.name === S.luts.brand) ? S.luts.brand : '';
  const inBrand = active ? logs.filter(g => g.brand === active) : logs;
  // Under a maker, the camera you are actually on narrows twelve formats to one or two.
  const models = active
    ? [...new Set(inBrand.flatMap(g => g.cameras.split('·').map(x => x.trim()).filter(Boolean)))].sort()
    : [];
  const model = models.includes(S.luts.model) ? S.luts.model : '';
  const shown = model ? inBrand.filter(g => g.cameras.includes(model)) : inBrand;

  const rail = `<div class="lut-rail">
    <button class="lut-brand ${active ? '' : 'on'}" data-lutbrand="">${esc(T('lut_all'))}</button>
    ${brands.map(b => `<button class="lut-brand ${active === b.name ? 'on' : ''}" data-lutbrand="${esc(b.name)}" title="${esc(b.name)}">${
      b.slug ? logoHTML(b.slug, b.name, 'mini') : `<span class="lut-brandname">${esc(b.name)}</span>`
    }</button>`).join('')}
  </div>`;

  const modelRow = models.length > 1
    ? `<div class="card tform" style="padding:10px 12px;margin-bottom:10px">${field(T('lut_camera'), sel('lutmodel', [{ v: '', l: T('all_models') }, ...models.map(m => ({ v: m, l: m }))], model))}</div>`
    : '';

  return rail + modelRow + shown.map(g => `
    <div class="card lut">
      <div class="lut-head">
        <b>${esc(g.name)}</b>
        <span class="pchip">${esc(g.brand)}</span>
      </div>
      <div class="lut-row"><i>${esc(T('lut_cameras'))}</i><span>${esc(g.cameras)}</span></div>
      <div class="lut-row"><i>${esc(T('lut_files'))}</i><span>${g.luts.map(x => `<em>${esc(x)}</em>`).join('')}</span></div>
      <div class="lut-row"><i>${esc(T('lut_source'))}</i><span>${esc(g.source)}${g.verified ? ` <b class="ok-chip">${esc(T('lut_verified'))}</b>` : ''}</span></div>
      <p class="lut-note">${esc(lang === 'he' ? g.noteHe : g.noteEn)}</p>
      ${g.url
        ? `<a class="btn sm" href="${esc(g.url)}" target="_blank" rel="noopener">${esc(T('lut_open'))} \u2197</a>`
        : `<div class="tnote">${esc(T('lut_nolink'))}</div>`}
    </div>`).join('') + `<p class="tnote">${esc(T('lut_disclaimer'))}</p>`;
}

// ---------- hours report ----------
// Times are minutes from midnight so a wrap past midnight is just a number larger than 1440.
const toMin = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const toHHMM = (min) => {
  const v = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};

function hoursTool(T) {
  const s = S.hours;
  const call = toMin(s.call);
  let wrap = toMin(s.wrap);
  if (wrap <= call) wrap += 1440;                 // wrapped after midnight
  const worked = Math.max(0, (wrap - call - Number(s.breaks || 0)) / 60);
  const straight = Math.min(worked, Number(s.otAfter));
  const over = Math.max(0, worked - Number(s.otAfter));
  const nextCall = wrap + Number(s.turnaround) * 60;
  const crossesDay = nextCall >= 1440;

  return `
    ${headline(hm(worked), '', `${esc(T('call_time'))} ${esc(s.call)} · ${esc(T('wrap_time'))} ${esc(s.wrap)}`, over > 0 ? 'warn' : 'ok')}
    <div class="card tform">
      ${field(T('call_time'), `<input type="time" data-f="call" value="${esc(s.call)}">`)}
      ${field(T('wrap_time'), `<input type="time" data-f="wrap" value="${esc(s.wrap)}">`)}
      ${field(T('break_min'), numIn('breaks', s.breaks, { min: 0, max: 600, step: 5 }))}
      ${field(T('ot_after'), sel('otAfter', [8, 9, 10, 11, 12, 13, 14].map(h => ({ v: h, l: `${h} h` })), s.otAfter))}
      ${field(T('turnaround_h'), sel('turnaround', [8, 9, 10, 11, 12, 13, 14].map(h => ({ v: h, l: `${h} h` })), s.turnaround))}
    </div>
    ${out([
      [T('worked'), hm(worked)],
      [T('straight'), hm(straight)],
      [T('overtime'), hm(over), over > 0 ? 'warn' : ''],
      [T('next_call'), `${toHHMM(nextCall)}${crossesDay ? ` · ${esc(T('next_day'))}` : ''}`, 'big'],
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

// The tool re-renders on every input change, so the stream lives here and is re-attached
// to whichever <video> the latest render produced.
let vfStream = null;
async function startViewfinder(ctx) {
  try {
    vfStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    });
    S.fov.vf = true;
    ctx.render();
  } catch {
    S.fov.vf = false;
    toast(L.vf_denied[ctx.lang()] || L.vf_denied.he, { kind: 'err', ms: 4000 });
  }
}
function stopViewfinder(ctx) {
  vfStream?.getTracks().forEach(tr => tr.stop());
  vfStream = null;
  S.fov.vf = false;
  ctx?.render();
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

      if (id === 'luts' && k === 'lutmodel') s.model = el.value;
      if (id === 'media' && k === 'cam') {
        const cam2 = media.cameras.find(x => x.id === s.cam);
        const first = cam2?.formats?.[0];
        if (first) { s.codec = first[0]; s.res = first[1]; }
      }
      if (id === 'media' && k === 'fmt') {
        const cam2 = media.cameras.find(x => x.id === s.cam);
        const pick = cam2?.formats?.[Number(el.value)];
        if (pick) { s.codec = pick[0]; s.res = pick[1]; }
      }
      if (id === 'fov' && k === 'subject') s.frameW = Number(el.value);
      if (id === 'fov' && k === 'cam') s.cam = el.value;
      if (id === 'fov' && k === 'camBrand') { s.camBrand = el.value; s.cam = ''; }
      if (id === 'offload' && k === 'drive') s.mbPerSec = Number(el.value);
      if (id === 'sun' && (k === 'city' || k === 'country')) { s.lat = null; s.lon = null; if (k === 'country') s.city = 0; }
      if (id === 'units' && k === 'group') {
        const g = UNIT_GROUPS.find(x => x.id === s.group);
        s.from = g.units[0].id; s.to = g.units[1].id;
      }
      redraw();
    };
  });

  root.querySelectorAll('[data-lutbrand]').forEach(b => { b.onclick = () => { S.luts.brand = b.dataset.lutbrand; S.luts.model = ''; ctx.render(); }; });
  root.querySelectorAll('[data-lens]').forEach(b => { b.onclick = () => { S.fov.focal = Number(b.dataset.lens); ctx.render(); }; });
  root.querySelectorAll('[data-angle]').forEach(b => {
    b.onclick = () => { S.shutter.angle = Number(b.dataset.angle); redraw(); };
  });

  const video = root.querySelector('.vf-video');
  if (video && vfStream) video.srcObject = vfStream;
  root.querySelector('[data-vf-start]')?.addEventListener('click', () => startViewfinder(ctx));
  root.querySelector('[data-vf-stop]')?.addEventListener('click', () => stopViewfinder(ctx));

  root.querySelector('[data-geo]')?.addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { S.sun.lat = pos.coords.latitude; S.sun.lon = pos.coords.longitude; redraw(); },
      () => {},
      { timeout: 8000 },
    );
  });
}
