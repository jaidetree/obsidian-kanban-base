# Project Learnings

## Patterns That Work

- [2026-07-04] E2E dev loop: run wdio against the **local Obsidian binary** to
  skip downloads — `OBSIDIAN_BINARY_PATH=/Applications/Obsidian.app/Contents/MacOS/Obsidian`
  plus `OBSIDIAN_INSTALLER_VERSION` matching that binary's version (e.g. 1.12.7).
  Verified green this way when the CI download path was unavailable.
- [2026-07-04] Keep Bases view `type:` id constants (e.g. `KANBAN_ID`) in an
  **obsidian-free `constants.ts`** re-exported by the view barrel. Lets E2E specs
  import the id for assertions without dragging in the runtime view graph.
- [2026-07-04] CI `unit` job must run `npx playwright install --with-deps
  chromium` before `npm test` — the Storybook vitest project
  (`@vitest/browser-playwright`, `vitest.config.ts`) runs in real chromium, so
  `npm test` fails in CI without the browser + system deps. The `unit` job
  (browser tests) and `e2e` job (wdio) are separate CI jobs by design.
- [2026-07-04] wdio-obsidian-service copies the vault to a temp dir per run, so
  the committed `test/vaults/*` fixture stays clean. Still gitignore the runtime
  churn files (`.obsidian/app.json`, `appearance.json`, `workspace.json`).

- [2026-08-12] A click-guard on an ancestor element (e.g. a card's outer
  `onClick` calling `e.preventDefault()` while in an "editing" state) can
  silently break a descendant `<button type="submit">` inside a `<form>`:
  the click event bubbles to the ancestor, and `preventDefault()` there
  cancels the *same* click event's default action — form submission — even
  though `stopPropagation()` alone would have been enough to block bubbling
  further. Symptom: a submit/checkmark button that visibly responds to
  clicks (cursor, ripple) but the `onSubmit` handler never fires. Fix: drop
  the `preventDefault()`, keep `stopPropagation()` if still needed.
- [2026-08-12] A jsdom-based `@testing-library/preact` unit test reproduces
  this class of "preventDefault on bubbled click cancels sibling's submit"
  bug just as reliably as a real-browser E2E test, and much faster — jsdom
  implements the click→submit default-action relationship per spec. Prefer
  it over Storybook/real-browser tests for this kind of interaction bug.

## Mistakes to Avoid

- [2026-07-04] `npm run build` + `npm run lint` verify **nothing** about a
  GitHub workflow YAML — eslint `globalIgnores` excludes files outside `src/**`
  and `tsc` never sees them. Validate a workflow by **parsing the YAML**
  (`actionlint` if present, else load it in node). Runtime acceptance (jobs
  green, `actions/cache` **save** then **restore-hit**) needs a live CI run
  across two pushes — it can't be confirmed locally; leave those boxes unchecked
  at in-review.
- [2026-07-04] E2E specs must **not** import from a `src` barrel/module that
  transitively imports `obsidian` — the mocha node loader can't resolve
  `obsidian` (it only exists inside the Obsidian runtime / `browser.executeObsidian`).
  Symptom: `Error: Cannot find module 'obsidian'` at spec load. Import
  obsidian-free modules, or reach the API only via `executeObsidian`.
- [2026-07-04] Always `npm run build` before any E2E run — wdio loads the bundled
  `main.js`, not TS source. A stale bundle = vacuous pass.
- [2026-07-04] Don't pin the wdio `appVersion` to an Insiders **beta** build —
  the download then demands `OBSIDIAN_EMAIL`/`OBSIDIAN_PASSWORD`. Our manifest
  `minAppVersion` 1.10.2 is itself a beta (`isBeta: true`). Pin a **stable**
  release instead (1.10.6 is the nearest stable 1.10.x). Check `isBeta` in the
  service's cached `.obsidian-cache/obsidian-versions.json`.
- [2026-08-12] Desktop Obsidian's `Menu` (from `new Menu()` +
  `showAtMouseEvent`/`showAtPosition`) renders a **native OS context menu**
  by default (`this.useNativeMenu` gate inside `showAtPosition`'s bundled
  source, true whenever `Platform.isDesktop`) — it never touches the DOM, so
  WebDriver/chromedriver can't see or click its items no matter how the
  triggering click is dispatched (confirmed with `new Menu()` called
  directly via `executeObsidian`, on both app 1.13.4 and 1.10.6: zero
  `document.body` mutations). To E2E-test any of our own `Menu`-based UI
  (card/column "…" menus), monkeypatch
  `obsidian.Menu.prototype.showAtMouseEvent` in the spec's `before()` hook to
  call `this.setUseNativeMenu(false)` first — forces the DOM-based
  `.menu`/`.menu-item-title` fallback for that test session only, no plugin
  source changes needed. Also, this **must** run against a real local
  Obsidian; the app JS shipped by an installed binary can be overridden via
  `OBSIDIAN_APP_VERSION` (separate from `OBSIDIAN_INSTALLER_VERSION`, which
  must stay matched to that binary's actual Electron/chromedriver).
- [2026-08-12] `test/vaults/kanban` is git-tracked but **not** actually reset
  between local E2E runs — `reloadObsidian({vault})` only reloads the app,
  it doesn't restore files. A prior interrupted run left
  `Atomic Habits.md` renamed to `Atomic Habits 2.md` uncommitted, which broke
  unrelated assertions in `folder-render.e2e.ts`. Always `git checkout --
  test/vaults/kanban` (and `git status` it) before trusting E2E output
  locally; specs that rename/mutate fixture files need an `after()` hook
  that reverts the mutation (see `card-rename.e2e.ts`).

## Domain Knowledge

- [2026-07-04] Opening a `.base` file renders its **first defined view**. A
  single-view fixture reliably mounts the intended kanban view.
- [2026-07-04] Folder view: columns = direct subfolders of the base's
  `columnRoot`; cards = notes directly inside each subfolder. Notes need no
  frontmatter.
- [2026-07-04] Rendered DOM contract: board `.kanban-base-board`, column title
  `.kanban-base-column-header h2`, card title `.kanban-base-card-title`.
- [2026-07-04] wdio v9 idioms: `browser.$$(sel).map(cb)` returns `Promise<T[]>`
  directly (ChainablePromiseArray); `browser.$$(sel).length` is a
  `Promise<number>` (await it).

## Open Questions

- [2026-08-12] `folder-render.e2e.ts` fails locally against Obsidian 1.13.4
  (both installer & app version) even on a clean, freshly-`git checkout`'d
  vault: it renders extra empty-string column headers/card titles (5 blanks
  ahead of the real ones) plus an `Archived` column the test doesn't expect.
  Reproduced on **unmodified `main`**, so it's pre-existing and unrelated to
  any rename-bug fix — not investigated further here. Possibly a
  render-before-entries-resolve duplicate-header issue that only shows on
  newer Obsidian, or a stale `boardState` mismatch (`Archived` column is in
  the committed `.base` file's `boardState` but not in the test's
  `EXPECTED_COLUMNS`). Needs its own investigation.

- [2026-07-04] Is the CI-default download of the pinned Obsidian fetchable, and
  does its Bases render our view? [RESOLVED 2026-07-04] Yes — repinned to stable
  **1.10.6** (1.10.2 was an Insiders beta). The no-env download path runs green:
  4 passing on real Obsidian v1.10.6 (installer v1.5.8, Chrome 120). The version
  list lives at `.obsidian-cache/obsidian-versions.json`; app asars download from
  `releases.obsidian.md`.

## Consolidated Principles
