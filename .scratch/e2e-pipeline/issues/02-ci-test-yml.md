# 02 — CI online: test.yml

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 07, pulled early). See `docs/adr/0001-e2e-wdio-obsidian-bases.md`.

## What to build

A new `.github/workflows/test.yml` that runs the test suite in CI — closing the
current gap where no tests run in CI at all (only `lint.yml` + `release.yml`).
Brought online early so every subsequent E2E slice is CI-guarded.

Two jobs:

- **unit** — checkout, Node, `npm ci`, install Playwright chromium (the Storybook
  vitest project runs in a real browser), `npm test`.
- **e2e** — checkout, Node, `npm ci`, `npm run build` (wdio loads the bundled
  `main.js`, not TS source), cache `.obsidian-cache` via `actions/cache` keyed on
  `manifest.json` + `wdio.conf.mts` + `package-lock.json`, install `xvfb` +
  `herbstluftwm`, start a virtual display, `npm run test:e2e`.

## Acceptance criteria

- [ ] `test.yml` runs on push/PR with `unit` and `e2e` jobs
- [ ] `unit` job installs Playwright chromium and `npm test` passes
- [ ] `e2e` job builds, provisions xvfb+herbstluftwm, and the slice-01 spec passes headless
- [ ] `.obsidian-cache` is cached; **save** confirmed on first run and **restore** (cache hit) confirmed on a follow-up same-key run
- [ ] Cache key hashes `manifest.json`, `wdio.conf.mts`, `package-lock.json`

## Blocked by

- `.scratch/e2e-pipeline/issues/01-harness-spike-folder-render.md`
