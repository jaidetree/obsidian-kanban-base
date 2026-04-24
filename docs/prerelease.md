# Pre-release Checklist

- [x] **`normalizePath()`** — Normalize user-provided folder names through `normalizePath()` before passing to Vault APIs in the create-column modal.

- [x] **RTL support** — Margins are used for spacing, not text indentation. Flexbox handles column flow direction naturally. No logical property changes needed.

- [x] **Pop-out window handling** — N/A. All drag events are handled via Preact synthetic event props. No global `window`/`document` listeners. Preact renders into `containerEl` provided by Obsidian.

- [x] **TypeScript errors in TSX files** — Added `"types": []` to `tsconfig.json` to prevent `@types/react` from being auto-included, fixing IDE false positives where React's `className` types shadowed Preact's `class` types.

- [ ] **Community plugin submission** — Open a PR against [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) adding an entry to `community-plugins.json`.
