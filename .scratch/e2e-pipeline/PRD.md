# PRD: E2E pipeline (WebdriverIO + real Obsidian Bases)

Status: Draft (grilling session 2026-07-03)

## Goal

Add an end-to-end test pipeline that drives a **real, sandboxed Obsidian** via
`wdio-obsidian-service` and exercises this plugin's two registered **Bases
Kanban views** through the actual Bases surface — something the existing
Storybook + vitest-browser suite cannot do (it mounts Preact components in
isolation, never inside real Obsidian Bases).

## Decisions (from grilling)

| # | Decision | Choice |
|---|----------|--------|
| D1 | E2E scope | **Full interaction re-test** — render + grouping + drag-drop + assert the on-disk mutation, not just smoke. |
| D2 | Obsidian version | **Pin app + installer**, env-overridable. `appVersion` pinned to a known-good Bases build (1.10.x); `installerVersion: 'earliest'` (= manifest `minAppVersion` 1.10.2). |
| D3 | CI shape | **New `test.yml`** with two jobs: `unit` (vitest, installs Playwright chromium for the Storybook project) + `e2e` (wdio under xvfb+herbstluftwm, `.obsidian-cache`). Closes the current CI test gap — no test job exists today. |
| D4 | View coverage | **Both views, folder-first.** Folder view (file-move on disk) before Property view (frontmatter rewrite). |
| D5 | Local dev binary | **Download path is the supported default.** `OBSIDIAN_BINARY_PATH` unset → service fetches a matched installer+driver+app. Local binary is an optional env override (machine-fragile per random-task LEARNINGS). |
| D6 | wdio framework | **mocha** (service default; matches reference project). |
| D7 | Harness shape | **Diagnosis harness + specs.** A reusable `test/helpers/kanban.ts` (openBase, columns/cards, synthesized dragCard, readNote off disk) shared by `.e2e` specs AND ad-hoc agent diagnosis. Plus a doc on how an agent drives real Obsidian. |
| D8 | Dev loop | **Add a fast local mode** (`e2e:dev`): **headed** + **warm cache** (default) so an agent boots once and watches, alongside the headless CI path (`test:e2e`). Prefer a warm download cache over the local app binary for reproducibility; local binary is best-effort. |

## Why this layer exists (not covered by Storybook)

The vitest/Storybook suite aliases `obsidian` → `src/__mocks__/obsidian.ts` and
mounts Preact components in isolation with fixture props. It therefore tests
**neither** the real Obsidian APIs (`BasesView`, `QueryController`, `vault`,
`fileManager.processFrontMatter`) **nor** the Bases mount path (`registerBasesView`
→ `.base` parse → factory). wdio uniquely gives real-Obsidian verification, and
the same harness lets an **agent boot the real app, open a `.base`, execute a live
drop via `browser.executeObsidian(app => …)`, and read the note back off disk** —
a diagnosis capability Storybook cannot provide.

## Key findings that shape the plan

- **No prior art, but a real fixture exists.** Sibling `obsidian-lovely-bases`
  also has no wdio (same Storybook/Playwright stack). Driving a *registered Bases
  view* (open a `.base` file → render DOM) through wdio is unproven here — the
  make-or-break unknown, so slice 01 is a de-risking spike gate. **However**, the
  untracked `kanban-example/` vault already contains working `.base` files that
  answer the schema question:
  - `Kanban Folders/Kanban Folders.base` → `views: - type: kanban-base` (folder;
    keys `columnRoot`, `order`, `boardState`).
  - `Kanban/Retro Games.base` → `type: kanban-property` (property; keys `groupBy.
    property`, `filters`, `cardFolder`, `userDefinedColumns`, `boardState`).
  Use a trimmed copy of `kanban-example/` as the E2E vault instead of inventing
  fixtures. (Confirm the `type:` strings equal `KANBAN_ID`/`KANBAN_PROPERTY_ID`.)
- **Drop-side disk mutation is real (D1 premise confirmed).** Folder-view DROP →
  `app.vault.rename(file, targetFolder/...)` (`KanbanFolderView.ts:310`);
  property-view DROP → `app.fileManager.processFrontMatter(...)`
  (`KanbanPropertyView.ts:327`). So there IS an on-disk effect to assert for both.
- **The reference project drove `editorCallback` commands** via
  `executeObsidianCommand` + `editor.setCursor`. **None of that transfers** — we
  open a `.base` file and assert on rendered cards/columns, a different harness.
- **HTML5 native drag-and-drop.** Cards/columns use `draggable` + `onDragStart` +
  `dataTransfer` (`src/views/KanbanBase/KanbanCard.tsx`, `KanbanColumn.tsx`).
  WebDriver's native `dragAndDrop`/`moveTo` does **not** reliably fire HTML5
  `dragstart`/`drop` in Chromium. Drag steps must **synthesize `DragEvent`s with a
  shared `DataTransfer` via injected JS** (`browser.executeObsidian(...)`), not a
  real mouse drag. This is the single biggest feasibility risk for D1.
