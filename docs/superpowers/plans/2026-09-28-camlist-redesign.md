# CamList v2 Design Round Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the "measuring instrument" look — amber, font C, the 17 chosen icons, a three-way lighting switch, a projects-first home and a two-pane desktop — as a preview build, then live as v2.0.0 after Amir approves.

**Architecture:** Vanilla ES modules, no build step. The default look is the existing `clean` skin id, relabelled "Default" and re-tokenised in `css/style.css`. Camera skins stay in `css/skins.css`. Icons move to inline SVG data in `js/ui/icons.js`. Logic lives in small pure modules with `node --test` coverage. Screens stay string-templated.

**Tech Stack:** HTML/CSS/ES modules, Google Fonts (Karantina, Heebo, Barlow Condensed), `node --test`, GitHub Pages, and the service worker `sw.js`.

**Spec:** `docs/superpowers/specs/2026-09-28-camlist-redesign-design.md`

## Global Constraints

- Tokens, sizes and icon picks come verbatim from the spec (§3.1, §5).
- Karantina is never used below 22px. Text on amber is always `--on-accent`.
- No runtime icon fonts and no icon CDN. The PWA must work offline.
- `DEPT_ICON`, `TOOL_ICON`, `deptIcon()` and `toolIcon()` keep their names and signatures.
- No changes to data files, calculations, compatibility logic or Word/Excel exports.
- Nothing goes live before Amir approves the preview. v1.15.0 stays in `v/`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Saved settings from v1** (`skin: 'pixel'`, `'night'`, `'contrast'`, `theme: 'dark'`). The app must open on a valid look with no blank or unstyled screen. Test in Task 1.
2. **A project with zero items or no cameras** on the home hero. It must show a sensible empty strip, not "undefined" or NaN. Test in Task 4.
3. **Long Hebrew project names** in Karantina on a 375px phone. They must wrap or ellipsize, never overflow. Browser check in Task 4.
4. **Desktop split with a catalog add.** The list pane count updates without a full reload, and search focus is kept. Browser check in Task 6.
5. **Sun mode on a camera skin.** Its light palette plus the sun boost must stay readable, with no white-on-amber. The contrast test in Task 2 covers the default. Browser check covers skins.

---

### Task 1: Theme and skin model

**Files:**
- Modify: `js/skins.js`, `js/app.js`
- Test: `tests/skins.test.js` (new)

**Interfaces:**
- Produces: `THEMES = ['light','sun','dark']`, `nextTheme(t: string) => string`, and `migrateSettings(s: {skin?, theme?}) => {skin, theme}`. Also `SKINS` with exactly `clean, arri, sony, blackmagic, red, panasonic, canon, broadcast`, and `GROUPS` with `plain` (Default) and `camera`.

- [ ] **Step 1: Write the failing tests**
  - `nextTheme('light')==='sun'`, `nextTheme('sun')==='dark'`, `nextTheme('dark')==='light'`, `nextTheme('bogus')==='sun'`.
  - `migrateSettings({skin:'pixel',theme:'light'})` deepEquals `{skin:'clean',theme:'light'}`.
  - `migrateSettings({skin:'night',theme:'light'})` → `{skin:'clean',theme:'dark'}`.
  - `migrateSettings({skin:'contrast'})` → `{skin:'clean',theme:'sun'}`.
  - `migrateSettings({skin:'arri',theme:'dark'})` → unchanged.
  - `migrateSettings({})` → `{skin:'clean',theme:'light'}`.
  - `SKINS.map(s=>s.id)` deepEquals the eight ids above.
  - `skin('clean').he==='ברירת מחדל'` and `skin('clean').en==='Default'`.
- [ ] **Step 2:** Run `node --test tests/skins.test.js`. Expected: FAIL (no export `nextTheme`).
- [ ] **Step 3:** Implement the model in `js/skins.js`.
  - Remove the pixel, blueprint, callsheet, eink, paper, contrast and night entries.
  - Relabel `clean` and give it fonts `Karantina:wght@400;700`, `Heebo:wght@400;500;600;700`, `Barlow+Condensed:wght@500;600;700`.
  - Map removed skins to `clean`. `night` also forces `dark`, and `contrast` also forces `sun`.
