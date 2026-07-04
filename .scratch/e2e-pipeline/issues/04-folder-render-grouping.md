# 04 — Folder view render + grouping assertions

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 02).

## What to build

Assert the folder Kanban view groups correctly: rendered columns correspond to
the folders under the view's `columnRoot`, and each note's card appears in its
own folder's column. Extends the slice-01 render spec from "something renders"
to "grouping is correct". Independent of the drag slice — can run in parallel
with 03.

Grow `test/helpers/kanban.ts` with `cards(columnName)` (cards within a column).

## Acceptance criteria

- [ ] Rendered column names match the folders under the fixture vault's
      `columnRoot`
- [ ] Each fixture note's card is asserted present in the column matching its
      folder
- [ ] A note in a non-matching folder is asserted absent from other columns
- [ ] `cards(columnName)` helper added and used by the spec
- [ ] `npm run test:e2e` passes green

## Blocked by

- `.scratch/e2e-pipeline/issues/01-harness-spike-folder-render.md`
