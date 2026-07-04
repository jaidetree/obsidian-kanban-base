# Project Learnings

## Patterns That Work

- [2026-07-04] E2E dev loop: run wdio against the **local Obsidian binary** to
  skip downloads — `OBSIDIAN_BINARY_PATH=/Applications/Obsidian.app/Contents/MacOS/Obsidian`
  plus `OBSIDIAN_INSTALLER_VERSION` matching that binary's version (e.g. 1.12.7).
  Verified green this way when the CI download path was unavailable.
- [2026-07-04] Keep Bases view `type:` id constants (e.g. `KANBAN_ID`) in an
  **obsidian-free `constants.ts`** re-exported by the view barrel. Lets E2E specs
  import the id for assertions without dragging in the runtime view graph.
- [2026-07-04] wdio-obsidian-service copies the vault to a temp dir per run, so
  the committed `test/vaults/*` fixture stays clean. Still gitignore the runtime
  churn files (`.obsidian/app.json`, `appearance.json`, `workspace.json`).

## Mistakes to Avoid

- [2026-07-04] E2E specs must **not** import from a `src` barrel/module that
  transitively imports `obsidian` — the mocha node loader can't resolve
  `obsidian` (it only exists inside the Obsidian runtime / `browser.executeObsidian`).
  Symptom: `Error: Cannot find module 'obsidian'` at spec load. Import
  obsidian-free modules, or reach the API only via `executeObsidian`.
- [2026-07-04] Always `npm run build` before any E2E run — wdio loads the bundled
  `main.js`, not TS source. A stale bundle = vacuous pass.

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

- [2026-07-04] Is the CI-default download of the pinned `1.10.2` Obsidian
  actually fetchable, and does 1.10.2's Bases render our view identically to
  1.12.7? Couldn't verify here — GitHub raw/releases returned error ("Unicorn")
  pages, blocking the version-list fetch and any download. Confirm in slice 07
  (CI) or via a working-network run.

## Consolidated Principles