- [ ] **Step 4:** Wire it into `js/app.js`.
  - At startup, run `migrateSettings(store.state.settings)` and save the result with `store.setSettings` if it changed.
  - `toggleTheme` uses `nextTheme`.
  - `applyTheme` sets `data-theme` to the raw value, and `theme-color` to `#F4F3EF` / `#FFFFFF` / `#0F1012`.
  - The top-bar theme button shows the current mode's glyph: `icons.sun`, `icons.sunFill` or `icons.moon`, new in `js/ui/dom.js`.
- [ ] **Step 5:** Run `npm test`. Expected: all pass.
- [ ] **Step 6:** Commit `feat(design): three-way lighting, skin bank trimmed to Default + camera skins`.

### Task 2: Tokens, type and sun mode

**Files:**
- Modify: `css/style.css` (lines 1–50 and every `--accent`/`--font` consumer that needs a new role), and `css/skins.css`. In skins.css: delete the removed skin blocks and their `.chartbg` lines, turn the CLEAN block into font and radius only, and keep the camera skins.
- Test: `tests/contrast.test.js` (new)

**Interfaces:**
- Produces:
  - CSS custom properties from spec §3.1 on `:root`, `:root[data-theme="dark"]` and `:root[data-theme="sun"]`. The existing names stay as aliases so no rule breaks: `--muted`=`--text-2`, `--dim`=`--text-3`, `--border`=`--line`, `--accent-2`=`--accent-ink`.
  - `--font-head: "Karantina"`, `--font: "Heebo"`, `--mono: "Barlow Condensed"`.
  - Utility classes `.h-display` (Karantina 700), `.lbl` (Barlow 600, .14em, uppercase) and `.ticks`.

- [ ] **Step 1: Write the failing test.** It reads `css/style.css` and parses the three token blocks with a regex over `--name: #hex`. It computes the WCAG contrast ratio and asserts:
  - `text/bg ≥ 7` in sun;
  - `text/bg`, `text-2/bg`, `text/surface` and `on-accent/accent ≥ 4.5` in light and dark;
  - `accent-ink/bg ≥ 4.5` in all three.
- [ ] **Step 2:** Run `node --test tests/contrast.test.js`. Expected: FAIL (no `sun` block yet).
- [ ] **Step 3:** Rewrite the token blocks.
  - Replace the `@import` with Karantina + Heebo + Barlow Condensed.
  - The sun block also sets `--stroke:1.5px` and the body weight to 500, and bumps `.card`, `.row`, `.btn` and `.iconbtn` borders to 1.5px.
  - `.btn.primary` becomes `background: var(--accent); color: var(--on-accent)`.
  - Remove the `.px` pixel type.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Browser check on the dev server. Home, list and settings must show no red anywhere. Sun is white with black text. The console is clean.
- [ ] **Step 6:** Commit `feat(design): amber instrument tokens, Karantina/Heebo/Barlow, sun mode`.

### Task 3: Icon set

**Files:**
- Create: `scripts/build-icons.js`. It fetches each picked glyph's SVG from jsdelivr:
  - `bootstrap-icons@1.11.3/icons/<name>.svg`
  - `@fortawesome/fontawesome-free@6.5.2/svgs/solid/<name>.svg`
  - `@material-symbols/svg-500/sharp/<name>-fill.svg`
  - `@phosphor-icons/core@2.1.1/assets/fill/<name>-fill.svg`

  It prints `{viewBox, d}` JSON. It is run once, and its output is pasted into icons.js.
- Modify: `js/ui/icons.js` (full rewrite) and `js/ui/icons-dept.js` (re-export unchanged).
- Test: `tests/icons.test.js` (new)

**Interfaces:**
- Produces:
  - `DEPT_ICON` keys `cameras, lenses, video, tripods, grip, power, accessories, other`;
  - `TOOL_ICON` keys `media, fov, shutter, hours, offload, sun, luts, units, pickup, viewfinder`.
  - Each value is `<svg viewBox="…" class="ico" fill="currentColor" aria-hidden="true">…</svg>`.
  - The custom `lenses` (lensZoom), `tripods` (tripod3) and `grip` (dolly) paths are copied from `.superpowers/brainstorm/1642-1790590736/content/icon-picker-v2.html`.

- [ ] **Step 1: Write the failing test.**
  - Every key above exists and matches `/^<svg [^>]*fill="currentColor"/`.
  - No value contains `stroke=` or `http`.
  - `deptIcon('nope')===DEPT_ICON.other` and `toolIcon('nope')===TOOL_ICON.units`.
