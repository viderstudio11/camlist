// Outline department icons (technical-drawing style): thin strokes, no fills, drawn on a 24×24 grid.
const wrap = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const DEPT_ICON = {
  // Cinema camera: body, mount ring, top handle, viewfinder, media door
  cameras: wrap(`<rect x="2.5" y="7.5" width="13" height="10" rx="1.4"/><circle cx="9" cy="12.5" r="3.1"/><circle cx="9" cy="12.5" r="1.1"/>
    <path d="M5 7.5V6.2h6v1.3"/><path d="M15.5 10.2 21.5 7.4v10.2l-6-2.8"/><path d="M4.2 14.9h2.2"/>`),
  // Lens: barrel, focus rings, front element
  lenses: wrap(`<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7.5 6v12M10 6v12M16 6v12"/><circle cx="18" cy="12" r="2.6"/><path d="M3 9.5h1.5M3 14.5h1.5"/>`),
  // Video: monitor with stand + signal waves
  video: wrap(`<rect x="2.5" y="5.5" width="14" height="10" rx="1.4"/><path d="M7 18.5h5.5M9.7 15.5v3"/>
    <path d="M18.6 8.6a5 5 0 0 1 0 6.8M21 6.5a8.2 8.2 0 0 1 0 11"/>`),
  // Tripod: fluid head + three legs + spreader
  tripods: wrap(`<rect x="8.4" y="3" width="7.2" height="3.4" rx="1"/><path d="M12 6.4v3.2"/><path d="M12 9.6 4.5 21M12 9.6 19.5 21M12 9.6V21"/><path d="M7.3 16.2h9.4"/>`),
  // Grip: C-stand style — riser, knuckle, arm
  grip: wrap(`<path d="M6 21h8"/><path d="M10 21V5"/><path d="M10 8.5 4 13M10 8.5l6-2.2"/><circle cx="10" cy="8.5" r="1.5"/><path d="M16 6.3h4.5M18.2 4.2v4.2"/>`),
  // Power: V-mount style battery with charge level
  power: wrap(`<rect x="4.5" y="4" width="13" height="16" rx="1.8"/><path d="M8 4V2.6h6V4"/><path d="M7.6 11.5h6.8M7.6 15h6.8"/><path d="M17.5 8.5h2.6v7h-2.6"/>`),
  // Accessories: matte box + rods
  accessories: wrap(`<rect x="5.5" y="6.5" width="10" height="11" rx="1.1"/><path d="M8.2 6.5 6 3.6M12.8 6.5 15 3.6"/><path d="M15.5 9.8h5M15.5 14.2h5"/><path d="M8.5 10.5h4.5v3H8.5z"/>`),
  other: wrap(`<rect x="3.5" y="7" width="17" height="11" rx="1.6"/><path d="M3.5 11h17M9 7V4.5h6V7"/>`),
};

export const deptIcon = (slug) => DEPT_ICON[slug] || DEPT_ICON.other;
