# CamList — Production Gear List App — Design Spec

Date: 2026-09-17
Status: approved by user (chat), ready for implementation plan

## 1. Purpose

A mobile-first web app (PWA) for a TV/film technical manager to build gear lists for productions, based on the real rental catalog of Utopia (utopiacam.com). Replaces a series of single-file HTML drafts with a maintainable, installable, offline-capable app that runs on iPhone, Android and desktop.

Primary user: one technical manager (Hebrew speaker, works with international crews). Secondary: crews/producers who receive exported lists.

## 2. Scope

### In scope
- Catalog pulled from Utopia's public WooCommerce Store API, limited to 4 top-level departments: **מצלמות (Cameras), עדשות (Lenses), גריפ (Grip), אביזרים (Accessories)** (~1,340 products).
- Manual products (user-added), persisted on device, searchable alongside catalog.
- Multiple saved projects; duplicate a project as a base for a new one.
- One flat list per project, grouped by department in the UI; each line has quantity and free-text note.
- Catalog browsing by department → subcategory, by brand (logo grid), and instant full-text search.
- Brand logos: built-in SVG wordmarks for major brands + monogram fallback + user-supplied override files.
- Bilingual UI (Hebrew RTL default / English LTR) with a toggle.
- Export: share text (WhatsApp/email), Excel (.xlsx), Word (.docx), PDF (print view → system "Save as PDF").
- Backup: export/import all app data as JSON.
- Offline after first load (service worker), installable to home screen.
- Zero cost: static hosting (GitHub Pages), no backend, no accounts.

### Out of scope (explicitly)
- Cloud sync between devices, multi-user editing, share links.
- Pricing, availability, or placing orders on Utopia.
- Departments outside the four listed (lighting, sound, logistics) — the fetch script takes a configurable list so they can be added later.
- Native app store distribution.

## 3. Architecture

Static site, vanilla HTML/CSS/JS ES modules, no build step, no framework.

```
camlist website/
├── index.html            app shell; all screens as <section> panels
├── css/style.css         design system + screens; RTL/LTR via [dir]
├── js/
│   ├── app.js            bootstrap, router (hash-based), screen wiring
│   ├── store.js          state + localStorage persistence (projects, manual items, settings)
│   ├── catalog.js        loads catalog.json, indexes by dept/subcat/brand, search
│   ├── list.js           pure functions: add/remove/set qty/note, group by dept
│   ├── export-text.js    pure: project → share text
│   ├── export-xlsx.js    project → .xlsx (SheetJS)
│   ├── export-docx.js    project → .docx (docx.js)
│   ├── export-print.js   project → print view (PDF via system dialog)
│   ├── brands.js         brand → logo resolution (user file > built-in SVG > monogram)
│   ├── i18n.js           he/en dictionaries + t() helper + dir switching
│   └── ui/*.js           screen renderers (projects, list, catalog, export)
├── data/catalog.json     generated; products + category tree + brand list
├── logos/                user-supplied brand logos (arri.svg, sony.png…) — optional
├── vendor/               xlsx.full.min.js, docx.min.js (vendored for offline)
├── icons/                PWA icons (192, 512, apple-touch)
├── manifest.json
├── sw.js                 cache-first for app shell + catalog; network-first for images
├── scripts/fetch-catalog.js   Node: Utopia API → data/catalog.json
├── tests/                Node test runner (node:test) for pure modules
└── docs/superpowers/specs/    this spec + implementation plan
```

Module boundaries: `list.js`, `export-text.js`, `catalog.js` (search/indexing) and `store.js` (serialization) are pure and tested in Node without a DOM. UI modules only render and dispatch to those.

## 4. Data model

### catalog.json (generated)
```json
{
  "generatedAt": "2026-09-17T12:00:00Z",
  "source": "https://utopiacam.com",
  "departments": [
    { "id": 7, "slug": "cameras", "he": "מצלמות", "en": "Cameras", "order": 1,
      "subcategories": [ { "id": 12, "he": "Digital Cinema", "en": "Digital Cinema", "count": 55 } ] }
  ],
  "brands": [ { "id": "arri", "name": "ARRI", "count": 41 } ],
  "products": [
    { "id": 12345, "name": "ALEXA 35", "brand": "arri",
      "dept": 7, "subcats": [12, 30], "image": "https://…/alexa35-300x300.jpg",
      "url": "https://utopiacam.com/shop/arri-alexa-35/", "sku": "" }
  ]
}
```
- `brand` is normalized to a lowercase slug from the Utopia attribute "מותג" (case-insensitive merge: "SONY"/"Sony" → `sony`). Products with no brand get `brand: null`.
- `dept` = the top-level department id; `subcats` = all category ids under that department the product belongs to. A product that appears in several of the four departments is assigned to the first by `order` (cameras > lenses > grip > accessories) and not duplicated.
- Department/subcategory `en` names: Utopia's names are already mostly English; Hebrew-only names get a hand-written English mapping in the fetch script (small table).
- Image: the `thumbnail` size (300px) from Utopia; served from utopiacam.com at runtime, cached by SW when seen.

