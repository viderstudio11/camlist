# CamList v2 — Design Round ("Measuring Instrument")

**Date:** 2026-09-28 · **Status:** approved in conversation, awaiting spec review
**Scope:** visual layer only. No new features, no data or calculation changes.

## 1. Why

The app works, but the look never landed. The home screen still carries the day-one theme
(Rubik, red, big wordmark). Categories look faded in daylight. Icons were redrawn five times
without landing. Fifteen skins spread the design effort thin. Amir chose each decision below
in a live preview (`.superpowers/brainstorm/`, gitignored). This round turns those choices into
the real app.

## 2. Decisions (Amir's, verbatim choices)

| Topic | Decision |
|---|---|
| Role of skins | One strong default, plus the camera skins as extras |
| Character | "Measuring instrument": monochrome + one signal colour, lens-scale ticks, tabular numerals |
| Accent | Amber |
| Fonts | Option C: Karantina headings, Heebo body, Barlow Condensed labels/numbers |
| Home | "My projects" first |
| Desktop | Catalog beside the list |
| Skin bank | Camera skins only (7) |
| Chart/aperture background | Subtle, home screen only |
| Icons | Solid glyphs, picked one per slot (§5) |

## 3. Visual system

### 3.1 Colour tokens (replace the current `:root` / `[data-theme]` blocks in `css/style.css`)

| Token | Day | Sun | Night |
|---|---|---|---|
| `--bg` | `#F4F3EF` | `#FFFFFF` | `#0F1012` |
| `--surface` | `#FFFFFF` | `#FFFFFF` | `#17181B` |
| `--surface-2` | `#ECEAE4` | `#F2F2F2` | `#1F2024` |
| `--line` | `#DAD7CF` | `#1A1A1A` | `#2A2C31` |
| `--text` | `#16171A` | `#000000` | `#EDEDEE` |
| `--text-2` | `#5B5D63` | `#1E1E1E` | `#A6A8AE` |
| `--text-3` | `#8A8C92` | `#3A3A3A` | `#6E7077` |
| `--accent` (fills) | `#E88A00` | `#F08A00` | `#FFB020` |
| `--accent-ink` (amber text) | `#9A4E00` | `#7A3B00` | `#FFC45C` |
| `--on-accent` | `#16171A` | `#000000` | `#111111` |

- Status colours are reserved for compatibility and never used for decoration: `--ok #1F9D55`,
  `--warn #D9A300`, `--no #D6332A`, `--unk #A3A5AB`.
- Amber appears only on the primary action, the active selection, scale ticks and tool icons.
- Text on amber is always dark (`--on-accent`). White on amber fails in sunlight.
- **Sun mode:** 1.5px lines, body weight 500, strong weight 700, no background motif,
  no translucency. Nothing faded.
- **Contrast floor:** body text ≥ 7:1 in sun, ≥ 4.5:1 in day and night. Checked with a script
  over every token pair used for text.

### 3.2 Lighting switch

`settings.theme` becomes `light | sun | dark`. The top-bar button cycles through the three
(day → sun → night). It shows the current mode's glyph: sun outline, filled sun, moon. `<html data-theme>` carries the value, and `theme-color` follows it.
Existing saved values `light` and `dark` keep working.

### 3.3 Typography

- **Karantina 700** is for display only: wordmark, project name, department headings, tool
  titles. Minimum 22px. Hebrew breaks below that.
- **Heebo 400/500/600/700** is for everything a person reads: product names, notes, forms and
  buttons.
- **Barlow Condensed 500/600** is for small caps labels (letter-spacing .14em), quantities,
  dates, counts, mounts and formats. Numerals are tabular.
- Rubik, IBM Plex Mono and Press Start 2P are removed from the default `@import`.

### 3.4 Motifs

- **Scale ticks.** A 10px strip of minor ticks every 8px and major ticks every 40px. It sits at
  the top of the hero card and under the list title, as one reusable `.ticks` class.
- **Background (home only).** The existing `.chartbg` plates, reduced to a faint aperture ring
  plus one Siemens star at about 7% opacity. Hidden in sun mode and on every screen except home.
- Radii: 18px on the hero card, 14–16px on cards, 10–12px on controls. Shadows only on floating
  elements (FAB, top bar).

## 4. Screens

### 4.1 Home (`js/ui/projects.js`)

1. **Top bar.** Small `CAM` + amber `LIST` wordmark, language pill and settings.
2. **Active project hero** (the most recently opened project):
   - ticks strip, `ACTIVE` tag and dates in Barlow;
   - project name in Karantina, then company and 1st AC;
   - camera chips (`ALEXA 35 ×2`, LTR);
   - a seven-department strip, each with icon, amber fill bar and count;
   - primary `Open list` button plus an export shortcut, and an item count with last update.
3. **Tools row.** Five solid amber tiles (media, sun, shutter, fov, hours) and an "All" link.
4. **Other projects.** One card with rows showing name, company · location · main camera, and
   item count.
5. **Floating "New project" button.** Dark fill with an amber plus.

- With no projects, a single empty-state card appears with the new-project button.
- The stats row stays gone, as before.

### 4.2 List (`js/ui/list.js`)

