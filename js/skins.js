// Design skins. Each one is a complete palette plus a few structural traits, applied by putting
// data-skin on the root element — switching is pure CSS, nothing re-renders differently.
// A skin is independent of light/dark: every skin defines both.
//
// The camera skins take their cue from the menus those cameras actually show — the grey and amber
// of an ALEXA, the dense blue rows of a VENICE, and so on. They are an homage in colour and
// proportion, not a copy of anyone's interface.

export const SKINS = [
  {
    id: 'clean',
    he: 'נקי', en: 'Clean',
    descHe: 'אוויר, טיפוגרפיה חזקה, צבע רק איפה שהוא נושא מידע',
    descEn: 'Air, strong typography, colour only where it carries meaning',
    swatch: ['#FAF9F7', '#15181C', '#C4161C'],
  },
  {
    id: 'arri',
    he: 'ARRI', en: 'ARRI',
    descHe: 'אפור שטוח, ענבר, פינות ישרות ואותיות קטנות',
    descEn: 'Flat grey, amber, square corners and small caps',
    swatch: ['#2B2B2B', '#EDEDED', '#FFB020'],
  },
  {
    id: 'sony',
    he: 'SONY', en: 'SONY',
    descHe: 'שחור וכחול, שורות צפופות ופונט צר — הרבה מידע במסך',
    descEn: 'Black and blue, dense rows, condensed type — a lot on one screen',
    swatch: ['#0B0B0B', '#EAEAEA', '#1273E6'],
  },
  {
    id: 'blackmagic',
    he: 'Blackmagic', en: 'Blackmagic',
    descHe: 'פחם, אריחים מעוגלים ומרווחים, כחול — הכי נוח לאצבע',
    descEn: 'Charcoal, rounded roomy tiles, blue — the easiest on a finger',
    swatch: ['#1B1B1D', '#F5F5F7', '#0A84FF'],
  },
  {
    id: 'red',
    he: 'RED', en: 'RED',
    descHe: 'שחור, אדום, פאנלים חצי־שקופים ומספרים גדולים',
    descEn: 'Black, red, translucent panels and big numerals',
    swatch: ['#0D0D0D', '#F2F2F2', '#C8102E'],
  },
  {
    id: 'panasonic',
    he: 'Panasonic', en: 'Panasonic',
    descHe: 'פחם קריר וכחול עמוק, שורות מרובעות וצפופות',
    descEn: 'Cool charcoal and deep blue, squared dense rows',
    swatch: ['#1E2126', '#E9EDF2', '#0B57C7'],
  },
  {
    id: 'canon',
    he: 'Canon', en: 'Canon',
    descHe: 'אפור חמים ואדום קאנון, תוויות קטנות וצפיפות של תפריט Cinema EOS',
    descEn: 'Warm grey and Canon red, small labels and Cinema EOS density',
    swatch: ['#2A2724', '#F0EBE6', '#E03A36'],
  },
  {
    id: 'broadcast',
    he: 'שידור', en: 'Broadcast',
    descHe: 'שחור מלא וצהוב — ציוד שידור, הכי ניגודי מהכהים',
    descEn: 'Full black and yellow — broadcast gear, the most contrasty of the dark skins',
    swatch: ['#000000', '#FFFFFF', '#FFD400'],
  },
  {
    id: 'paper',
    he: 'נייר', en: 'Paper',
    descHe: 'המסך נראה כמו הרשימה המודפסת — קווי שיער ופסי מחלקה',
    descEn: 'The screen looks like the printed list — hairlines and department rules',
    swatch: ['#FFFDF8', '#111111', '#111111'],
  },
  {
    id: 'contrast',
    he: 'שמש', en: 'Sun',
    descHe: 'ניגודיות מקסימלית וטקסט גדול — לקריאה באור ישיר',
    descEn: 'Maximum contrast and larger type — for reading in direct sun',
    swatch: ['#FFFFFF', '#000000', '#B00016'],
  },
  {
    id: 'night',
    he: 'לילה', en: 'Night',
    descHe: 'אדום עמום על שחור — לא הורס הסתגלות לחושך בצילומי לילה',
    descEn: 'Dim red on black — keeps your dark adaptation on a night shoot',
    swatch: ['#000000', '#FF4436', '#8C1108'],
  },
];

export const DEFAULT_SKIN = 'clean';
export const isSkin = (id) => SKINS.some(s => s.id === id);
export const skin = (id) => SKINS.find(s => s.id === id) || SKINS[0];
