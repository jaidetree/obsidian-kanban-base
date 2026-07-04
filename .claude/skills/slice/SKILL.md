---
name: slice
description: >-
    Use this skill when the user invokes /slice or wants to take one tracked
    vertical slice end-to-end: move it to in-progress, implement it, commit, and
    move it to in-review. Trigger on "/slice <issue>", "do slice N", "work issue
    N", or "ship slice N".
---

# Slice

Take one tracked slice of the Random Task Selector plugin end-to-end:
in-progress → implement → commit → in-review.

Requires an issue argument. Accept either a path
(`.scratch/<feature-slug>/issues/<NN>-<slug>.md`) or a number. Given a bare
number `N`, resolve `.scratch/<feature-slug>/issues/<NN>-*.md` (zero-pad to two
digits) within the feature directory; if more than one feature dir exists and
the target is ambiguous, stop and ask which. If no argument is given, stop and
ask.

## Steps

1. Read `LEARNINGS.md` if it exists; surface the most relevant points.
2. Read the slice file, plus its parent PRD (the `## Parent` path) and the
   `CONTEXT.md` glossary + any relevant `docs/adr/` it touches. Stop if the
   issue isn't found — report what failed.
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
