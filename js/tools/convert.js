// Copy times and unit conversions — the two arithmetic jobs that come up on every job.

// ---------- offload ----------
// Drives quote MB/s; cards and footage are counted in GB. One offload writes every copy.
export function offload({ gb = 0, mbPerSec = 0, copies = 2, verify = true }) {
  if (!(gb > 0) || !(mbPerSec > 0)) return { perCopyHours: 0, totalHours: 0, totalGb: 0 };
  const perCopySeconds = (gb * 1000) / mbPerSec;
  const passes = copies * (verify ? 2 : 1); // verification reads the copy back
  return {
    perCopyHours: perCopySeconds / 3600,
    totalHours: (perCopySeconds * passes) / 3600,
    totalGb: gb * copies,
    passes,
  };
}

export const DRIVES = [
  { id: 'sd',      he: 'כרטיס SD UHS-II',      en: 'SD UHS-II',            mbPerSec: 250 },
  { id: 'cfa',     he: 'CFexpress Type A',     en: 'CFexpress Type A',     mbPerSec: 700 },
  { id: 'cfb',     he: 'CFexpress Type B',     en: 'CFexpress Type B',     mbPerSec: 1400 },
  { id: 'usb3',    he: 'דיסק USB 3.0',         en: 'USB 3.0 drive',        mbPerSec: 120 },
  { id: 'ssd10',   he: 'SSD USB 10Gb',         en: 'SSD USB 10Gb',         mbPerSec: 900 },
  { id: 'ssd20',   he: 'SSD USB 20Gb',         en: 'SSD USB 20Gb',         mbPerSec: 1800 },
  { id: 'tb3',     he: 'Thunderbolt 3 SSD',    en: 'Thunderbolt 3 SSD',    mbPerSec: 2500 },
  { id: 'raid',    he: 'RAID מסתובב',          en: 'Spinning RAID',        mbPerSec: 400 },
  { id: 'lan1',    he: 'רשת 1 ג׳יגה',          en: '1 GbE network',        mbPerSec: 110 },
  { id: 'lan10',   he: 'רשת 10 ג׳יגה',         en: '10 GbE network',       mbPerSec: 1000 },
];

// ---------- units ----------
// Pairs, not a generic engine: these are the conversions that actually come up with gear.
export const UNIT_GROUPS = [
  {
    id: 'length', he: 'אורך', en: 'Length',
    units: [
      { id: 'mm', label: 'mm', per: 0.001 },
      { id: 'cm', label: 'cm', per: 0.01 },
      { id: 'm',  label: 'm',  per: 1 },
      { id: 'in', label: 'inch', per: 0.0254 },
      { id: 'ft', label: 'feet', per: 0.3048 },
      { id: 'yd', label: 'yard', per: 0.9144 },
    ],
  },
  {
    id: 'weight', he: 'משקל', en: 'Weight',
    units: [
      { id: 'g',  label: 'g',  per: 0.001 },
      { id: 'kg', label: 'kg', per: 1 },
      { id: 'lb', label: 'lb', per: 0.45359237 },
      { id: 'oz', label: 'oz', per: 0.028349523 },
    ],
  },
  {
    id: 'data', he: 'נפח נתונים', en: 'Data',
    units: [
      { id: 'mb',  label: 'MB',  per: 0.001 },
      { id: 'gb',  label: 'GB',  per: 1 },
      { id: 'tb',  label: 'TB',  per: 1000 },
      { id: 'gib', label: 'GiB', per: 1.073741824 },
      { id: 'tib', label: 'TiB', per: 1099.511627776 },
    ],
  },
  {
    id: 'rate', he: 'קצב', en: 'Rate',
    units: [
      { id: 'mbps', label: 'Mbps', per: 1 },
      { id: 'mbs',  label: 'MB/s', per: 8 },
      { id: 'gbps', label: 'Gbps', per: 1000 },
    ],
  },
];

export function convert(groupId, fromId, toId, value) {
  const g = UNIT_GROUPS.find(x => x.id === groupId);
  if (!g) return 0;
  const from = g.units.find(u => u.id === fromId);
  const to = g.units.find(u => u.id === toId);
  if (!from || !to) return 0;
  return (Number(value) * from.per) / to.per;
}

// Temperature does not scale from zero, so it gets its own pair.
export const cToF = (c) => (Number(c) * 9) / 5 + 32;
export const fToC = (f) => ((Number(f) - 32) * 5) / 9;

// A battery's label says mAh at a voltage; a rental house and an airline both want watt-hours.
export const mahToWh = (mah, volts) => (Number(mah) * Number(volts)) / 1000;
export const whToMah = (wh, volts) => (volts > 0 ? (Number(wh) * 1000) / Number(volts) : 0);
