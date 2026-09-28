// Icon set in the language of a camera's own glyphs: compact pictograms, no perspective tricks,
// no decorative detail, readable at 16px. Two weights — outline for the gear list, where the icon
// sits beside a product name and should stay quiet, and solid for the tools, where the icon is the
// only thing telling one row from another.
//
// The lens is drawn as a lens in three-quarter view — front element, barrel, knurled focus ring,
// rear mount — following the reference Amir sent, rather than as an aperture symbol.

const wrapOutline = (body) => `<svg viewBox="0 0 24 24" class="ico ico-o" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const wrapSolid = (body) => `<svg viewBox="0 0 24 24" class="ico ico-s" fill="currentColor" stroke="none" aria-hidden="true">${body}</svg>`;

const OUTLINE = {
  cameras: `<path d="M2.5 7.5h4l1.2-2h7.6l1.2 2h1.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/><circle cx="11" cy="13.5" r="4"/><circle cx="11" cy="13.5" r="1.4" fill="currentColor" stroke="none"/><path d="M18.6 9.6h1.4"/>`,
  // Three-quarter lens: front element, barrel, knurled ring, mount.
  lenses: `<ellipse cx="6.4" cy="12" rx="3.7" ry="6.4"/><ellipse cx="6.4" cy="12" rx="1.9" ry="3.6"/><path d="M6.4 5.6 16 7.2v9.6L6.4 18.4"/><path d="M11.4 6.5v11M12.9 6.7v10.6M14.4 6.9v10.2"/><path d="M16 8.4l3.4 1v5.2l-3.4 1"/><path d="M19.4 9.4a1 2.6 0 0 1 0 5.2"/>`,
  video: `<rect x="2.5" y="5" width="15" height="11" rx="1.5"/><path d="M7 20h6M10 16v4"/><path d="M20 9.2a4.5 4.5 0 0 1 0 5.6M22.5 6.8a8 8 0 0 1 0 10.4"/>`,
  tripods: `<rect x="8.5" y="3" width="7" height="3.4" rx=".8"/><path d="M12 6.4v3.4M12 9.8 5 21M12 9.8 19 21M12 9.8V21M7.6 16.4h8.8"/>`,
  grip: `<rect x="6.5" y="8.5" width="11" height="4" rx=".8"/><path d="M9 12.5v1.6M15 12.5v1.6"/><circle cx="9" cy="16" r="1.9"/><circle cx="15" cy="16" r="1.9"/><path d="M2 19h20M2 21.6h20"/>`,
  power: `<rect x="2.5" y="7" width="16.5" height="10" rx="1.6"/><path d="M21.5 10.2v3.6"/><rect x="4.6" y="9.2" width="3.4" height="5.6" fill="currentColor" stroke="none"/><rect x="9.1" y="9.2" width="3.4" height="5.6" fill="currentColor" stroke="none"/><rect x="13.6" y="9.2" width="3.4" height="5.6"/>`,
  accessories: `<path d="M8 6.5 17 5v14l-9-1.5z"/><path d="M17 5l4 1.8v10.4L17 19"/><path d="M8 10.5 17 9.4M8 14 17 13"/><path d="M10 6.2 15.6 5.4V2.6L10 3.4z"/><path d="M10 17.8 15.6 18.6v2.8L10 20.6z"/>`,
  other: `<rect x="4" y="10" width="16" height="11" rx="1.5"/><path d="M4 14h16"/><path d="M9 10V7.5h6V10"/><path d="M8 17v4M12 17v4M16 17v4"/>`,
};

