# 01 — Harness spike: folder view renders

Status: in-review

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 01). See `docs/adr/0001-e2e-wdio-obsidian-bases.md`.

## What to build

Stand up the WebdriverIO + `wdio-obsidian-service` end-to-end harness and prove a
`.base` **folder** Kanban view mounts and renders in a real, sandboxed Obsidian.
This is the make-or-break feasibility gate — nothing downstream matters if a
registered Bases view can't be rendered and inspected through wdio.

Deliver, end-to-end:

- `wdio.conf.mts` — mocha framework, `services: ['obsidian']`, `reporters:
  ['obsidian']`, `cacheDir: .obsidian-cache`. Obsidian version **pinned** and
  env-overridable: `appVersion = env.OBSIDIAN_APP_VERSION ?? '<pinned 1.10.x>'`,
  `installerVersion = env.OBSIDIAN_INSTALLER_VERSION ?? 'earliest'` (= manifest
  `minAppVersion` 1.10.2). `binaryPath` used only when `OBSIDIAN_BINARY_PATH` set.
- `tsconfig.e2e.json` (extends base, adds wdio/mocha/node types, includes
  `wdio.conf.mts` + `test/**`), and eslint `globalIgnores` for those out-of-`src`
  files so typed `projectService` linting doesn't error.
- A trimmed copy of `kanban-example/` as the test vault under `test/vaults/`
  containing the folder `.base` (`type: kanban-base`) + a few notes across
  columns. Confirm the `.base` `type:` string equals the registered `KANBAN_ID`.
- `test/helpers/kanban.ts` seed: `openBase(path)` and `columns()` (returns
  rendered column names/handles).
- Scripts: `test:e2e` (headless CI path) and `e2e:dev` (**headed**, warm cache,
  for interactive/agent diagnosis).
- One `test/specs/*.e2e.ts` spec that opens the folder `.base` and asserts
  columns + cards render.

## Acceptance criteria

- [x] `npm run test:e2e` boots real Obsidian, opens the folder `.base`, and a spec asserting columns + cards render passes green
- [x] `npm run e2e:dev` launches headed against a warm cache (window visible for diagnosis)
- [x] `npm run lint` and `npm run build` pass with the new e2e files present
- [x] The `.base` `type:` string is confirmed to equal the registered `KANBAN_ID` constant
- [x] `test/helpers/kanban.ts` exposes `openBase` + `columns`, used by the spec
- [x] Obsidian version is pinned in `wdio.conf.mts` and overridable via env

## Verification notes

Verified GREEN against real Obsidian **1.12.7** via the local-binary override
(`OBSIDIAN_BINARY_PATH` + `OBSIDIAN_INSTALLER_VERSION=1.12.7`), 4 specs passing.
The GitHub raw/releases host was returning error pages this session, so the
CI-default **download** of the pinned `1.10.2` app could not be exercised here —
render mechanism proven, download of the pin to be confirmed in slice 07 (CI).

## Blocked by

None - can start immediately.