### App state (localStorage key `camlist.v1`)
```json
{
  "settings": { "lang": "he", "techManager": "Amir" },
  "manualProducts": [
    { "id": "m_1726570000000", "name": "Shogun 7", "brand": "atomos", "dept": 9, "note": "", "createdAt": "…" }
  ],
  "projects": [
    { "id": "p_1726570000000", "name": "המירוץ למיליון 12", "techManager": "Amir",
      "dateFrom": "2026-10-12", "dateTo": "2026-10-28", "notes": "",
      "createdAt": "…", "updatedAt": "…",
      "items": [ { "productId": 12345, "qty": 2, "note": "Cam A+B" },
                 { "productId": "m_1726570000000", "qty": 1, "note": "" } ] }
  ]
}
```
- `items` order = insertion order; UI groups by department, then keeps insertion order within group.
- Removing an item = removing its entry (qty is always ≥ 1 when present).
- Manual product ids are prefixed `m_` so they never collide with numeric Utopia ids. Deleting a manual product that is referenced by a project is refused with a message listing the projects.
- Backup file = the whole `camlist.v1` object plus `{ "app": "camlist", "version": 1 }`. Import merges projects by id (imported wins), merges manual products by id, and keeps current settings unless the backup is newer (`updatedAt`).

## 5. Screens and flow

Hash router: `#/projects` (home), `#/p/:id` (list), `#/p/:id/add` (catalog), `#/p/:id/export`, `#/settings`. Back button works natively.

### 5.1 Projects (home)
- Header: app name, language toggle, settings gear.
- Cards: project name, tech manager, date range, item count, updated date. Tap → list. Long-press/⋯ → duplicate, rename, delete (confirm).
- Empty state with a single "New project" CTA.
- Footer actions: New project, Import backup, Export backup.

### 5.2 Project list
- Sticky header: project name (tap to edit name/manager/dates/notes in a sheet), total items badge.
- Body: department sections (מצלמות, עדשות, גריפ, אביזרים, then "ידני/Other" for manual items whose dept is not one of the four) as collapsible groups with count. Row: thumbnail (48px), brand logo (small), product name, qty stepper (− qty +), note field (inline, single line, placeholder "הערה"). Swipe-left / trash icon removes.
- Empty state: "הרשימה ריקה — הוסף ציוד".
- Sticky bottom bar: **הוסף ציוד** (primary), **ייצוא/שיתוף**.

### 5.3 Catalog (add gear)
- Top: search input (autofocus on desktop, not on mobile), clears with ×. While query length ≥ 2: results list replaces browsing. Search matches product name, brand name, subcategory names; case-insensitive, all tokens must match (AND), diacritics/dash-insensitive ("24 70" matches "24-70mm"). Results ranked: name-prefix match > brand match > other; max 100 shown.
- Browse mode tabs: **מחלקות** | **יצרנים**.
  - Departments: 4 big cards → subcategory list (with counts) → product list.
  - Brands: grid of logo tiles (built-in wordmark or monogram) sorted by product count → product list (optionally filtered further by department chips).
- Product row: thumbnail, brand logo, name, subcategory chip, **+** button. If already in the project, the + becomes a stepper showing the current qty. Tap on thumbnail opens Utopia product page in a new tab (optional, not a primary path).
- Bottom of every list and of empty search results: "לא מצאת? הוסף פריט ידני" → sheet with name (required), brand (free text with autocomplete from known brands), department (select of the 4 + Other). Saves to `manualProducts` and adds to the project with qty 1.
- Bottom bar: "חזרה לרשימה (N פריטים)".

### 5.4 Export
- Preview of the share text at top (read-only, scrollable).
- Buttons: **שתף / העתק** (Web Share API if available, else clipboard + toast), **Excel**, **Word**, **PDF**.
- Options: include notes (default on), include Utopia links (default off for text, on for Excel/Word), language of headings follows current UI language.

### 5.5 Settings
- Language, default tech manager name, "Refresh catalog" is NOT here (catalog updates ship with the site), backup import/export, about (catalog date, product count, version), link to `logos/` instructions.

## 6. Export formats

### Text (share)
```
🎬 {project name}
{Tech manager}: {name} | {dateFrom}–{dateTo}
{notes if any}

📷 {Dept name}
 {qty}× {Brand} {Product name}  ({note})
🔭 …
—
{total} items · CamList · {date}
```
Department emoji: cameras 📷, lenses 🔭, grip 🎬, accessories 🔧, other 📦. Brand shown as the display name if the product name doesn't already start with it.

### Excel
One sheet "Gear List". Rows 1–3: project header (name, manager, dates). Row 5 header: Department | Brand | Item | Qty | Note | Utopia link. Grouped rows with a bold department row before each group. Column widths set; freeze header; `!views: [{RTL:true}]` when UI is Hebrew. File name `{project}-gearlist.xlsx`.

### Word
Title = project name; subtitle line with manager/dates; per-department heading + table (Brand | Item | Qty | Note); footer with total and date. `rightToLeft`/`bidirectional` on paragraphs and table when Hebrew. File name `{project}-gearlist.docx`.