- **Infra that transfers from `obsidian-random-task`:** `installerVersion:
  'earliest'` = minAppVersion; `.obsidian-cache` + `actions/cache` keyed on
  `manifest.json`/`wdio.conf.mts`/`package-lock.json`; xvfb + herbstluftwm on the
  headless runner; `tsconfig.e2e.json` (extends base, adds wdio types) + eslint
  `globalIgnores` for files outside `src/**` (projectService errors otherwise);
  E2E specs live in `test/specs/*.e2e.ts`, out of the build `include`.
- **`data.json`/vault sandbox survives between wdio runs** — specs must force
  known state in a `before` hook, not just restore in `after`.

## Slices (each a self-contained, operational commit)

- **01 — Harness spike (GO/NO-GO gate).** Add `wdio-obsidian-service`,
  `wdio.conf.mts`, `tsconfig.e2e.json`, eslint ignores, and a trimmed copy of
  `kanban-example/` as the test vault (folder `.base` + a few notes). Add the
  `e2e:dev` (headed, warm cache) + `test:e2e` (headless) scripts. Seed
  `test/helpers/kanban.ts` with `openBase()` + `columns()`. Prove: plugin loads,
  the `.base` view opens, **columns + cards render** (assert DOM via helpers).
  Confirms the `type:` id mapping and that wdio sees the rendered Bases view. If
  this can't be made green, stop and reconsider before D1's drag path.
- **02 — Folder view render + grouping.** Assert columns == folders, each card in
  its folder's column, from a fixtured vault.
- **03 — Folder view drag (synthesized DnD).** Prove one JS-synthesized card drag
  between columns moves the note file on disk (`obsidianPage.read`/vault check).
  Second GO/NO-GO: confirms the synthetic-DragEvent approach works at all.
- **04 — Column reorder.** Drag a column; assert order persists.
- **05 — Property view render + grouping.** Columns == property values; cards
  grouped by frontmatter property.
- **06 — Property view drag.** Synthesized drag rewrites the note's frontmatter
  property on disk.
- **07 — CI: `test.yml`.** `unit` job (Playwright chromium + `npm test`) and
  `e2e` job (cache + xvfb + herbstluftwm + `npm run test:e2e`). Prove green on a
  push; confirm cache save, then restore on a follow-up run.
- **08 — Docs.** README E2E section (download-default recipe, `e2e:dev` headed
  mode, optional local binary), a **"diagnosing in real Obsidian" agent doc**
  (how to boot, `openBase`, `executeObsidian`, read a note off disk), and the
  proven synthetic-DragEvent recipe as a LEARNINGS/README note. Update
  `docs/Kanban Base View.md` Tasks.

By this point `test/helpers/kanban.ts` has grown (across slices 01/03/05/06) into
the full shared surface: `openBase`, `columns`, `cards`, `dragCard`,
`dragColumn`, `readNote`, `frontmatterOf`.

## Testing decisions / gotchas to carry

- Rebuild (`npm run build`) between any source change and a wdio run — wdio loads
  bundled `main.js`, not TS source. Stale bundle = vacuous pass.
- Force default plugin/vault state in a `before` hook; sandbox persists between runs.
- Gate `browser.waitUntil` on the view's distinctive rendered effect (a card in
  its new column / the frontmatter string), never on the pre-drag state.
- `installerVersion` (not `binaryPath`) selects ChromeDriver; keep it = minAppVersion.

## Scope boundary (state plainly — "full" isn't oversold)

Synthesized-DnD "full re-test" validates **handlers fire → disk mutates**, not
the real drag *gesture*. The genuinely new confidence wdio adds over Storybook is
the **real-Obsidian Bases mount + real on-disk mutation** (`vault.rename` /
`processFrontMatter`) — not the drag input itself, which stays synthetic.

## Open questions (resolve during slices)

- Confirm the `.base` `type:` strings (`kanban-base`, `kanban-property`) equal the
  registered `KANBAN_ID` / `KANBAN_PROPERTY_ID` constants. → slice 01.
- Whether wdio + the existing Playwright-chromium (Storybook) install coexist
  cleanly, or need separate CI browser provisioning. → slice 01/07.
- Exact synthetic-DragEvent recipe that Preact's `onDragStart` + the drag
  machines accept (dataTransfer payload = file path per `KanbanCard.tsx:85`). →
  slice 03.

## Proposed ADR (pending confirmation)

- **ADR-0001** — E2E via wdio-obsidian-service against real Obsidian Bases
  (rather than extending the Playwright/Storybook stack).

Synthesizing HTML5 DragEvents via injected JS is **not** an ADR — WebDriver-native
HTML5 DnD essentially doesn't work, so there's no genuine alternative to trade
off. Record it as a README/LEARNINGS note once proven in slice 03.
