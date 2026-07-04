---
name: slice
description: >-
    Use this skill when the user invokes /slice or wants to take one tracked
    vertical slice end-to-end: move it to in-progress, implement it, commit, and
    move it to in-review. Trigger on "/slice <issue>", "do slice N", "work issue
    N", or "ship slice N".
---

# Slice

Take one tracked slice end-to-end: in-progress → implement → commit → in-review.

Requires an issue argument. Accept either a path
(`.scratch/<feature-slug>/issues/<NN>-<slug>.md`) or a number. Given a bare
number `N`, resolve `.scratch/<feature-slug>/issues/<NN>-*.md` (zero-pad to two
digits) within the feature directory; if more than one feature dir exists and
the target is ambiguous, stop and ask which. If no argument is given, stop and
ask.

## Context (fresh-session ramp-up)

Project: **Kanban Base** — Preact/TSX views registered on Obsidian's Bases
feature (folder view + property view). Obsidian desktop plugin; bundles to
`main.js` via esbuild.

Read as needed — authoritative, don't restate:

- `LEARNINGS.md` — E2E gotchas + domain facts (step 1 loads it). Consult before
  touching the wdio harness.
- `AGENTS.md` + `docs/agents/*` — module boundaries; issue-tracker, triage-label,
  domain conventions.
- `.scratch/<feature>/PRD.md` — the plan a slice belongs to.
- `../obsidian-random-task` — sibling plugin; origin of the wdio/E2E patterns.

Test surfaces: vitest + Storybook for the pure Preact core (`obsidian` mocked);
`wdio-obsidian-service` E2E (`npm run test:e2e` download, `e2e:dev` headed) for
the real-Obsidian Bases mount.

## Steps

1. Read `LEARNINGS.md` if it exists; surface the most relevant points.
2. Read the slice file, plus its parent PRD (the `## Parent` path), any relevant
   `docs/adr/` it touches, and `CONTEXT.md` if present. Stop if the issue isn't
   found — report what failed.
3. Set the issue's `Status:` line to `in-progress` (the `Status:` convention is
   documented in `docs/agents/issue-tracker.md`, named from `AGENTS.md`).
4. Implement: read existing patterns near the change (keep `src/main.ts` minimal
   — lifecycle only; delegate feature logic to focused modules per `AGENTS.md`),
   then implement the slice as specified. Write/update tests at the seams the
   issue names (vitest for the pure core; `wdio-obsidian-service` E2E where
   called for).
5. Verify: `npm run build` (runs `tsc -noEmit` typecheck + esbuild) and
   `npm run lint`. Run `npm test` only if a `test` script exists. On failure,
   fix and **goto 4**.
6. Commit: `/commit <slice description>`. Skip if nothing to commit; never
   commit partial or failing work.
7. Set the issue's `Status:` line to `in-review` — this signals it awaits human
   testing. Check off the acceptance-criteria `- [ ]` boxes that now hold. Only
   a human advances it past review.
8. Run `/update-learnings` to capture what worked, what broke, and non-obvious
   domain facts. Be selective.
9. After summarizing, report a list of manual testing steps for humans