- [ ] **Step 2:** Run `node --test tests/icons.test.js`. Expected: FAIL (no `viewfinder`; outline `stroke=` present).
- [ ] **Step 3:** Run `node scripts/build-icons.js > $SCRATCH/icons.json`. Write `js/ui/icons.js` from it, keeping each library's own viewBox. Add a header comment with licence credits (Bootstrap MIT, FA CC BY 4.0, Material Apache 2.0, Phosphor MIT). CSS `.ico` sets `width/height:1em`. Optical balance comes from a per-icon `data-pad` scale, checked visually.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Browser check. A temporary `#/icons-check` is not needed. Look at the tool grid and a list with all 7 departments at 375px in all three modes.
- [ ] **Step 6:** Commit `feat(design): solid icon set picked slot by slot`.

### Task 4: Home — my projects first

**Files:**
- Create: `js/home.js` (pure helpers)
- Modify: `js/ui/projects.js` (render only; the form and sheets are unchanged), `css/style.css` (replace `.hero`, `.stats`, `.project-card` rules with `.phero`, `.dstrip`, `.toolrow`, `.plist`), `js/app.js` (toggle `body.home` in `render()`), `css/skins.css` (`.chartbg` visible only under `body.home` and not `[data-theme="sun"]`; plates reduced to aperture ring + one siemens), `index.html` (add an aperture `<span class="iris">` plate)
- Test: `tests/home.test.js` (new)

**Interfaces:**
- Produces:
  - `activeProject(projects) => project|null`: the project with the max `updatedAt`, or null when empty.
  - `deptStrip(items, resolve, order) => [{key, qty, share}]`: always the 7 department keys in `order`; `share = qty / max(qty)`; 0 when empty.
  - `cameraChips(items, resolve) => [{name, qty}]`: items whose product dept slug is `cameras`, sorted by qty descending, max 3.
- Consumes: `groupByDept` from `js/list.js`, `displayName` from `js/export-text.js`.

- [ ] **Step 1: Write the failing tests.**
  - `activeProject([])===null`.
  - `activeProject([{id:'a',updatedAt:1},{id:'b',updatedAt:5}]).id==='b'`.
  - `deptStrip([], …)` has length 7 and every `qty===0 && share===0`.
  - With 2 cameras and 1 lens, the cameras share is 1 and lenses is 0.5.
  - `cameraChips` returns at most 3 entries, largest qty first.
- [ ] **Step 2:** Run `node --test tests/home.test.js`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `js/home.js`. Rewrite `projects.render` per spec §4.1:
  - wordmark in the topbar title;
  - hero with `.ticks`, `ACTIVE` tag, dates in `.lbl`, name `.h-display` with a 2-line clamp, company · 1st AC, camera chips (`dir="ltr"`), `.dstrip` using `deptIcon`, amber "Open list" button + export icon, meta line;
  - `.toolrow` of media/sun/shutter/fov/hours linking to `#/tools/<id>`, with an "All" link to `#/tools`;
  - the other projects as `.plist` rows. The more-menu stays via long-press and the `⋯` button on each row.
  - The empty state is a single card with the new-project button. The `.bottombar` new-project button becomes the dark FAB.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Browser check at 375px and 1280px in he/en and all three modes. Use 0 projects, 1 project with no items, and a long Hebrew name. Nothing overflows, and there are no NaN or "undefined" values.
- [ ] **Step 6:** Commit `feat(design): home opens on the active project`.

### Task 5: List, catalog, tools and settings restyle

**Files:**
- Modify: `css/style.css` (`.phead`, `.group-head`, `.row`, `.stepper`, `.chip`, `.pchip`, `.search`, `.chips`, `.tabs`, `.dept-card`, `.tool-tile`, `.skin-opt`, `.bottombar`), `js/ui/list.js` (header uses `.lbl` + `.h-display` + `.ticks`; no markup change to rows), `js/ui/catalog.js` (🔍 → `icons.search`, 📷 → `deptIcon('cameras')`, dept chips `DEPT_EMOJI` → `deptIcon`; `[data-jump]` uses `h.scrollIntoView({behavior:'smooth', block:'start'})`), `js/ui/tools.js` (tile title class `.h-display`), `js/ui/dom.js` (add `search`, `sun`, `sunFill`, `moon` icons), `js/app.js` (settings: row label "Design"/"עיצוב"; skin bank shows groups `plain`, `camera`), `js/i18n.js` (keys `design`, `active`, `open_list`, `all`, `gear_list`)
- Test: existing suites. Add to `tests/i18n.test.js` that each new key exists in he and en.

