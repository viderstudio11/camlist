// Design skins. A skin is a whole language, not a palette: typeface, density, how a selected row
// is marked, how a department heading is drawn, what a button looks like, whether numerals are
// monospaced. It is applied by putting data-skin on the root element, so switching is pure CSS.
//
// The camera skins are an homage in colour, type and proportion to the menus those cameras show —
// moving from ARRI to SONY should feel like picking up a different body. They are not copies of
// anyone's interface.
//
// `fonts` names the Google Fonts families a skin needs. They are fetched only when that skin is
// chosen, so eleven typefaces never load at once. Hebrew always falls through to a face that has it.

export const SKINS = [
  {
    id: 'clean', group: 'plain',
    he: 'נקי', en: 'Clean',
    descHe: 'אוויר, טיפוגרפיה חזקה, צבע רק איפה שהוא נושא מידע',
    descEn: 'Air, strong typography, colour only where it carries meaning',
    swatch: ['#F5F4F1', '#14171A', '#C4161C'],
    fonts: ['Assistant:wght@400;500;600;700;800'],
  },
  {
    id: 'arri', group: 'camera',
    he: 'ARRI', en: 'ARRI',
    descHe: 'אפור שטוח, ענבר, תוויות באותיות קטנות ומספרים במונוספייס',
    descEn: 'Flat grey, amber, small-caps labels and monospaced numerals',
    swatch: ['#262626', '#EFEFEF', '#FFB020'],
    fonts: ['Heebo:wght@400;500;700;800;900', 'IBM+Plex+Mono:wght@400;500;600'],
  },
  {
    id: 'sony', group: 'camera',
    he: 'SONY', en: 'SONY',
    descHe: 'שחור וכחול, פונט צר ושורות צפופות — הרבה פרמטרים במסך',
    descEn: 'Black and blue, condensed type, dense rows — many parameters on screen',
    swatch: ['#0B0B0B', '#EDEDED', '#1273E6'],
    fonts: ['Barlow+Condensed:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'blackmagic', group: 'camera',
    he: 'Blackmagic', en: 'Blackmagic',
    descHe: 'פחם, אריחים מעוגלים ומרווחים, כחול — הכי נוח לאצבע',
    descEn: 'Charcoal, rounded roomy tiles, blue — the easiest on a finger',
    swatch: ['#1B1B1D', '#F5F5F7', '#0A84FF'],
    fonts: ['Assistant:wght@400;500;600;700;800'],
  },
  {
    id: 'red', group: 'camera',
    he: 'RED', en: 'RED',
    descHe: 'שחור ואדום, כותרות צרות באותיות גדולות ומספרים ענקיים',
    descEn: 'Black and red, narrow uppercase headings and oversized numerals',
    swatch: ['#0D0D0D', '#F2F2F2', '#C8102E'],
    fonts: ['Oswald:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'panasonic', group: 'camera',
    he: 'Panasonic', en: 'Panasonic',
    descHe: 'פחם קריר וכחול עמוק, טיפוגרפיה טכנית ושורות מרובעות',
    descEn: 'Cool charcoal and deep blue, technical type and squared rows',
    swatch: ['#1E2126', '#E9EDF2', '#3D8BFF'],
    fonts: ['IBM+Plex+Sans:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'canon', group: 'camera',
    he: 'Canon', en: 'Canon',
    descHe: 'אפור חמים ואדום קאנון, תוויות זעירות וצפיפות של Cinema EOS',
    descEn: 'Warm grey and Canon red, tiny labels and Cinema EOS density',
    swatch: ['#2A2724', '#F0EBE6', '#E03A36'],
    fonts: ['Barlow:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'broadcast', group: 'camera',
    he: 'שידור', en: 'Broadcast',
    descHe: 'שחור וצהוב, הכול במונוספייס — ציוד שידור',
    descEn: 'Black and yellow, all monospaced — broadcast gear',
    swatch: ['#000000', '#FFFFFF', '#FFD400'],
    fonts: ['IBM+Plex+Mono:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },

  {
    id: 'pixel', group: 'fun',
    he: '8 ביט', en: '8-bit',
    descHe: 'מספרים ותוויות בפיקסלים, מדים בבלוקים, מסגרות מדורגות',
    descEn: 'Pixel numerals and labels, block meters, stepped borders',
    swatch: ['#12131A', '#E8EAF2', '#4BE07C'],
    fonts: ['Press+Start+2P', 'Heebo:wght@400;500;700;800;900'],
  },
  {
    id: 'terminal', group: 'fun',
    he: 'טרמינל', en: 'Terminal',
    descHe: 'זרחן ירוק על שחור, הכול במונוספייס — קריא מאוד, וכן, גם מגניב',
    descEn: 'Green phosphor on black, all monospaced — genuinely legible, and yes, cool',
    swatch: ['#05090A', '#3DFF7A', '#1B8F42'],
    fonts: ['IBM+Plex+Mono:wght@400;500;600;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'blueprint', group: 'fun',
    he: 'שרטוט', en: 'Blueprint',
    descHe: 'תכלת על כחול כהה, קווי רשת וכותרות שרטוט',
    descEn: 'Cyan on deep blue, grid lines and drafting headings',
    swatch: ['#0B1B33', '#CFE6FF', '#5AC8FF'],
    fonts: ['IBM+Plex+Mono:wght@400;500;600', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'callsheet', group: 'fun',
    he: 'דף קריאה', en: 'Call sheet',
    descHe: 'קלידנית על נייר קרם — כמו קול שיט שמגיע בבוקר',
    descEn: 'Typewriter on cream paper — like the call sheet that lands in the morning',
    swatch: ['#FBF7EC', '#1A1712', '#8A2B12'],
    fonts: ['Courier+Prime:wght@400;700', 'Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'eink', group: 'fun',
    he: 'נייר אלקטרוני', en: 'E-ink',
    descHe: 'אפור־שחור בלבד עם גופן סריפי — אפס צבע, קריאוּת מקסימלית',
    descEn: 'Greyscale only with a serif face — no colour at all, maximum legibility',
    swatch: ['#F7F6F3', '#111111', '#555555'],
    fonts: ['Frank+Ruhl+Libre:wght@400;500;700;900'],
  },

  {
    id: 'paper', group: 'plain',
    he: 'נייר', en: 'Paper',
    descHe: 'המסך נראה כמו הרשימה המודפסת — קווי שיער ופסי מחלקה',
    descEn: 'The screen looks like the printed list — hairlines and department rules',
    swatch: ['#FFFDF8', '#111111', '#111111'],
    fonts: ['Noto+Sans+Hebrew:wght@400;500;700;800'],
  },
  {
    id: 'contrast', group: 'plain',
    he: 'שמש', en: 'Sun',
    descHe: 'ניגודיות מקסימלית וטקסט גדול — לקריאה באור ישיר',
    descEn: 'Maximum contrast and larger type — for reading in direct sun',
    swatch: ['#FFFFFF', '#000000', '#B00016'],
    fonts: ['Heebo:wght@400;500;700;800;900'],
  },
  {
    id: 'night', group: 'plain',
    he: 'לילה', en: 'Night',
    descHe: 'אדום על שחור — לא הורס הסתגלות לחושך בצילומי לילה',
    descEn: 'Red on black — keeps your dark adaptation on a night shoot',
    swatch: ['#000000', '#FF6B5A', '#FF3B28'],
    fonts: ['Heebo:wght@400;500;700;800;900'],
  },
];

export const GROUPS = [
  { id: 'camera', he: 'מצלמות', en: 'Cameras' },
  { id: 'fun', he: 'סגנונות', en: 'Styles' },
  { id: 'plain', he: 'שימושי', en: 'Utility' },
];

export const DEFAULT_SKIN = 'clean';
export const isSkin = (id) => SKINS.some(s => s.id === id);
export const skin = (id) => SKINS.find(s => s.id === id) || SKINS[0];

// A skin's typefaces are fetched the first time it is chosen, and the link is left in place
// so switching back and forth does not refetch.
const loaded = new Set();
export function loadSkinFonts(id, doc = document) {
  const s = skin(id);
  for (const family of s.fonts || []) {
    if (loaded.has(family)) continue;
    loaded.add(family);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
    doc.head.appendChild(link);
  }
}
