# 03 — Folder drag → file moved on disk

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 03). See
`docs/adr/0001-e2e-wdio-obsidian-bases.md`.

## What to build

Prove a card drag in the folder Kanban view actually moves the note file between
folders on disk, end-to-end in real Obsidian. This is the second feasibility
gate: it validates the synthesized-DragEvent technique the whole "full re-test"
scope depends on.

The cards use **HTML5-native drag-and-drop** (`draggable` + `onDragStart` +
`dataTransfer`, payload = the card's file path), which WebDriver's native mouse
APIs cannot drive. Add a `dragCard(from, toColumn)` helper to
`test/helpers/kanban.ts` that **synthesizes `dragstart`/`dragover`/`drop`
DragEvents with a shared `DataTransfer` via `browser.executeObsidian(...)`**,
and a `readNote(path)` helper that reads the note back off disk. The folder-view
DROP maps to `app.vault.rename(file, targetFolder/…)`.

Force known plugin/vault state in a `before` hook (the wdio sandbox persists
between runs). Gate `waitUntil` on the note's new path existing, never on
pre-drag state.

## Acceptance criteria

- [ ] `dragCard` helper synthesizes DragEvents (with a shared DataTransfer)
      accepted by the card's `onDragStart`
- [ ] After a drag, the note file exists at the target folder path and no longer
      at the source (verified via disk read)
- [ ] The spec rebuilds (`npm run build`) semantics hold — it runs against the
      bundled `main.js`
- [ ] `before` hook forces default state; spec is green on a repeat run (no
      cross-run leakage)
- [ ] `npm run test:e2e` passes green

## Blocked by

- `.scratch/e2e-pipeline/issues/01-harness-spike-folder-render.md`
