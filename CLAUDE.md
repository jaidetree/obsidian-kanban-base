## Overview

We are developing a Kanban view plugin for Obsidian's bases feature.

The spec and task list can be found in ./docs/Kanban Base View.md

A similar plugin is located in ~/projects/obsidian/lovely-bases.

## Tasks

- Use the ## Tasks section of docs/Kanban Base View.md extensively to track
  work, document new features and current project progress.
- Before committing, create tests in storybook and vitest
- Ensure tests pass, npm run lint passes, and npm run build completes before
  committing
- After work is complete, after running tests, prompt me to manually test before
  committing
- After testing, mark any tasks as completed in the spec
- After each task is done make a git commit including updating the tasks section
  to mark features as complete.
- Work atomically so each commit keeps the project in an operational state

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, recorded as `Status:` strings in issue files (defaults, unchanged). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
