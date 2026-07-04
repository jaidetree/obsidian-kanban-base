# 07 — Property drag → frontmatter rewrite

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 06).

## What to build

Prove a card drag in the property view rewrites the note's grouping frontmatter
property on disk. This is the property-view analogue of slice 03's file-move:
the DROP maps to `app.fileManager.processFrontMatter(...)`, writing the target
column's value into the dragged note's frontmatter.

Reuse the `dragCard` helper from slice 03 and a `frontmatterOf(path)` helper
(add to `test/helpers/kanban.ts`) that reads the note's frontmatter off disk.
Force known state in a `before` hook; gate `waitUntil` on the new frontmatter
value, not the pre-drag state.

## Acceptance criteria

- [ ] Dragging a card to another column rewrites the note's grouping property to
      the target column's value on disk
- [ ] `frontmatterOf` helper reads frontmatter from disk and is used in the
      assertion
- [ ] The dragged note's other frontmatter keys are left intact
- [ ] `before` hook forces default state; spec green on repeat run
- [ ] `npm run test:e2e` passes green

## Blocked by

- `.scratch/e2e-pipeline/issues/03-folder-drag-file-move.md`
- `.scratch/e2e-pipeline/issues/06-property-render-grouping.md`