const SOLID = {
  media: `<path d="M5 2.4h9.6l4.4 4.4V21a.6.6 0 0 1-.6.6H5a.6.6 0 0 1-.6-.6V3a.6.6 0 0 1 .6-.6z"/><path d="M14.6 2.4 19 6.8h-4.4z" class="knock"/><rect x="7" y="9.4" width="9.6" height="1.8" class="knock"/><rect x="7" y="12.8" width="9.6" height="1.8" class="knock"/><rect x="7" y="16.2" width="6" height="1.8" class="knock"/>`,
  fov: `<ellipse cx="6.4" cy="12" rx="4" ry="6.8"/><ellipse cx="6.4" cy="12" rx="2" ry="3.8" class="knock"/><ellipse cx="5.8" cy="9.6" rx=".7" ry="1.3"/><path d="M6.4 5.2 16.2 6.9v10.2L6.4 18.8z"/><rect x="11" y="6.4" width="1" height="11.2" class="knock"/><rect x="12.7" y="6.7" width="1" height="10.6" class="knock"/><rect x="14.4" y="7" width="1" height="10" class="knock"/><path d="M16.2 8.2 19.6 9.2v5.6l-3.4 1z"/><ellipse cx="19.6" cy="12" rx="1.1" ry="2.8"/>`,
  shutter: `<path d="M12 2.6A9.4 9.4 0 1 0 21.4 12 9.4 9.4 0 0 0 12 2.6zM12 5a7 7 0 0 1 6 3.4l-6 3.5zm-2.4.4v6.9L4 15.6A7 7 0 0 1 9.6 5.4zM19.6 11a7 7 0 0 1-1.2 5.2l-6-3.4zM5.4 17.5l6-3.5v6.9a7 7 0 0 1-6-3.4zm11.2 1.1a7 7 0 0 1-2.2 1.9V14z"/>`,
  hours: `<path d="M12 2.4A9.6 9.6 0 1 0 21.6 12 9.6 9.6 0 0 0 12 2.4zm0 2.2A7.4 7.4 0 1 1 4.6 12 7.4 7.4 0 0 1 12 4.6z"/><rect x="11" y="6.4" width="2" height="6.4" rx="1"/><rect x="11.4" y="11.2" width="5" height="2" rx="1" transform="rotate(32 12 12.2)"/>`,
  offload: `<rect x="10.6" y="2.4" width="2.8" height="8"/><path d="M12 13.6 7.4 9h9.2z"/><rect x="2.6" y="15.4" width="18.8" height="5.8" rx="1.2"/><circle cx="17.8" cy="18.3" r="1.1" class="knock"/>`,
  sun: `<circle cx="12" cy="12" r="4.8"/><rect x="11" y="1.6" width="2" height="3.6" rx="1"/><rect x="11" y="18.8" width="2" height="3.6" rx="1"/><rect x="1.6" y="11" width="3.6" height="2" rx="1"/><rect x="18.8" y="11" width="3.6" height="2" rx="1"/><rect x="4" y="5.4" width="3.6" height="2" rx="1" transform="rotate(45 5.8 6.4)"/><rect x="16.4" y="17.8" width="3.6" height="2" rx="1" transform="rotate(45 18.2 18.8)"/><rect x="16.4" y="4.2" width="3.6" height="2" rx="1" transform="rotate(-45 18.2 5.2)"/><rect x="4" y="16.6" width="3.6" height="2" rx="1" transform="rotate(-45 5.8 17.6)"/>`,
  luts: `<rect x="2.6" y="3.6" width="18.8" height="16.8" rx="1.4"/><rect x="4.4" y="5.4" width="3.4" height="13.2" class="knock"/><rect x="10.4" y="5.4" width="3.4" height="13.2" class="knock"/><rect x="16.4" y="5.4" width="3.4" height="13.2" class="knock"/>`,
  units: `<rect x="1.8" y="7.6" width="20.4" height="8.8" rx="1.2"/><rect x="6" y="7.6" width="1.6" height="4.4" class="knock"/><rect x="10.6" y="7.6" width="1.6" height="6" class="knock"/><rect x="15.2" y="7.6" width="1.6" height="4.4" class="knock"/><rect x="19.4" y="7.6" width="1.6" height="6" class="knock"/>`,
  pickup: `<path d="M2.4 8.4V4.6a2.2 2.2 0 0 1 2.2-2.2h3.8v2.2H4.6v3.8zM21.6 8.4h-2.2V4.6h-3.8V2.4h3.8a2.2 2.2 0 0 1 2.2 2.2zM21.6 15.6v3.8a2.2 2.2 0 0 1-2.2 2.2h-3.8v-2.2h3.8v-3.8zM2.4 15.6h2.2v3.8h3.8v2.2H4.6a2.2 2.2 0 0 1-2.2-2.2z"/><path d="M10.7 15.2 7.4 11.9l1.6-1.6 1.7 1.7 4.3-4.3 1.6 1.6z"/>`,
};

export const DEPT_ICON = Object.fromEntries(Object.entries(OUTLINE).map(([k, v]) => [k, wrapOutline(v)]));
export const deptIcon = (slug) => DEPT_ICON[slug] || DEPT_ICON.other;

export const TOOL_ICON = Object.fromEntries(Object.entries(SOLID).map(([k, v]) => [k, wrapSolid(v)]));
export const toolIcon = (id) => TOOL_ICON[id] || TOOL_ICON.units;
