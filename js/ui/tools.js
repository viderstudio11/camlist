import { esc, icons, toast } from './dom.js';
import { logoHTML } from '../brands.js';
import { toolIcon } from './icons.js';
import { createMedia } from '../tools/media.js';
import { timeFromAngle, angleFromTime, asFraction, flicker, slowMotion, FRAME_RATES, shutterChoices } from '../tools/shutter.js';
import { PRIME_SET, SHOTS, lensFor, frameAt, pickLens, toUnit, fromUnit } from '../tools/fov.js';
import { sunDay } from '../tools/solar.js';
import { offload, transfer, READERS, DRIVES, UNIT_GROUPS, convert, cToF, fToC, mahToWh, whToMah } from '../tools/convert.js';
import { num, hm } from '../format.js';

// Tool labels live here rather than in the global dictionary: they are only ever used on this screen,
// and keeping the pair next to the tool makes it obvious when one side is missing.
const L = {
  tools:      { he: 'כלי עזר', en: 'Tools' },
  tools_sub:  { he: 'מחשבונים לשטח — לא נכנסים לרשימה ולא להדפסה', en: 'Field calculators — they stay out of the list and out of the print' },
  media:      { he: 'מדיה', en: 'Media' },
  media_sub:  { he: 'כמה כרטיסים ליום צילום', en: 'How many cards a shoot day needs' },
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
  camera_step: { he: 'מצלמה', en: 'Camera' },
  distance_step: { he: 'מרחק מהמצולם', en: 'Distance to subject' },
  shot_step: { he: 'סוג שוט', en: 'Shot size' },
  meters: { he: 'מ׳', en: 'm' },
  feet: { he: 'רגל', en: 'ft' },
  verified_only: { he: 'מופיעות רק מצלמות שגודל החיישן שלהן אומת מול היצרן', en: 'Only cameras whose sensor size has been verified with the maker are listed' },
  sensor_line: { he: 'חיישן {w}×{h} מ״מ · {mode}', en: 'Sensor {w}×{h} mm · {mode}' },
  choose_camera_first: { he: 'בחר מצלמה — לפי החיישן שלה נחשב איזו עדשה צריך', en: 'Pick a camera — its sensor decides which lens you need' },
  need_sentence: { he: 'מ־{d} {u}, שוט {shot} על {cam} — מדויק: {mm} מ״מ', en: 'From {d} {u}, a {shot} on {cam} — exactly {mm} mm' },
  frame_line: { he: 'הפריים: {w}×{h} {u} · זווית {a}°', en: 'Frame: {w}×{h} {u} · {a}° wide' },
  lenses_for: { he: 'עדשות מהמאגר שמתאימות ל־{cam}', en: 'Lenses in the catalog that fit {cam}' },
  standard_primes: { he: 'פריימים סטנדרטיים', en: 'Standard primes' },
  tap_lens_hint: { he: 'לחיצה על עדשה מראה בציור מה היא נותנת', en: 'Tap a lens to see what it gives in the drawing' },
  prime_lbl: { he: 'פריים', en: 'Prime' },
  zoom_lbl: { he: 'זום', en: 'Zoom' },
  back_to_rec: { he: 'חזרה להמלצה ({mm} מ״מ)', en: 'Back to the pick ({mm} mm)' },

  angle: { he: 'זווית תריס', en: 'Shutter angle' },
  speed: { he: 'מהירות תריס', en: 'Shutter speed' },
  mains: { he: 'תדר רשת החשמל', en: 'Mains frequency' },
  flicker_ok: { he: 'נקי מפליקר', en: 'Flicker free' },
  flicker_bad: { he: 'עלול להבהב בתאורת רשת', en: 'May flicker under mains light' },
  safe_angles: { he: 'זוויות בטוחות בפריים רייט הזה', en: 'Safe angles at this frame rate' },
  project_fps: { he: 'פריים רייט של הפרויקט', en: 'Project frame rate' },
  shutter_lbl: { he: 'שאטר', en: 'Shutter' },
  media_pick_first: { he: 'בחר מצלמה — הפורמטים והקצבים מגיעים מהיצרן שלה', en: 'Pick a camera — its formats and rates come from its maker' },
  cards_of:   { he: 'כרטיסים של {card}', en: 'cards of {card}' },
  media_sentence: { he: '{h} שעות {fmt} ב־{fps} על {cam} = {total}. כרטיס אחד מחזיק {per}.', en: '{h} hours of {fmt} at {fps} on {cam} = {total}. One card holds {per}.' },
  src_official: { he: 'נתון רשמי', en: 'Official' },
  src_estimate: { he: 'הערכה', en: 'Estimate' },
  max_rate:   { he: 'עד {r} Mbps — הקצב המרבי שהיצרן מפרסם, לכן החישוב מחמיר (לעולם לא חסר)', en: 'up to {r} Mbps — the maximum the maker publishes, so this errs on the safe side' },
  cap_rate:   { he: '{r} Mbps — התקרה של המצלמה ({mb} MB/s), כך שבקצב הזה ה־R3D נדחס יותר', en: '{r} Mbps — the camera’s top write speed ({mb} MB/s), so R3D compresses harder at this rate' },
  usable_note: { he: '(בפועל {u} לכרטיס)', en: '({u} usable per card)' },
  backup_lbl: { he: 'גיבוי — הקלטה לשני הכרטיסים במקביל', en: 'Backup — record to both slots at once' },
  backup_note: { he: 'עם גיבוי, כל טייק נשמר על שני כרטיסים.', en: 'With backup, every take is on two cards.' },
  to_offload: { he: 'כמה זמן לפרוק {total}? ←', en: 'Offload time for {total} →' },
  src_more:   { he: 'מקור', en: 'Source' },
  card_src:   { he: 'גדלי כרטיסים: {s}', en: 'Card sizes: {s}' },
  eff_rate:   { he: '≈{r} Mbps בפועל, לפי זמני ההקלטה של היצרן', en: '≈{r} Mbps effective, from the maker’s recording times' },
  speed_short: { he: 'מהירות', en: 'Speed' },
  angle_short: { he: 'זווית', en: 'Angle' },
  recommended: { he: 'מומלץ', en: 'best' },
  other_val:  { he: 'אחר…', en: 'Other…' },
  mains_50:   { he: '50Hz · ישראל ואירופה', en: '50 Hz · Israel & Europe' },
  mains_60:   { he: '60Hz · ארה״ב', en: '60 Hz · USA' },
  sh_safe:    { he: 'לא יהבהב בתאורת חשמל של {hz}Hz', en: 'No flicker under {hz} Hz mains light' },
  sh_unsafe:  { he: 'עלול להבהב בתאורת חשמל של {hz}Hz — עדיף {rec}', en: 'May flicker under {hz} Hz mains light — use {rec}' },
  sh_none:    { he: 'בפריים רייט הזה אין שאטר שלא מהבהב ב־{hz}Hz — צריך תאורה בלי הבהוב (LED איכותי או HMI אלקטרוני)', en: 'No shutter at this frame rate avoids {hz} Hz flicker — use flicker-free lights (good LED or electronic HMI)' },
  sh_realtime: { he: 'מהירות רגילה', en: 'real time' },
  sh_slow:    { he: 'הילוך איטי פי {n}', en: '{n}× slow motion' },
  sh_fast:    { he: 'הילוך מהיר פי {n}', en: '{n}× fast motion' },
  sh_hint:    { he: '✓ = לא מהבהב בתאורת חשמל. "מומלץ" = הכי קרוב ל־180°, התנועה הטבעית שהעין רגילה אליה.', en: '✓ = no mains flicker. "best" = nearest to 180°, the motion blur the eye is used to.' },
  slowmo: { he: 'סלואו מושן', en: 'Slow motion' },

  footage: { he: 'כמות חומר', en: 'Footage' },
  off_source: { he: 'מקור — הכרטיס בקורא', en: 'Source — the card in its reader' },
  off_for:    { he: 'שעות לפריקת {gb}', en: 'to offload {gb}' },
  off_sentence: { he: '{gb} מ־{src} אל {dst}, {n} עותקים אחד אחרי השני.', en: '{gb} from {src} to {dst}, {n} copies one after another.' },
  off_verify: { he: 'כל עותק נקרא בחזרה לאימות.', en: 'Each copy is read back to verify it.' },
  off_noverify: { he: 'בלי אימות.', en: 'No verify.' },
  off_each:   { he: '{n} מעברים × {t} · צריך {space} בכוננים', en: '{n} passes × {t} · needs {space} across the drives' },
  off_limit_src: { he: 'הקורא הוא צוואר הבקבוק — כונן מהיר יותר לא יקצר.', en: 'The card reader sets the pace — a faster drive won’t help.' },
  off_limit_dst: { he: 'הכונן הוא צוואר הבקבוק — כונן מהיר יותר יקצר את הזמן.', en: 'The drive sets the pace — a faster drive would cut the time.' },
  off_maker:  { he: 'נתון יצרן', en: 'Maker spec' },
  off_caveat: { he: 'המהירות המרבית שהיצרן מפרסם — בפועל זה לרוב קצת יותר לאט', en: 'the top speed the maker publishes — real offloads usually run a little slower' },
  off_from_media: { he: 'מכלי המדיה: יום הצילום שחישבת', en: 'From the media tool: the shoot day you worked out' },
  drive: { he: 'יעד', en: 'Destination' },
  copies: { he: 'מספר עותקים', en: 'Copies' },
  verify: { he: 'כולל אימות', en: 'Verify each copy' },

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
  media: { brand: 'Sony', cam: 'fx6', fmt: '', fps: 25, mtype: '', card: 0, cardPicked: false, customCard: false, backup: false, hours: 10, customHours: false },
  fov: { distance: 4, unit: 'm', shot: 'waist', focal: 0, phone: 'main', vf: false, cam: '', camBrand: '' },
  shutter: { fps: 25, mode: 'speed', speed: 50, angle: 180, mains: 50, projectFps: 25, customFps: false },
  offload: { gb: 1000, reader: 'CFexpress A', drive: 'ssd10', copies: 2, verify: true, customGb: false, fromMedia: false, readOther: false, readMBs: 800, writeOther: false, writeMBs: 1000 },
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

// Short labels for places outside the tools screen (the home screen's tool row).
export const toolLabel = (k, lang) => L[k]?.[lang] ?? L[k]?.he ?? k;

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
const HOUR_CHIPS = [2, 4, 6, 8, 10, 12, 14];
const fpsVal = (v) => (/i$/.test(v) ? v : Number(v));

function mediaTool(T) {
  const s = S.media;
  const Tp = (k, p) => T(k).replace(/\{(\w+)\}/g, (_, x) => p[x] ?? '');
  const chip = (attr, val, label, on, extra = '') => `<button class="chip pick ${on ? 'on' : ''}" ${attr}="${esc(val)}">${label}${extra}</button>`;
  const gb = (x) => (x >= 1000 ? `${num(x / 1000, x % 1000 ? 2 : 0)} TB` : `${num(x, 0)} GB`);

  // Maker first, then the body, then what that body records: three short lists, never a long one.
  const cams = media.cameras.filter(c => c.brand && c.brand !== '—' && c.formats?.length);
  const brands = [...new Set(cams.map(c => c.brand))];
  const cam = cams.find(c => c.id === s.cam) || null;
  if (cam && !s.brand) s.brand = cam.brand;
  const models = cams.filter(c => c.brand === s.brand);
  const fmts = cam ? media.formatsOf(cam) : [];
  const fmt = fmts.find(f => f.key === s.fmt) || fmts[0] || null;
  if (fmt) {
    s.fmt = fmt.key;
    if (!fmt.fps.includes(s.fps)) s.fps = [...fmt.fps].sort((a, b) => Math.abs(parseFloat(a) - 25) - Math.abs(parseFloat(b) - 25))[0];
  }

  // The cards this camera takes. Until the user picks one, the card the maker's own table used.
  const types = cam ? media.mediaOf(cam) : [];
  const kinds = types.length ? types : [{ type: '', sizes: media.cards }];
  if (!s.cardPicked || !kinds.some(t => t.type === s.mtype)) {
    const d = media.defaultCard(cam, fmt) || { type: kinds[0].type, size: kinds[0].sizes[kinds[0].sizes.length >> 1] };
    s.mtype = d.type; s.card = d.size;
  }
  const kind = kinds.find(t => t.type === s.mtype) || kinds[0];
  const usable = media.usableGb(s.mtype, s.card);
  const copies = s.backup && !cam?.oneSlot ? 2 : 1;

  const rate = fmt ? fmt.rate(s.fps) : 0;
  const onCard = media.hoursOn(usable, rate);
  const cards = media.cardsFor(s.hours, usable, rate, copies);
  const totalGb = media.gbPerHour(rate) * s.hours;
  const cardName = `${gb(s.card)}${s.mtype ? ` ${s.mtype}` : ''}`;

  const pick = `<div class="card sh-sec" data-part="cam">
    <div class="tsub">1 · ${esc(T('camera_step'))}</div>
    <div class="chips">${brands.map(b => chip('data-mbrand', b, esc(b), b === s.brand)).join('')}</div>
    ${models.length ? `<div class="chips fov-models">${models.map(c => chip('data-mcam', c.id, esc(c.label), cam && c.id === cam.id)).join('')}</div>` : ''}
  </div>`;
  if (!cam) return `<div class="card sh-answer warn"><p class="sh-line">${esc(T('media_pick_first'))}</p></div>${pick}`;

  // How the rate was reached, in one line; where it comes from, one tap away.
  const rateLine = fmt.capped?.(s.fps) ? Tp('cap_rate', { r: num(rate, 0), mb: num(rate / 8, 0) })
    : fmt.maxOnly ? Tp('max_rate', { r: num(rate, 0) })
      : fmt.fromTimes ? Tp('eff_rate', { r: num(rate, 0) }) : `${num(rate, 0)} Mbps`;
  const sources = [fmt.src, kind.src ? Tp('card_src', { s: kind.src }) : ''].filter(Boolean);

  const shown = Math.min(cards, 24);
  const answer = `<div class="card sh-answer ok">
    <div class="fov-top"><b class="sh-big">${cards || '—'}</b><span class="sh-small">${esc(Tp('cards_of', { card: cardName }))}</span></div>
    <p class="sh-line">${esc(Tp('media_sentence', { h: s.hours, fmt: fmt.label, fps: s.fps, cam: cam.label, total: gb(Math.round(totalGb)), per: hm(onCard) }))}${usable !== s.card ? ` ${esc(Tp('usable_note', { u: gb(usable) }))}` : ''}${copies > 1 ? ` ${esc(T('backup_note'))}` : ''}</p>
    ${cards ? `<div class="cards">${Array.from({ length: shown }, (_, i) => {
      // with a backup, the cards come in identical pairs; the last pair is the part-filled one
      const set = Math.floor(i / copies), sets = cards / copies;
      const part = set === sets - 1 ? (s.hours / onCard) % 1 || 1 : 1;
      return `<span class="cardchip${copies > 1 && i % 2 ? ' twin' : ''}"><i style="height:${(part * 100).toFixed(0)}%"></i><em>${gb(s.card)}</em></span>`;
    }).join('')}${cards > 24 ? `<span class="cardmore">+${cards - 24}</span>` : ''}</div>` : ''}
    <details class="src-more">
      <summary><span class="src-badge ${fmt.official ? 'ok' : 'est'}">${esc(T(fmt.official ? 'src_official' : 'src_estimate'))}</span> ${esc(rateLine)} <span class="src-i" aria-label="${esc(T('src_more'))}">ⓘ</span></summary>
      ${sources.map(x => `<p>${esc(x)}</p>`).join('')}
    </details>
    ${totalGb > 0 ? `<button class="to-offload" data-to-offload="${Math.round(totalGb)}">${esc(Tp('to_offload', { total: gb(Math.round(totalGb)) }))}</button>` : ''}
  </div>`;

  // Frame size first, then the codecs recorded at it: two short rows instead of one long one.
  const groups = media.groupFormats(fmts);
  const group = groups.find(g => g.formats.includes(fmt)) || groups[0];
  const hoursOther = !HOUR_CHIPS.includes(s.hours) || s.customHours;
  const cardOther = !kind.sizes.includes(s.card) || s.customCard;

  return `${answer}${pick}
    <div class="card sh-sec">
      <div class="tsub">2 · ${esc(T('format_pick'))}</div>
      ${groups.length > 1 ? `<div class="chips">${groups.map(g => chip('data-mres', g.res, esc(g.res), g === group)).join('')}</div>` : `<p class="tnote">${esc(group.res)}</p>`}
      <div class="chips fov-models">${group.formats.map(f => chip('data-mfmt', f.key, esc(f.codec), f.key === fmt.key)).join('')}</div>
    </div>
    <div class="card sh-sec">
      <div class="tsub">3 · ${esc(T('fps'))}</div>
      <div class="chips">${fmt.fps.map(x => chip('data-mfps', x, String(x), x === s.fps)).join('')}</div>
    </div>
    <div class="card sh-sec">
      <div class="tsub">4 · ${esc(T('card'))}</div>
      ${kinds.length > 1 ? `<div class="chips">${kinds.map(t => chip('data-mtype', t.type, esc(t.type), t.type === s.mtype)).join('')}</div>` : kind.type ? `<p class="tnote">${esc(kind.type)}</p>` : ''}
      <div class="chips fov-models">${kind.sizes.map(x => chip('data-mcard', x, gb(x), !cardOther && x === s.card)).join('')}${chip('data-mcard-custom', 1, esc(T('other_val')), cardOther)}</div>
      ${cardOther ? `<div class="sh-custom">${field('GB', numIn('card', s.card, { min: 1, max: 100000, step: 1 }))}</div>` : ''}
      ${cam.oneSlot ? '' : `<label class="switch"><span>${esc(T('backup_lbl'))}</span><input type="checkbox" data-f="backup" ${s.backup ? 'checked' : ''}></label>`}
    </div>
    <div class="card sh-sec">
      <div class="tsub">5 · ${esc(T('shoot_hours'))}</div>
      <div class="chips">${HOUR_CHIPS.map(x => chip('data-mhours', x, String(x), !hoursOther && x === s.hours)).join('')}${chip('data-mhours-custom', 1, esc(T('other_val')), hoursOther)}</div>
      ${hoursOther ? `<div class="sh-custom">${field(T('shoot_hours'), numIn('hours', s.hours, { min: 0.5, max: 48, step: 0.5 }))}</div>` : ''}
    </div>`;
}

// ---------- field of view ----------
// A 1.75 m figure drawn once in a 60 × 175 box — one unit to the centimetre — then placed with a
// transform, so the proportions hold at any size. Seven and a half heads tall.
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

// Distance slider: logarithmic, 0.5 m to 30 m, so the short distances where a step matters get
// most of the travel.
const DIST_MIN = 0.5, DIST_MAX = 30;
const distToSlider = (d) => Math.round((Math.log(d / DIST_MIN) / Math.log(DIST_MAX / DIST_MIN)) * 1000);
const sliderToDist = (v) => {
  const d = DIST_MIN * (DIST_MAX / DIST_MIN) ** (v / 1000);
  return d < 3 ? Math.round(d * 10) / 10 : d < 10 ? Math.round(d * 4) / 4 : Math.round(d);
};

function fovTool(T, lang, ctx) {
  const s = S.fov;
  const Tp = (k, p) => T(k).replace(/\{(\w+)\}/g, (_, x) => p[x] ?? '');
  const name = (o) => (lang === 'he' ? o.he : o.en);
  const unit = s.unit === 'ft' ? 'ft' : 'm';
  const uLabel = T(unit === 'ft' ? 'feet' : 'meters');
  // A distance in the chosen unit, rounded the way a tape measure is read.
  const dist = (m) => { const v = toUnit(m, unit); return num(v, v < 10 ? 1 : 0); };

  // Only cameras whose recording sensor area has been verified are offered — the answer is only
  // as right as that number, so a camera without it is left out rather than guessed.
  const cams = (ctx?.compat?.profiles || [])
    .filter(p => p.sensor)
    .map(p => { const product = ctx.catalog.byId(p.id); return { prof: product ? ctx.compat.profileFor(product) : null, product }; })
    .filter(x => x.product && x.prof)
    .sort((a, b) => (a.product.brandName || '').localeCompare(b.product.brandName || '') || a.product.name.localeCompare(b.product.name));
  const brands = [...new Map(cams.map(c => [c.product.brand, c.product.brandName || c.product.brand])).entries()];
  if (!s.camBrand && brands.length === 1) s.camBrand = brands[0][0];
  const models = cams.filter(c => c.product.brand === s.camBrand);
  const cam = cams.find(c => String(c.prof.id) === String(s.cam)) || null;
  const shot = SHOTS.find(x => x.id === s.shot) || SHOTS[3];
  const chip = (attr, val, label, on, extra = '') => `<button class="chip pick ${on ? 'on' : ''}" ${attr}="${esc(val)}">${label}${extra}</button>`;

  const pickCard = `<div class="card sh-sec" data-part="cam">
    <div class="tsub">1 · ${esc(T('camera_step'))}</div>
    <div class="chips">${brands.map(([slug, n]) => chip('data-cbrand', slug, esc(n), slug === s.camBrand)).join('')}</div>
    ${models.length ? `<div class="chips fov-models">${models.map(c => chip('data-cmodel', c.prof.id, esc(c.product.name), cam && c.prof.id === cam.prof.id)).join('')}</div>` : ''}
    ${cam ? `<p class="tnote">${esc(Tp('sensor_line', { w: cam.prof.sensor.w, h: cam.prof.sensor.h, mode: cam.prof.sensor.mode }))}</p>`
      : `<p class="tnote">${esc(T('verified_only'))}</p>`}
  </div>`;

  const distCard = `<div class="card sh-sec" data-part="dist">
    <div class="sh-head"><div class="tsub">2 · ${esc(T('distance_step'))}</div>
      <div class="seg sh-mode"><button class="${unit === 'm' ? 'active' : ''}" data-unit="m">${esc(T('meters'))}</button><button class="${unit === 'ft' ? 'active' : ''}" data-unit="ft">${esc(T('feet'))}</button></div></div>
    <div class="fov-dist"><input type="range" min="0" max="1000" step="1" value="${distToSlider(s.distance)}" data-dist aria-label="${esc(T('distance_step'))}">
      <label class="fov-dnum"><input type="number" data-fdist value="${esc(dist(s.distance))}" min="0.2" max="600" step="0.1" inputmode="decimal"><span>${esc(uLabel)}</span></label></div>
  </div>`;

  const shotCard = `<div class="card sh-sec" data-part="shot">
    <div class="tsub">3 · ${esc(T('shot_step'))}</div>
    <div class="chips">${SHOTS.map(x => chip('data-shot', x.id, esc(name(x)), x.id === shot.id)).join('')}</div>
  </div>`;

  if (!cam) {
    return `<div class="card sh-answer warn" data-part="answer"><p class="sh-line">${esc(T('choose_camera_first'))}</p></div>${pickCard}${distCard}${shotCard}`;
  }

  const sn = cam.prof.sensor;
  const need = lensFor(sn, s.distance, shot.height);

  // The lenses in the catalog that mount on this camera, read as focal ranges off their names.
  const focalOf = (nm = '') => {
    const zoom = nm.match(/(\d{1,4})\s*[-–]\s*(\d{1,4})\s*mm/i);
    if (zoom) return { min: Number(zoom[1]), max: Number(zoom[2]) };
    const prime = nm.match(/(\d{1,4}(?:\.\d)?)\s*mm/i);
    return prime ? { min: Number(prime[1]), max: Number(prime[1]) } : null;
  };
  const byLabel = new Map();
  for (const p of ctx.catalog.products) {
    if (ctx.catalog.deptKey(p.dept) !== 'lenses') continue;
    const f = focalOf(p.name);
    if (!f) continue;
    const v = ctx.compat.verdict(p, cam.prof);
    if (v.status !== 'native' && v.status !== 'adapter') continue;
    const label = f.min === f.max ? `${f.min}` : `${f.min}-${f.max}`;
    if (!byLabel.has(label)) byLabel.set(label, { ...f, label, adapter: v.status === 'adapter' });
  }
  const catalogLenses = [...byLabel.values()].sort((a, b) => a.min - b.min || a.max - b.max);
  const lenses = catalogLenses.length ? catalogLenses : PRIME_SET.map(x => ({ min: x, max: x, label: `${x}` }));
  const rec = pickLens(need, lenses);
  const focal = s.focal > 0 ? s.focal : rec.focal;
  const fr = frameAt(sn, focal, s.distance);
  const isRec = !(s.focal > 0) || s.focal === rec.focal;
  // Which lens that focal length is on: a prime of exactly that length, else the narrowest zoom holding it.
  const onLens = lenses.find(l => l.min === l.max && l.min === focal)
    || lenses.filter(l => l.min <= focal && focal <= l.max).sort((x, y) => (x.max / x.min) - (y.max / y.min))[0];
  const lensName = onLens ? (onLens.min === onLens.max ? T('prime_lbl') : `${T('zoom_lbl')} ${onLens.label}`) : '';

  // Where the frame sits on a 1.75 m person, in metres above the ground: a frame taller than the
  // person stands on the ground; a tighter one sits on the upper body with a little headroom,
  // where an operator would put it. Both drawings below use this, so they always agree.
  const PERSON_M = 1.75;
  const bottomM = fr.heightM >= PERSON_M ? 0 : PERSON_M + fr.heightM * 0.12 - fr.heightM;
  const two = fr.widthM >= PERSON_M * 2.4;
  const figureAt = (x, groundY, h) => {
    const k = h / FIG_H;
    return `<g class="fig" transform="translate(${(x - (FIG_W * k) / 2).toFixed(2)} ${(groundY - h).toFixed(2)}) scale(${k.toFixed(4)})">${FIG}</g>`;
  };

  // 1. The monitor: exactly what the camera sees, in the sensor's own aspect ratio.
  const MW = 320, MH = Math.round((MW * sn.h) / sn.w);
  const mpx = MW / fr.widthM;
  const mGround = MH + bottomM * mpx;
  const people = two ? [MW / 2 - fr.widthM * 0.22 * mpx, MW / 2 + fr.widthM * 0.22 * mpx] : [MW / 2];
  const monitor = `<svg viewBox="0 0 ${MW} ${MH}" class="fov-monitor" role="img" aria-label="${esc(T('framing'))}">
    <defs><clipPath id="fov-clip"><rect width="${MW}" height="${MH}" rx="6"/></clipPath></defs>
    <rect width="${MW}" height="${MH}" rx="6" class="mon-bg"/>
    <g clip-path="url(#fov-clip)"><rect y="${mGround.toFixed(1)}" width="${MW}" height="${MH}" class="mon-floor"/>${people.map(x => figureAt(x, mGround, PERSON_M * mpx)).join('')}</g>
    <rect x="${MW * 0.05}" y="${MH * 0.05}" width="${MW * 0.9}" height="${MH * 0.9}" class="mon-safe"/>
    <path d="M${MW / 2 - 8} ${MH / 2}h16M${MW / 2} ${MH / 2 - 8}v16" class="mon-cross"/>
    <text x="10" y="${MH - 10}" class="mon-mm">${focal}mm</text>
    <rect width="${MW}" height="${MH}" rx="6" class="mon-edge"/>
  </svg>`;

  // 2. The measurement: the same frame on the person against a height scale, with its real size.
  const box = 150, top = 18, L = 28;
  const tallest = Math.max(fr.heightM + bottomM, PERSON_M) * 1.08;
  const px = (box - top) / tallest;
  const fw = fr.widthM * px, fh = fr.heightM * px, ph = PERSON_M * px;
  const vw = Math.max(fw + 30, 200) + L + 40;
  const cx = L + (vw - L - 40) / 2;
  const gy = box - 2;
  const fx0 = cx - fw / 2, fx1 = cx + fw / 2, fy = gy - (bottomM + fr.heightM) * px;
  const step = unit === 'ft' ? 0.6096 : 0.5; // a tick every 2 ft or every half metre
  const ticks = [];
  for (let m = 0; m <= tallest + 1e-9; m += step) {
    const y = gy - m * px;
    ticks.push(`<line x1="${L - 6}" y1="${y.toFixed(1)}" x2="${L}" y2="${y.toFixed(1)}" class="ms-tick"/><text x="${L - 8}" y="${(y + 3.5).toFixed(1)}" class="ms-num" text-anchor="end">${num(toUnit(m, unit), unit === 'ft' ? 0 : 1)}</text>`);
  }
  const measured = `<svg viewBox="0 0 ${vw.toFixed(0)} ${box}" class="fov-measure" role="img">
    <line x1="${L}" y1="${top - 6}" x2="${L}" y2="${gy}" class="ms-tick"/>${ticks.join('')}
    <line x1="${L}" y1="${gy}" x2="${vw}" y2="${gy}" class="ms-ground"/>
    ${(two ? [cx - fw * 0.22, cx + fw * 0.22] : [cx]).map(x => figureAt(x, gy, ph)).join('')}
    <rect x="${fx0.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" class="ms-frame"/>
    <path d="M${(fx1 + 8).toFixed(1)} ${fy.toFixed(1)}v${fh.toFixed(1)}M${(fx1 + 4).toFixed(1)} ${fy.toFixed(1)}h8M${(fx1 + 4).toFixed(1)} ${(fy + fh).toFixed(1)}h8" class="ms-dim"/>
    <text x="${(fx1 + 13).toFixed(1)}" y="${(fy + fh / 2 + 4).toFixed(1)}" class="ms-lbl">${num(toUnit(fr.heightM, unit), 2)}</text>
    <path d="M${fx0.toFixed(1)} ${(fy - 7).toFixed(1)}h${fw.toFixed(1)}M${fx0.toFixed(1)} ${(fy - 11).toFixed(1)}v8M${fx1.toFixed(1)} ${(fy - 11).toFixed(1)}v8" class="ms-dim"/>
    <text x="${cx.toFixed(1)}" y="${(fy - 12).toFixed(1)}" class="ms-lbl" text-anchor="middle">${num(toUnit(fr.widthM, unit), 2)} ${esc(uLabel)}</text>
  </svg>`;

  const answer = `<div class="card sh-answer ok" data-part="answer">
    <div class="fov-top"><b class="sh-big">${focal}<small>mm</small></b>${lensName ? `<span class="sh-small">${esc(lensName)}</span>` : ''}${isRec ? `<span class="sh-rec">${esc(T('recommended'))}</span>` : `<button class="linkbtn" data-lens-reset>${esc(Tp('back_to_rec', { mm: rec.focal }))}</button>`}</div>
    <p class="sh-line">${esc(Tp('need_sentence', { d: dist(s.distance), u: uLabel, shot: name(shot), cam: cam.product.name, mm: num(need, 1) }))}</p>
    ${monitor}
    ${measured}
    <p class="tnote">${esc(Tp('frame_line', { w: num(toUnit(fr.widthM, unit), 2), h: num(toUnit(fr.heightM, unit), 2), u: uLabel, a: num(fr.hFov, 0) }))}</p>
  </div>`;

  const lensCard = `<div class="card sh-sec" data-part="lenses">
    <div class="tsub">${esc(catalogLenses.length ? Tp('lenses_for', { cam: cam.product.name }) : T('standard_primes'))}</div>
    <div class="chips">${lenses.map(l => {
      const on = l.min <= focal && focal <= l.max;
      const recd = l.min === rec.min && l.max === rec.max;
      return chip('data-lens', l.min === l.max ? l.min : Math.min(Math.max(Math.round(need), l.min), l.max), `${esc(l.label)}`, on, recd ? `<i class="sh-rec">${esc(T('recommended'))}</i>` : '');
    }).join('')}</div>
    <p class="tnote">${esc(T('tap_lens_hint'))}</p>
  </div>`;

  const ph2 = phoneLens(s.phone);
  const phoneFov = eqHFov(ph2.eq);
  const ratio = Math.tan((fr.hFov / 2) * Math.PI / 180) / Math.tan((phoneFov / 2) * Math.PI / 180);
  const viewfinder = `<div class="card vf-card" data-part="vf">
    <div class="pw-head"><b>${esc(T('viewfinder'))}</b><span class="pchip">${num(fr.hFov, 1)}°</span></div>
    ${s.vf ? `
      <div class="vf-stage">
        <video class="vf-video" playsinline autoplay muted></video>
        <div class="vf-overlay">
          ${ratio <= 1
            ? `<div class="vf-frame" style="width:${(ratio * 100).toFixed(1)}%;aspect-ratio:${(sn.w / sn.h).toFixed(3)}"><span>${esc(focal)}mm</span></div>`
            : `<div class="vf-wide">${esc(T('vf_wider'))}</div>`}
        </div>
      </div>
      <div class="tform" style="padding:12px 14px">${field(T('vf_lens'), sel('phone', PHONE_LENSES.map(x => ({ v: x.id, l: `${lang === 'he' ? x.he : x.en} · ${x.eq}mm` })), s.phone))}</div>
      <div class="tnote" style="padding:0 14px 12px">${esc(T('vf_approx'))}</div>
      <div style="padding:0 14px 14px"><button class="btn sm" data-vf-stop>${esc(T('vf_stop'))}</button></div>`
      : `<div style="padding:12px 14px">
          <button class="btn" data-vf-start style="width:100%">${esc(T('vf_start'))}</button>
          <div class="tnote" style="margin-top:9px">${esc(T('vf_hint'))}</div>
        </div>`}
  </div>`;

  return `${answer}${pickCard}${distCard}${shotCard}${lensCard}${viewfinder}`;
}

// ---------- shutter ----------
function shutterTool(T) {
  const s = S.shutter;
  const Tp = (k, p) => T(k).replace(/\{(\w+)\}/g, (_, x) => p[x] ?? '');
  const { options, recommended, anySafe } = shutterChoices(s.fps, s.mains, s.mode);
  const seconds = s.mode === 'angle' ? timeFromAngle(s.fps, s.angle) : 1 / s.speed;
  const angle = Math.round(angleFromTime(s.fps, seconds) * 10) / 10;
  const f = flicker(seconds, s.mains);
  const slow = slowMotion(s.fps, s.projectFps);
  const fmt = (n) => String(n);
  const isOn = (o) => (s.mode === 'angle' ? Math.abs(o.value - s.angle) < 0.06 : o.value === s.speed);

  // The answer in words: what you are shooting, whether the lights will flicker, what it plays back as.
  const flickerLine = f.safe ? Tp('sh_safe', { hz: s.mains })
    : anySafe ? Tp('sh_unsafe', { hz: s.mains, rec: recommended.label })
      : Tp('sh_none', { hz: s.mains });
  const slowLine = Math.abs(slow.factor - 1) < 0.01 ? T('sh_realtime')
    : slow.factor > 1 ? Tp('sh_slow', { n: Math.round(slow.factor * 100) / 100 })
      : Tp('sh_fast', { n: Math.round((1 / slow.factor) * 100) / 100 });

  const a = Math.max(1, Math.min(angle, 360));
  const r = 42, cxy = 50;
  const [ex, ey] = [cxy + r * Math.sin((a * Math.PI) / 180), cxy - r * Math.cos((a * Math.PI) / 180)];
  const dial = `<svg viewBox="0 0 100 100" class="dial-svg" role="img" aria-label="${a}°">
    <circle cx="${cxy}" cy="${cxy}" r="${r}" class="d-ring"/>
    <path d="M${cxy} ${cxy} L${cxy} ${cxy - r} A${r} ${r} 0 ${a > 180 ? 1 : 0} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z" class="d-open"/>
    <circle cx="${cxy}" cy="${cxy}" r="3" class="d-hub"/>
  </svg>`;

  const chip = (attr, val, label, on, extra = '') => `<button class="chip pick ${on ? 'on' : ''}" ${attr}="${val}">${label}${extra}</button>`;

  return `
    <div class="card sh-answer ${f.safe ? 'ok' : 'warn'}">
      <div class="sh-top">${dial}
        <div class="sh-main">
          <b class="sh-big">${s.mode === 'angle' ? `${fmt(s.angle)}°` : asFraction(seconds)}</b>
          <span class="sh-small">${s.mode === 'angle' ? asFraction(seconds) : `${angle}°`} · ${fmt(s.fps)} fps</span>
        </div>
      </div>
      <p class="sh-line ${f.safe ? 'ok' : 'warn'}">${f.safe ? '✓' : '⚠'} ${esc(flickerLine)}</p>
      <p class="sh-line">${esc(T('slowmo'))}: ${esc(slowLine)}</p>
    </div>

    <div class="card sh-sec">
      <div class="tsub">${esc(T('fps'))}</div>
      <div class="chips">${FRAME_RATES.map(x => chip('data-fps', x, fmt(x), !s.customFps && x === s.fps)).join('')}${chip('data-fps-custom', 1, esc(T('other_val')), s.customFps || !FRAME_RATES.includes(s.fps))}</div>
      ${s.customFps || !FRAME_RATES.includes(s.fps) ? `<div class="sh-custom">${field(T('fps'), numIn('fps', s.fps, { min: 1, max: 1000, step: 'any' }))}</div>` : ''}
    </div>

    <div class="card sh-sec">
      <div class="sh-head"><div class="tsub">${esc(T('shutter_lbl'))}</div>
        <div class="seg sh-mode"><button class="${s.mode === 'speed' ? 'active' : ''}" data-shmode="speed">${esc(T('speed_short'))}</button><button class="${s.mode === 'angle' ? 'active' : ''}" data-shmode="angle">${esc(T('angle_short'))}</button></div></div>
      <div class="chips">${options.map(o => chip('data-shv', o.value, esc(o.label), isOn(o),
        `${o.safe ? '<i class="sh-ok">✓</i>' : ''}${recommended && o.value === recommended.value ? `<i class="sh-rec">${esc(T('recommended'))}</i>` : ''}`)).join('')}</div>
      <p class="tnote">${esc(T('sh_hint'))}</p>
    </div>

    <div class="card sh-sec">
      <div class="tsub">${esc(T('mains'))}</div>
      <div class="chips">${chip('data-mains', 50, esc(T('mains_50')), s.mains === 50)}${chip('data-mains', 60, esc(T('mains_60')), s.mains === 60)}</div>
      <div class="tsub" style="margin-top:14px">${esc(T('project_fps'))}</div>
      <div class="chips">${[23.98, 24, 25, 29.97, 30].map(x => chip('data-proj', x, fmt(x), x === s.projectFps)).join('')}</div>
    </div>`;
}

// ---------- offload ----------
const GB_CHIPS = [256, 512, 1000, 2000, 4000];

function offloadTool(T, lang) {
  const s = S.offload;
  const Tp = (k, p) => T(k).replace(/\{(\w+)\}/g, (_, x) => p[x] ?? '');
  const chip = (attr, val, label, on) => `<button class="chip pick ${on ? 'on' : ''}" ${attr}="${esc(val)}">${label}</button>`;
  const gb = (x) => (x >= 1000 ? `${num(x / 1000, x % 1000 ? 2 : 0)} TB` : `${num(x, 0)} GB`);
  const name = (x) => (lang === 'he' ? x.he : x.en);

  // One end is the card in its reader, the other the drive; the slower one sets the pace.
  const rd = READERS.find(x => x.id === s.reader) || READERS[0];
  const dv = DRIVES.find(x => x.id === s.drive) || DRIVES[0];
  const readMBs = s.readOther ? s.readMBs : rd.mbPerSec;
  const writeMBs = s.writeOther ? s.writeMBs : dv.mbPerSec;
  const t = transfer(readMBs, writeMBs);
  const r = offload({ gb: s.gb, mbPerSec: t.mbPerSec, copies: s.copies, verify: s.verify });
  const srcName = s.readOther ? `${num(readMBs, 0)} MB/s` : `${name(rd)} (${num(readMBs, 0)} MB/s)`;
  const dstName = s.writeOther ? `${num(writeMBs, 0)} MB/s` : `${name(dv)} (${num(writeMBs, 0)} MB/s)`;
  const sources = [!s.readOther && rd.src, !s.writeOther && dv.src].filter(Boolean);

  const gbOther = !GB_CHIPS.includes(s.gb) || s.customGb;
  const answer = `<div class="card sh-answer ok">
    <div class="fov-top"><b class="sh-big">${r.totalHours ? hm(r.totalHours) : '—'}</b><span class="sh-small">${esc(Tp('off_for', { gb: gb(s.gb) }))}</span></div>
    <p class="sh-line">${esc(Tp('off_sentence', { gb: gb(s.gb), src: srcName, dst: dstName, n: s.copies }))} ${esc(T(s.verify ? 'off_verify' : 'off_noverify'))}</p>
    ${r.passes ? `<div class="passes">${Array.from({ length: r.passes }, (_, i) => {
      const check = s.verify && i % 2;
      return `<span class="pass ${check ? 'verify' : ''}">${check ? '✓' : Math.floor(i / (s.verify ? 2 : 1)) + 1}</span>`;
    }).join('')}</div>
    <p class="tnote">${esc(Tp('off_each', { n: r.passes, t: hm(r.perCopyHours), space: gb(r.totalGb) }))}</p>` : ''}
    <p class="sh-line ${t.limit === 'source' ? '' : 'warn'}">${esc(T(t.limit === 'source' ? 'off_limit_src' : 'off_limit_dst'))}</p>
    <details class="src-more">
      <summary><span class="src-badge ok">${esc(T('off_maker'))}</span> ${esc(T('off_caveat'))} <span class="src-i">ⓘ</span></summary>
      ${sources.map(x => `<p>${esc(x)}</p>`).join('')}
    </details>
  </div>`;

  return `${answer}
    <div class="card sh-sec">
      <div class="tsub">1 · ${esc(T('footage'))}</div>
      ${s.fromMedia ? `<p class="tnote">${esc(T('off_from_media'))}</p>` : ''}
      <div class="chips">${GB_CHIPS.map(x => chip('data-ogb', x, gb(x), !gbOther && x === s.gb)).join('')}${chip('data-ogb-custom', 1, esc(T('other_val')), gbOther)}</div>
      ${gbOther ? `<div class="sh-custom">${field('GB', numIn('gb', s.gb, { min: 1, max: 200000, step: 1 }))}</div>` : ''}
    </div>
    <div class="card sh-sec">
      <div class="tsub">2 · ${esc(T('off_source'))}</div>
      <div class="chips">${READERS.map(x => chip('data-oread', x.id, esc(name(x)), !s.readOther && x.id === rd.id)).join('')}${chip('data-oread-custom', 1, esc(T('other_val')), s.readOther)}</div>
      ${s.readOther ? `<div class="sh-custom">${field('MB/s', numIn('readMBs', s.readMBs, { min: 1, max: 10000, step: 10 }))}</div>` : ''}
    </div>
    <div class="card sh-sec">
      <div class="tsub">3 · ${esc(T('drive'))}</div>
      <div class="chips">${DRIVES.map(x => chip('data-odrive', x.id, esc(name(x)), !s.writeOther && x.id === dv.id)).join('')}${chip('data-odrive-custom', 1, esc(T('other_val')), s.writeOther)}</div>
      ${s.writeOther ? `<div class="sh-custom">${field('MB/s', numIn('writeMBs', s.writeMBs, { min: 1, max: 10000, step: 10 }))}</div>` : ''}
    </div>
    <div class="card sh-sec">
      <div class="tsub">4 · ${esc(T('copies'))}</div>
      <div class="chips">${[1, 2, 3].map(x => chip('data-ocopies', x, String(x), x === s.copies)).join('')}</div>
      <label class="switch"><span>${esc(T('verify'))}</span><input type="checkbox" data-f="verify" ${s.verify ? 'checked' : ''}></label>
    </div>`;
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
      if (id === 'fov' && k === 'distance') s.focal = 0;
      if (id === 'media' && k === 'card') s.cardPicked = true;
      if (id === 'fov' && k === 'cam') s.cam = el.value;
      if (id === 'fov' && k === 'camBrand') { s.camBrand = el.value; s.cam = ''; }
      if (id === 'shutter' && k === 'fps') { s.speed = shutterChoices(s.fps, s.mains, 'speed').recommended?.value ?? s.speed; s.angle = shutterChoices(s.fps, s.mains, 'angle').recommended?.value ?? s.angle; }
      if (id === 'offload' && k === 'gb') s.fromMedia = false;
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
  root.querySelector('[data-lens-reset]')?.addEventListener('click', () => { S.fov.focal = 0; ctx.render(); });
  root.querySelectorAll('[data-cbrand]').forEach(b => { b.onclick = () => { S.fov.camBrand = b.dataset.cbrand; S.fov.cam = ''; S.fov.focal = 0; ctx.render(); }; });
  root.querySelectorAll('[data-cmodel]').forEach(b => { b.onclick = () => { S.fov.cam = b.dataset.cmodel; S.fov.focal = 0; ctx.render(); }; });
  // A new camera starts again from the card its maker's table used.
  const newCam = (m) => Object.assign(m, { fmt: '', cardPicked: false, customCard: false });
  root.querySelectorAll('[data-mbrand]').forEach(b => { b.onclick = () => { S.media.brand = b.dataset.mbrand; S.media.cam = ''; newCam(S.media); ctx.render(); }; });
  root.querySelectorAll('[data-mcam]').forEach(b => { b.onclick = () => { S.media.cam = b.dataset.mcam; newCam(S.media); ctx.render(); }; });
  root.querySelectorAll('[data-mres]').forEach(b => { b.onclick = () => {
    // keep the codec when the new frame size has it
    const fmts = media.formatsOf(media.cameras.find(c => c.id === S.media.cam));
    const cur = fmts.find(f => f.key === S.media.fmt);
    const at = fmts.filter(f => f.res === b.dataset.mres);
    S.media.fmt = (at.find(f => f.codec === cur?.codec) || at[0])?.key || '';
    ctx.render();
  }; });
  root.querySelectorAll('[data-mfmt]').forEach(b => { b.onclick = () => { S.media.fmt = b.dataset.mfmt; ctx.render(); }; });
  root.querySelectorAll('[data-mfps]').forEach(b => { b.onclick = () => { S.media.fps = fpsVal(b.dataset.mfps); ctx.render(); }; });
  root.querySelectorAll('[data-mtype]').forEach(b => { b.onclick = () => {
    const t = media.mediaOf(media.cameras.find(c => c.id === S.media.cam)).find(x => x.type === b.dataset.mtype);
    Object.assign(S.media, { mtype: t.type, card: t.sizes[t.sizes.length >> 1], cardPicked: true, customCard: false });
    ctx.render();
  }; });
  root.querySelectorAll('[data-mcard]').forEach(b => { b.onclick = () => { Object.assign(S.media, { card: Number(b.dataset.mcard), cardPicked: true, customCard: false }); ctx.render(); }; });
  root.querySelector('[data-mcard-custom]')?.addEventListener('click', () => { Object.assign(S.media, { customCard: true, cardPicked: true }); ctx.render(); });
  // The media tool hands over the day's footage and the card it goes on.
  root.querySelector('[data-to-offload]')?.addEventListener('click', (e) => {
    Object.assign(S.offload, { gb: Number(e.currentTarget.dataset.toOffload), fromMedia: true, customGb: false });
    if (READERS.some(x => x.id === S.media.mtype)) Object.assign(S.offload, { reader: S.media.mtype, readOther: false });
    ctx.navigate('#/tools/offload');
  });
  const off = S.offload;
  root.querySelectorAll('[data-ogb]').forEach(b => { b.onclick = () => { Object.assign(off, { gb: Number(b.dataset.ogb), customGb: false, fromMedia: false }); ctx.render(); }; });
  root.querySelector('[data-ogb-custom]')?.addEventListener('click', () => { off.customGb = true; ctx.render(); });
  root.querySelectorAll('[data-oread]').forEach(b => { b.onclick = () => { Object.assign(off, { reader: b.dataset.oread, readOther: false }); ctx.render(); }; });
  root.querySelector('[data-oread-custom]')?.addEventListener('click', () => { off.readOther = true; ctx.render(); });
  root.querySelectorAll('[data-odrive]').forEach(b => { b.onclick = () => { Object.assign(off, { drive: b.dataset.odrive, writeOther: false }); ctx.render(); }; });
  root.querySelector('[data-odrive-custom]')?.addEventListener('click', () => { off.writeOther = true; ctx.render(); });
  root.querySelectorAll('[data-ocopies]').forEach(b => { b.onclick = () => { off.copies = Number(b.dataset.ocopies); ctx.render(); }; });
  root.querySelectorAll('[data-mhours]').forEach(b => { b.onclick = () => { S.media.hours = Number(b.dataset.mhours); S.media.customHours = false; ctx.render(); }; });
  root.querySelector('[data-mhours-custom]')?.addEventListener('click', () => { S.media.customHours = true; ctx.render(); });
  root.querySelectorAll('[data-unit]').forEach(b => { b.onclick = () => { S.fov.unit = b.dataset.unit; ctx.render(); }; });
  const fdist = root.querySelector('[data-fdist]');
  if (fdist) fdist.onchange = () => { const v = Number(fdist.value); if (v > 0) { S.fov.distance = fromUnit(v, S.fov.unit); S.fov.focal = 0; } ctx.render(); };
  root.querySelectorAll('[data-shot]').forEach(b => { b.onclick = () => { S.fov.shot = b.dataset.shot; S.fov.focal = 0; ctx.render(); }; });
  // Dragging the distance redraws everything but the slider itself, so the drag is never interrupted.
  const dist = root.querySelector('[data-dist]');
  if (dist) dist.oninput = () => {
    S.fov.distance = sliderToDist(Number(dist.value));
    S.fov.focal = 0;
    const tpl = document.createElement('template');
    tpl.innerHTML = fovTool(T, lang, ctx);
    tpl.content.querySelectorAll('[data-part]').forEach(fresh => {
      const part = fresh.dataset.part;
      if (part === 'dist') { const n = root.querySelector('[data-part="dist"] [data-fdist]'); const v = toUnit(S.fov.distance, S.fov.unit); if (n) n.value = num(v, v < 10 ? 1 : 0); return; }
      root.querySelector(`[data-part="${part}"]`)?.replaceWith(fresh);
    });
    wire(root, ctx, id, T, lang);
  };
  // Frame rate and shutter. A new frame rate or mains frequency moves the shutter to the recommended
  // value, so nobody is left on a combination that no longer makes sense.
  const sh = S.shutter;
  const recommend = () => {
    sh.speed = shutterChoices(sh.fps, sh.mains, 'speed').recommended?.value ?? sh.speed;
    sh.angle = shutterChoices(sh.fps, sh.mains, 'angle').recommended?.value ?? sh.angle;
  };
  root.querySelectorAll('[data-fps]').forEach(b => { b.onclick = () => { sh.fps = Number(b.dataset.fps); sh.customFps = false; recommend(); redraw(); }; });
  root.querySelector('[data-fps-custom]')?.addEventListener('click', () => { sh.customFps = true; redraw(); });
  root.querySelectorAll('[data-mains]').forEach(b => { b.onclick = () => { sh.mains = Number(b.dataset.mains); recommend(); redraw(); }; });
  root.querySelectorAll('[data-proj]').forEach(b => { b.onclick = () => { sh.projectFps = Number(b.dataset.proj); redraw(); }; });
  root.querySelectorAll('[data-shv]').forEach(b => { b.onclick = () => { sh[sh.mode === 'angle' ? 'angle' : 'speed'] = Number(b.dataset.shv); redraw(); }; });
  root.querySelectorAll('[data-shmode]').forEach(b => { b.onclick = () => {
    const to = b.dataset.shmode;
    if (to === sh.mode) return;
    const secs = sh.mode === 'angle' ? timeFromAngle(sh.fps, sh.angle) : 1 / sh.speed;
    if (to === 'angle') sh.angle = Math.round(angleFromTime(sh.fps, secs) * 10) / 10;
    else sh.speed = Math.round(1 / secs);
    sh.mode = to; redraw();
  }; });

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
