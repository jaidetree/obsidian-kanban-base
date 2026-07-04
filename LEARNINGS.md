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

- [2026-07-04] Is the CI-default download of the pinned Obsidian fetchable, and
  does its Bases render our view? [RESOLVED 2026-07-04] Yes — repinned to stable
  **1.10.6** (1.10.2 was an Insiders beta). The no-env download path runs green:
  4 passing on real Obsidian v1.10.6 (installer v1.5.8, Chrome 120). The version
  list lives at `.obsidian-cache/obsidian-versions.json`; app asars download from
  `releases.obsidian.md`.

## Consolidated Principles