### PDF
`#/p/:id/print` route renders a print-styled page (A4, header with project details, per-department tables with 32px thumbnails, page-break-avoid inside rows, print CSS hides app chrome) and calls `window.print()` after images load (or after 1.5s timeout). The user picks "Save as PDF" in the system dialog. A one-line hint explains this the first time.

## 7. Brand logos

`brands.js` resolves a brand slug to an element:
1. If `logos/{slug}.svg|png|webp` exists (checked once per session via `fetch HEAD`, results cached in memory and localStorage for 24h) → `<img>`.
2. Else if a built-in SVG wordmark exists for the slug → inline SVG. Built-in set (~25): arri, sony, canon, red, blackmagic, panasonic, dji, gopro, insta360, zeiss, cooke, angenieux, fujinon, sigma, leica, laowa, teradek, smallhd, atomos, tilta, smallrig, sachtler, oconnor, wooden-camera, bright-tangerine, easyrig, freefly, tiffen, hollyland. Wordmarks are typographic (font weight/letter-spacing/brand color) and are drawn with generic fonts — not copies of trademarked artwork.
3. Else → monogram badge: first 2–3 letters, deterministic background hue from slug hash.

Logos render at 3 sizes: tile (brand grid), row (list rows), inline (export print view).

## 8. Design language

- Dark cinematic theme by default (`prefers-color-scheme` respected, manual toggle later if wanted): background #0d0e10 → surfaces #17181b/#1f2024, text #f2f2f2/#a6a8ad, accent red #e0262b (Utopia-like), success green for "in list" states.
- Typography: system stack for UI (`-apple-system, Segoe UI, Roboto`), Hebrew falls back cleanly; headings heavy (800), uppercase tracking on department labels in English mode only.
- Touch targets ≥ 44px; steppers are 44×44. Safe-area insets for iPhone (notch/home bar). No horizontal scroll at 360px.
- Motion: 150–200ms ease-out for sheets/toasts; list rows animate in on add; respects `prefers-reduced-motion`.
- RTL: `document.documentElement.dir` switches; layout uses logical properties (`margin-inline-start`, etc.), icons that imply direction are mirrored.

## 9. Offline / PWA

- `manifest.json`: name "CamList", short_name "CamList", display standalone, theme/background colors, icons 192/512 (+ maskable), `start_url: ./index.html`.
- `sw.js`: precache app shell (html, css, js, vendor, data/catalog.json, icons) with a versioned cache name derived from a `VERSION` constant that the fetch script and a release checklist bump; product images cached on first view (stale-while-revalidate, capped at ~500 entries LRU). Update flow: new SW → toast "גרסה חדשה — רענן".
- iOS: `apple-mobile-web-app-capable`, `apple-touch-icon`, viewport-fit=cover.

## 10. Catalog fetch script

`node scripts/fetch-catalog.js`:
1. GET `/wp-json/wc/store/v1/products/categories?per_page=100&page=N` until exhausted; build tree.
2. Identify the 4 department roots by slug (`מצלמות`, `עדשות`, `גריפ`, `אביזרים` — URL-encoded) and collect all descendant category ids.
3. GET `/wp-json/wc/store/v1/products?per_page=100&page=N` (all ~20 pages, with 300ms delay and retry ×3 on 5xx/429); keep products having ≥1 category in the collected set.
4. Normalize per §4 (brand slug, dept assignment, subcats, thumbnail, decode HTML entities in names).
5. Write `data/catalog.json` (pretty, sorted by dept/brand/name) and print a summary (counts per dept, per brand, products without brand/image).
6. Exit non-zero if any department has 0 products (guards against silent API changes).

Names with HTML entities (`&#8243;`, `&amp;`) are decoded. Hebrew names kept as-is (no translation).

## 11. Error handling

- Catalog fails to load (first visit offline): full-screen message with retry; the projects and list screens stay usable. To make that possible, each list item stores a `snapshot: { name, brand, dept }` at add-time, so lists remain readable and exportable if the catalog is missing or a product was removed from Utopia. Live catalog data wins when present.
- localStorage full/unavailable (private mode): toast warning; app runs in memory.
- Import: invalid JSON or wrong `app` field → error toast, nothing changed.
- Export libs fail to load: button shows error toast; text share always works.
- Image 404: fallback placeholder (department glyph).

## 12. Testing

- `node --test tests/` covering: `list.js` (add/increment/remove/group), `catalog.js` search (tokenization, AND-matching, dash/space normalization, ranking, manual items included), `export-text.js` (exact output snapshot for a fixture project, he + en), `store.js` (serialize/import merge rules, refusal to delete referenced manual product), `brands.js` slugging/monogram.
- `scripts/fetch-catalog.js` has a `--dry-run --limit 2` mode used to test normalization on 2 pages without writing.
- Manual verification in the built-in browser at 390×844 (iPhone) and 360×800 (Android), both languages: add items, edit qty/note, export each format, install prompt, offline reload.

## 13. Deployment

GitHub Pages from the repo root (`main` branch). `README.md` documents: how to run locally (`npx serve .`), refresh catalog, add logos, bump `VERSION`, and how to install on iPhone (Share → Add to Home Screen) and Android (Install app).
