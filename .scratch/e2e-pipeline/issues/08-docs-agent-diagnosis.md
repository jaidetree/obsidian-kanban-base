# 08 — Docs + agent diagnosis guide

Status: ready-for-agent

## Parent

`.scratch/e2e-pipeline/PRD.md` (slice 08).

## What to build

Document the E2E pipeline for humans and agents, now that all paths are proven:

- **README** E2E section: `test:e2e` (headless/CI), `e2e:dev` (headed, warm cache),
  the download-path-as-default stance, and the optional local `OBSIDIAN_BINARY_PATH`
  override (best-effort, machine-fragile).
- **Agent diagnosis guide** ("diagnosing in real Obsidian"): how to boot the app,
  `openBase`, drive live `app` via `browser.executeObsidian`, synthesize a drag,
  and read a note/frontmatter back off disk — using the `test/helpers/kanban.ts`
  surface (`openBase`, `columns`, `cards`, `dragCard`, `dragColumn`, `readNote`,
  `frontmatterOf`).
- **LEARNINGS/README note**: the proven synthetic-DragEvent recipe (per ADR-0001,
  this is a note, not an ADR).
- Update the `## Tasks` section of `docs/Kanban Base View.md` to mark the E2E
  pipeline complete.

## Acceptance criteria

- [ ] README documents `test:e2e`, `e2e:dev`, and the local-binary override
- [ ] An agent diagnosis guide exists covering boot → openBase → executeObsidian → synthesized drag → read off disk
- [ ] The synthetic-DragEvent recipe is recorded as a note
- [ ] `docs/Kanban Base View.md` Tasks updated to reflect the completed pipeline

## Blocked by

- `.scratch/e2e-pipeline/issues/02-ci-test-yml.md`
- `.scratch/e2e-pipeline/issues/05-column-reorder.md`
- `.scratch/e2e-pipeline/issues/07-property-drag-frontmatter.md`
