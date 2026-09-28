// Bitrate for a recording format, from data/codecs.json.
// Three models, because manufacturers publish their rates three different ways:
//   bpp    — bits per pixel per frame; the rate rises with both resolution and frame rate (ProRes, raw)
//   points — published Mbps at named frame rates per resolution tier, interpolated in between (XAVC-I)
//   fixed  — a constant Mbps per tier, unchanged by frame rate (long-GOP)

export function createMedia(data = {}) {
  const codecs = data.codecs || [];
  const resolutions = data.resolutions || [];
  const byId = (list, id) => list.find(x => x.id === id) || null;

  const codec = (id) => byId(codecs, id);
  const resolution = (id) => byId(resolutions, id);

  // Linear interpolation between the two published frame rates either side of `fps`.
  function fromPoints(points, fps) {
    const keys = Object.keys(points).map(Number).sort((a, b) => a - b);
    if (!keys.length) return 0;
    if (fps <= keys[0]) return points[keys[0]] * (fps / keys[0]);
    if (fps >= keys[keys.length - 1]) {
      const last = keys[keys.length - 1];
      return points[last] * (fps / last);
    }
    const hi = keys.find(k => k >= fps);
    const lo = [...keys].reverse().find(k => k <= fps);
    if (lo === hi) return points[hi];
    const f = (fps - lo) / (hi - lo);
    return points[lo] + (points[hi] - points[lo]) * f;
  }

  // Mbps for one codec at one resolution and frame rate.
  function mbps(codecId, resId, fps) {
    const c = codec(codecId);
    const r = resolution(resId);
    if (!c || !r || !(fps > 0)) return 0;
    if (c.model === 'bpp') return (r.w * r.h * fps * c.bpp) / 1e6;
    if (c.model === 'fixed') return Number(c.fixed?.[r.tier] ?? c.fixed?.uhd ?? 0);
    if (c.model === 'points') {
      const table = c.points?.[r.tier] || c.points?.uhd || c.points?.hd;
      if (!table) return 0;
      const base = fromPoints(table, fps);
      // A published tier covers one frame size; anything larger scales by pixel count.
      const tierRes = resolutions.find(x => x.tier === r.tier && x.id !== r.id) || r;
      const ref = r.tier === 'hd' ? 1920 * 1080 : r.tier === 'uhd' ? 3840 * 2160 : tierRes.w * tierRes.h;
      return base * ((r.w * r.h) / ref);
    }
    return 0;
  }

  const gbPerHour = (mbitPerSecond) => (mbitPerSecond * 3600) / 8000;
  const hoursOn = (gb, mbitPerSecond) => (mbitPerSecond > 0 ? (gb * 8000) / mbitPerSecond / 3600 : 0);
  const cardsFor = (hours, cardGb, mbitPerSecond) => {
    const per = hoursOn(cardGb, mbitPerSecond);
    return per > 0 ? Math.ceil(hours / per) : 0;
  };

  // A camera's recordable formats, each with the frame rates it offers and a rate for each.
  // Two ways a format can be described in data/codecs.json:
  //   { codec, res, card, minutes: { fps: min } } — the maker's own recording-time table (the
  //       rate is worked back from it, so the tool gives exactly the maker's times back), or
  //       { codec, res, mbps: { fps: Mbps } } — the maker's published bitrates;
  //   [codecId, resId] — the older generic codec models above.
  function formatsOf(cam) {
    return (cam?.formats || []).map((f, i) => {
      if (Array.isArray(f)) {
        const [codecId, resId] = f;
        const c = codec(codecId), r = resolution(resId);
        return {
          key: `${codecId}:${resId}`, label: `${c?.label || codecId} · ${r?.label || resId}`,
          fps: [...(data.frameRates || [])], rate: (fps) => mbps(codecId, resId, fps),
          official: c?.src === 'published', src: c?.note || '',
        };
      }
      const table = f.minutes
        ? Object.fromEntries(Object.entries(f.minutes).map(([fps, min]) => [fps, (f.card * 8000) / (min * 60)]))
        : f.frameMB
          // the maker's frame size (ARRI publishes MB per frame): MB × 8 bits × frames per second
          ? Object.fromEntries((f.fps || []).map(fps => [String(fps), f.frameMB * 8 * fps]))
          : f.mbps || {};
      return {
        key: f.id || String(i), label: `${f.codec} · ${f.res}`,
        fps: Object.keys(table).map(Number).sort((a, b) => a - b),
        rate: (fps) => Number(table[String(fps)] ?? 0),
        official: true, fromTimes: !!f.minutes, maxOnly: !!f.max, src: f.src || '',
      };
    });
  }

  return {
    formatsOf,
    codecs, resolutions, codec, resolution,
    frameRates: data.frameRates || [24, 25, 30, 50, 60],
    cards: data.cards || [128, 256, 512, 1000],
    presets: data.presets || [],
    cameras: data.cameras || [],
    mbps, gbPerHour, hoursOn, cardsFor,
  };
}

export async function loadCodecs(url = 'data/codecs.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`codecs ${res.status}`);
  return res.json();
}
