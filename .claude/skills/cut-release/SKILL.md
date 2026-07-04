---
name: cut-release
description: Cut a release — bump the version, tag, push, and draft GitHub release notes. User-invoked with an optional target (patch/minor/major/explicit version).
disable-model-invocation: true
---

# Cut a release

Ship a new version: bump → tag → push tag → add notes to the CI draft → push main.

**CI owns the draft.** Pushing the tag triggers `release.yml`, which builds, attests, and runs `gh release create --draft` with the assets. You **edit** that draft — never `gh release create` yourself (it conflicts with CI). Terminal state: **draft release with notes + main pushed**. Do not publish; the user publishes when ready.

Tags carry no `v` prefix (`.npmrc` sets `tag-version-prefix=""`). `npm version` auto-creates the commit and tag via `version-bump.mjs`, which syncs `manifest.json` and `versions.json`.

## Steps

### 1. Pre-flight — green and clean

- `gh auth status` succeeds.
- On `main`, synced with `origin/main`.
- No tracked modifications (`git status --porcelain` shows no staged/unstaged tracked changes; untracked files are fine and `npm version` ignores them).
- **Green:** `npm run lint`, `npm run test`, and `npm run build` all pass.

Abort with the failing check if any is red. Done when all pass.

### 2. Draft the notes (before the bump)

Prior tag: `git describe --abbrev=0 --tags`. Read the commits with `git log <prior-tag>..HEAD`.

Write notes to a file matching the established format (see the 1.0.4 release for the model):

```
## What changed

- **Bold lead-in.** One user-facing change per bullet, plain-language.

## Why

Short prose on the reason behind the changes.

## Notes

Optional — verification commands, caveats.
```

Concise but meaningful: explain impact, not commit-by-commit mechanics. Done when the notes file exists.

### 3. Choose the target and confirm once

Target comes from the skill arg (`patch` | `minor` | `major` | explicit version). If absent, recommend a bump from the commits (semver) and ask.

Show the user the **chosen bump + drafted notes** and confirm. Pushing the tag creates a real (draft) GitHub release — this is the one outward-facing gate. Done when confirmed.

### 4. Bump

`npm version <target>` — creates the version commit and tag automatically. Done when `git tag` shows the new tag on the release commit.

### 5. Push the tag and watch CI

- `git push origin <tag>`
- `gh run watch $(gh run list --workflow=release.yml -L1 --json databaseId -q '.[0].databaseId')`

If the run is red there is no draft to edit — stop with the failure; do not proceed. Done when the release run is green.

### 6. Apply the notes to the CI draft

`gh release edit <tag> --notes-file <file>`. Never `gh release create`. Done when `gh release view <tag>` shows the notes and `isDraft: true`.

### 7. Push main

`git push origin main`. Done when `origin/main` is at the release commit.

Report the draft release URL and tell the user to publish when ready.
