# Part V Issues

Reported after manual testing of the Part V implementation.

---

## ~~Issue 1: Add card does nothing~~ RESOLVED

Cards were being created at vault root, but the user's base query filtered to a specific folder so the new file never appeared. Fixed by adding a **New card folder** (`cardFolder`) option (folder picker) to the property view. `addCard` and `createFileForView` now prefix paths with `cardFolderPath`.

---

## ~~Issue 2: Add card in Uncategorized does nothing~~ RESOLVED

Same root cause and fix as Issue 1.

---

## Issue 3: "+" button does not write property to frontmatter — KNOWN LIMITATION

**Steps:** Click the Obsidian built-in "+" button with a named column as the first column.
**Expected:** New note created with group-by property set to the first column's value and placed in the card folder.
**Actual:** A new note is created but the group-by property is not written and it lands in the default folder.

**Investigation:** `BasesView.createFileForView` is a utility we call, not a hook Bases invokes. A `vault.on('create')` listener in the constructor fires correctly and can write the property and move the file, but it also fires for any `Untitled` note created elsewhere in the vault — too broad to ship safely. No scoping mechanism exists to distinguish Bases-created files from user-created ones. The per-column "Add card" buttons are the recommended workflow.

---

## ~~Issue 4: No "Add column" button visible~~ RESOLVED

Was not visible due to `npm run dev` not running. Button renders correctly once plugin is built.

---

## Issue 5: Renaming a column adds a duplicate with the old name

**Steps:** Open column menu → Rename → enter a new name → confirm.
**Expected:** Column is renamed in place (keeping its icon and position).
**Actual:** A new column with the old name (no icon) is appended to the end of the board. The original column may also be renamed, resulting in a duplicate.

---

## Issue 6: Could not test "Remove empty column"

Blocked by Issue 4 — no way to create a user-defined column without the "Add column" button.

---

## Issue 7: Removing a non-empty column has no effect

**Steps:** Open column menu → Remove → (modal may appear) → confirm.
**Expected:** Column removed; cards moved to target column if one was selected.
**Actual:** No visible change after confirming removal.
