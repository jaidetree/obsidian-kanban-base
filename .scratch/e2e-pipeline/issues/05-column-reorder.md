# 05 — Column reorder

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 04).

## What to build

Prove dragging a column to a new position reorders the board and the new order
persists. Reuses the synthesized-DragEvent approach proven in slice 03, applied
to the column drag handle. Add a `dragColumn(from, toIndex)` helper to
`test/helpers/kanban.ts`.

Column order lives in the view's persisted state (the `.base` `order` /
`boardState`), so assert the reordered sequence survives — re-read rendered
column order after the drag (and, where applicable, that the persisted state
reflects it).

## Acceptance criteria

- [ ] `dragColumn` helper synthesizes a column-handle drag accepted by the
      column `onDragStart`
- [ ] After the drag, rendered columns appear in the new order
- [ ] The new order persists (survives a view reload / is written to persisted
      state)
- [ ] `npm run test:e2e` passes green

## Blocked by

- `.scratch/e2e-pipeline/issues/03-folder-drag-file-move.md`
