# Pre-release Checklist

- [x] **`normalizePath()`** — Normalize user-provided folder names through `normalizePath()` before passing to Vault APIs in the create-column modal.

- [ ] **RTL support** — Audit CSS for directional properties (`margin-left`, `padding-right`, etc.) and replace with logical equivalents (`margin-inline-start`, `padding-inline-end`, etc.).

- [ ] **Pop-out window handling** — Verify Preact renders target the correct document in pop-out windows. Check for any use of global `window`/`document` and replace with `activeWindow`/`activeDocument`.

- [ ] **TypeScript errors in TSX files** — `class` vs `className` type errors in `KanbanCardProperty.tsx`, `ObsidianIcon.tsx`, and `InlineForm.tsx`. Preact uses `class` but TypeScript is resolving React types. Fix the JSX type configuration.

- [ ] **Community plugin submission** — Open a PR against [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) adding an entry to `community-plugins.json`.