- Title block: a `GEAR LIST` label, the project name in Karantina, then ticks.
- Department headers: grey solid icon, Karantina name, Barlow count.
- Item rows:
  - a 3px status stripe on the start edge (the existing False Color verdicts);
  - name in Heebo 600;
  - brand plus mount/format/PRIME/ZOOM chips in Barlow;
  - a quantity stepper with the number in Barlow.
- No logos in list rows, per the earlier compromise.
- Pickup mode, base kit and build-around keep their behaviour and are restyled with the new
  tokens.

### 4.3 Catalog (`js/ui/catalog.js`)

- Search field, lens quick filters as pills (the active pill is solid `--text`), the brand logo
  rail (the active brand gets an amber ring), and brand groups with a "newest first" label.
- Rows match the list rows. The add button is amber; "already in list" shows a check and the
  count.
- The 🔍 and 📷 emoji are replaced by icons from the set.

### 4.4 Desktop (≥ 1024px)

- On `#/p/:id` and `#/p/:id/add`, the layout is two panes: list on the start side, catalog on
  the end side on `--surface-2`.
- Adding from the catalog updates the list pane live.
- The top bar shows a breadcrumb plus Pickup and Export buttons.
- Below 1024px, navigation stays screen-by-screen as today.

### 4.5 Tools (`js/ui/tools.js`)

- The grid tiles take the new solid icons in amber and a Karantina title with a Heebo subtitle.
- Tool bodies are restyled with tokens only. Layout and camera→format filtering are unchanged.

### 4.6 Settings and skins

- Settings keeps a single "Design" row that opens `#/skins`.
- The skin bank lists **Default** plus the 7 camera skins: ARRI, SONY, Blackmagic, RED,
  Panasonic, Canon, Broadcast.
- Removed skins: clean, paper, contrast, night, pixel, blueprint, callsheet, eink. Their CSS
  and font loaders go too.
- A saved removed skin falls back to Default, and `night` also sets the theme to `dark`.
- Camera skins inherit the new icons and the three-way lighting switch.

### 4.7 Exports

- The slate header, the centred production name and the department bands stay.
- Print/PDF headings switch to Karantina and labels to Barlow, to match the app.
- The Word and Excel exports are unchanged. Word keeps its embedded Hebrew-safe font.

## 5. Icons

Everything is solid, so list and tools are told apart by colour and size: grey 18–20px in lists,
amber 24–28px on tool tiles. This replaces the earlier "outline for list" idea, because most
picks exist only in solid.

| Slot (code key) | Pick | Source |
|---|---|---|
| cameras | `camera-reels-fill` | Bootstrap Icons |
| lenses | side-view zoom lens (`lensZoom`) | custom |
| video | `connected_tv` | Material Symbols Sharp (filled) |
| tripods | `tripod3` | custom |
| grip | dolly on track (`dolly`) | custom |
| power | `battery-charging` | Bootstrap Icons |
| accessories | `screwdriver-wrench` | Font Awesome 6 Solid |
| media | `sd-card` | Font Awesome 6 Solid |
| sun | `wb_twilight` | Material Symbols Sharp |
| shutter | `film` | Bootstrap Icons |
| fov | `person-bounding-box` | Bootstrap Icons |
| offload | `copy` | Bootstrap Icons |
| units | `square_foot` | Material Symbols Sharp |
| luts | `palette-fill` | Bootstrap Icons |
| hours | `clipboard-text` (fill) | Phosphor |
| viewfinder button (inside fov) | `eye-fill` | Bootstrap Icons |
| pickup / checklist | `clipboard2-check-fill` | Bootstrap Icons |

- **Delivery.** Each glyph's SVG path is copied into `js/ui/icons.js`, normalised to a 24×24
  viewBox with `fill="currentColor"`. No icon fonts or CDN at runtime, so the PWA stays offline.
- Licences (MIT for Bootstrap and Phosphor, Apache 2.0 for Material, CC BY 4.0 for Font Awesome
  icons) are credited in a header comment and in the README.
- `DEPT_ICON` / `TOOL_ICON` / `deptIcon()` / `toolIcon()` keep their names and signatures, so
  callers don't change.
- **Optical balance.** Glyphs from four libraries differ in weight and inset. Each path is scaled
  to a shared 20px live area inside the 24px box. Verification is a side-by-side sheet at 16, 20,
  24 and 32px in all three lighting modes.
- **Open item.** Amir is lukewarm on the lens and grip glyphs. They ship as chosen and are
  revisited once he sees them in the real app.

## 6. Out of scope

New tools, data changes, catalog refresh, compatibility logic, sharing and sync, and the
Word/Excel layout.

## 7. Delivery and verification

1. Build on a branch. `npm test` must stay green (no logic changes are expected).
2. Browser checks on the dev server (`preview_start`):
   - home, list, catalog, desktop two-pane, tools, skins and print view;
   - each in day, sun and night, in Hebrew and English, at 375px and 1280px;
   - console clean;
   - contrast script passes.
3. Publish as a preview archive build
   (`node scripts/archive-version.js --as preview-v2 --label "…"`) without going live, and send
   Amir the link.
4. Only after his approval: bump `VERSION` in `sw.js` to `v2.0.0`, archive, merge and deploy.
   v1.15.0 stays in the version archive.
