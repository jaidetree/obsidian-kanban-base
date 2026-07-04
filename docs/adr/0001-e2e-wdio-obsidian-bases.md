# E2E via wdio-obsidian-service against real Obsidian Bases

Status: accepted

We drive end-to-end tests through a real, sandboxed Obsidian instance
(`wdio-obsidian-service` + WebdriverIO) rather than extending the existing
Storybook / `@vitest/browser-playwright` stack. The vitest/Storybook suite aliases
`obsidian` → `src/__mocks__/obsidian.ts` and mounts Preact components in isolation,
so it exercises neither the real Obsidian APIs (`BasesView`, `QueryController`,
`app.vault`, `fileManager.processFrontMatter`) nor the Bases mount path
(`registerBasesView` → `.base` parse → factory). Only a real Obsidian can verify
that this plugin works *as a Bases view* and that a card drag actually mutates the
vault on disk (`vault.rename` for the folder view, `processFrontMatter` for the
property view) — and the same harness doubles as an agent-facing tool to boot the
real app, open a `.base`, execute against live `app`, and read notes back off disk.

## Considered options

- **Extend Playwright/Storybook** — already installed, fast, headless. Rejected:
  it can only ever run against the Obsidian mock and cannot mount a real Bases
  view, which is precisely the surface we need to verify.
- **wdio-obsidian-service (chosen)** — launches a real, sandboxed Obsidian whose
  Bases feature, vault, and file APIs are the actual ones the plugin ships
  against. Heavier (downloads a pinned Obsidian, needs a virtual display in CI)
  but it is the only layer that tests the integration and enables real-Obsidian
  diagnosis.

## Consequences

- CI needs a virtual display (xvfb + herbstluftwm) and a cached Obsidian download
  (`.obsidian-cache`); Obsidian version is pinned for reproducibility
  (`installerVersion: 'earliest'` = manifest `minAppVersion`).
- Files outside `src/**` (`wdio.conf.mts`, `test/**`, `tsconfig.e2e.json`) must be
  added to eslint `globalIgnores` because typed linting (`projectService`) errors
  on files not covered by a tsconfig `include`; a separate `tsconfig.e2e.json`
  supplies the wdio types.
- wdio loads the bundled `main.js`, not TS source — a `npm run build` must precede
  any E2E run after a source change, or the spec runs a stale bundle.
- HTML5-native drag-and-drop (`draggable` + `dataTransfer`) cannot be driven by
  WebDriver's native mouse APIs; drags are synthesized as `DragEvent`s via injected
  JS. That technique is a README/LEARNINGS note, not a separate ADR — there is no
  genuine alternative to trade off.
