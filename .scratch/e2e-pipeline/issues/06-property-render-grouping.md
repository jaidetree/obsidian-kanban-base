# 06 — Property view render + grouping

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 05).

## What to build

Bring the second registered view under E2E: the property Kanban view
(`type: kanban-property`). Add a property `.base` fixture to the test vault (a
trimmed copy of `kanban-example/Kanban/Retro Games.base` shape —
`groupBy.property`, `filters`, `cardFolder`) plus notes carrying the grouping
frontmatter property. Assert columns correspond to the property's values and
each card sits in the column matching its note's frontmatter value.

Confirm the `.base` `type:` string equals the registered `KANBAN_PROPERTY_ID`
constant. The existing helpers (`openBase`/`columns`/`cards`) should carry over.

## Acceptance criteria

- [ ] Property `.base` fixture + notes with the grouping frontmatter added to
      the test vault
- [ ] `.base` `type:` confirmed equal to `KANBAN_PROPERTY_ID`
- [ ] Rendered columns match the property's values (respecting
      `userDefinedColumns`/`order` where set)
- [ ] Each note's card is in the column matching its frontmatter property value
- [ ] `npm run test:e2e` passes green

## Blocked by

- `.scratch/e2e-pipeline/issues/01-harness-spike-folder-render.md`