- [ ] **Step 1:** Add the i18n test for the new keys. Run it. Expected: FAIL.
- [ ] **Step 2:** Add the keys and the restyle.
  - Status stripe: `.row::before` 3px on the start edge, coloured by the existing compat verdict class (`.v-native`→`--ok`, `.v-adapter`/`.v-partial`→`--warn`, `.v-no`→`--no`). Check the actual verdict class names in `js/ui/catalog.js` / `list.js` before writing selectors.
  - Department heads: Karantina 28px with a Barlow count.
  - Quantities: Barlow 17px.
  - Logos stay only in the brand grid and rail.
- [ ] **Step 3:** Run `npm test`. Expected: all pass.
- [ ] **Step 4:** Browser check. Screens: list (normal, pickup, build-around kit), catalog (dept grid, lens filters, brand rail, strict slot), tools grid and two tool bodies, settings, skins bank with ARRI and SONY applied, in sun and dark.
- [ ] **Step 5:** Commit `feat(design): list, catalog, tools and settings in the new language`.

### Task 6: Desktop two-pane

**Files:**
- Modify: `js/app.js` (`render()`), `css/style.css` (`@media (min-width:1024px)` `.split` grid), `js/ui/list.js` and `js/ui/catalog.js` (only honour `ctx.split` to hide their own bottombar)

**Interfaces:**
- Produces:
  - `ctx.split: boolean`, true while rendering the two-pane view.
  - `isSplitRoute(hash, width) => boolean` exported from the new module `js/layout.js`: true when `width >= 1024` and the hash matches `#/p/:id` or `#/p/:id/add`.

- [ ] **Step 1: Write the failing test** in `tests/layout.test.js`.
  - `isSplitRoute('#/p/x',1280)===true`.
  - `isSplitRoute('#/p/x/add',1280)===true`.
  - `isSplitRoute('#/p/x/export',1280)===false`.
  - `isSplitRoute('#/p/x',800)===false`.
  - `isSplitRoute('#/',1280)===false`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement the split in `render()`. On a split route:
  - `root.innerHTML = '<div class="split"><section data-pane="list"></section><section data-pane="cat"></section></div>'`;
  - run `Catalog.render(ctx,{id},cat)` then `List.render(ctx,{id},list)`, so the list owns the topbar;
  - `store.subscribe` re-renders only the list pane while split. Search input focus stays in the catalog pane.
  - Each pane scrolls on its own (`height: calc(100dvh - topbar)`, `overflow:auto`). Sticky offsets inside panes become `top:0`.
  - Listen to `resize` (debounced 150ms) and re-render when `isSplitRoute` flips.
- [ ] **Step 4:** Run `npm test`. Expected: all pass.
- [ ] **Step 5:** Browser check at 1280px.
  - Add from the catalog, and the list count and group update.
  - Change qty in the list.
  - Search keeps focus while typing.
  - Brand-rail jump scrolls the catalog pane.
  - Resize to 900px, and it drops back to single screens.
- [ ] **Step 6:** Commit `feat(design): catalog beside the list on desktop`.

### Task 7: Print, preview build and handoff

**Files:**
- Modify: `js/export-print.js` / print CSS (headings Karantina, labels Barlow, 🖨️ → icon), `sw.js` (`VERSION = 'v2.0.0-preview'` for the preview only), `README.md` (icon credits)

- [ ] **Step 1:** Update the print styles. Browser-check `#/p/:id/print` in he and en. The slate header is centred, department bands are present, and nothing is white on white.
- [ ] **Step 2:** Run `npm test`. Expected: all pass.
- [ ] **Step 3:** Run the full verification matrix from spec §7. Take screenshots for Amir: home and list in day, sun and night at 375px, plus desktop split.
- [ ] **Step 4:** Commit, then run `node scripts/archive-version.js --as preview-v2 --label "גרסה 2.0 — תצוגה מקדימה"`. Push the branch contents to `main` **only as the archive folder** (the same way `preview-tools` was published). Give Amir `https://viderstudio11.github.io/camlist/v/preview-v2/`.
- [ ] **Step 5:** After Amir approves:
  - set `VERSION='v2.0.0'`;
  - run `node scripts/archive-version.js --label "גרסה 2.0 — מכשיר מדידה"`;
  - merge `v2-design` into `main` and push;
  - confirm the Pages deploy and that the live site shows v2.0.0.
