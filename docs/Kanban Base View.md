# Kanban Base View — Plugin Specification

## Overview

This plugin registers a **Kanban view** for Obsidian Bases, selectable from the
same view-type dropdown as the built-in table and cards views. It uses folder
membership as kanban status: each immediate child folder within the base's scope
becomes a column, and moving a card between columns physically moves the file to
the target folder.

---

## Requirements

- **Obsidian**: 1.10.1+ (public Bases API with group-by support)
- **Bases API**: `registerBasesView()` with `options` support for per-view
  configuration

---

## View Registration

The plugin registers a single view type (e.g. `kanbannBase`) via the Bases
public API, gated behind `requireApiVersion("1.10.1")`. It appears in the
view-selector dropdown alongside the built-in table and cards views.

---

## Core Concept: Folders as Statuses

- **One column per immediate child folder** within the base's scope.
- **Subfolders are ignored** — they do not appear as columns. This allows
  subfolders to host their own independent nested kanban views.
- **One card per note** returned by the base query.
- When the user changes the base's group-by field to a different folder or
  reconfigures the base scope, columns update **reactively**.

---

## Columns

### Derivation

Columns are derived from the immediate child folders of the base's root folder
at render time. No subfolders are shown.

### Ordering

- Columns are **user-sortable via drag-and-drop**.
- Drag-and-drop column reordering is powered by an **XState state machine**.
- The user's column order is persisted via the Bases `options` config system.
- Default order (before any user sorting) follows the natural filesystem order
  (alphabetical).

### Reactivity

Columns update live when the base's underlying data changes (files
added/moved/deleted externally).

### Creating Columns

Users can **create a new column** directly from the kanban view. Creating a
column:

1. Prompts the user for a folder name.
2. Creates the folder on disk within the base's scope.
3. Appends the new column to the board.

---

## Cards

### Display

Each card shows:

- **Note title** (always shown)
- **Selected base properties** (user-configurable per base, see Configuration)

### Configuration

Which properties appear on cards is configurable per-base via the Bases
`options` declarative config system. Users select properties from a multi-select
property picker exposed in the view's settings panel.

---

## Card Interaction

### Drag-and-Drop

- Cards are **draggable between columns**.
- Drag-and-drop is powered by an **XState state machine**.
- Dropping a card onto a column **moves the file to the corresponding folder**
  on disk.
- Obsidian's internal link updating handles any wikilink references to the moved
  file.

### Card Creation

The base UI's **+ button** is customized to create a new note in the **first
column's folder** (i.e. the leftmost column in the current user-defined order).
The new note is created using Obsidian's standard note creation API and
immediately appears as a card in that column.

---

## Filters

The kanban view is a first-class base view and inherits all standard base
behaviors:

- Active **filter rules** hide cards that don't match.
- Active **search/query** input applies to cards.
- **Sorting** defined in the base applies to card order within each column.

---

## Styling

- Uses **Obsidian's existing base UI design language** — colors, typography,
  spacing, and component styles match the built-in table and cards views.
- Supports **light and dark mode** via Obsidian's CSS variable system.

---

## Technical Architecture

### State Machines (XState)

Two XState state machines handle drag-and-drop interactions:

| Machine              | Responsibility                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- |
| `columnOrderMachine` | Tracks column drag state, computes new order on drop, persists order                |
| `cardDragMachine`    | Tracks card drag state, determines source/target column, triggers file move on drop |

### Data Flow

1. Base query runs → returns list of notes with metadata.
2. Plugin groups notes by their immediate parent folder.
3. Columns are rendered in user-defined order (or alphabetical default).
4. On card drop → `app.vault.rename()` moves the file → base query re-runs
   reactively.
5. On column create → `app.vault.createFolder()` → new column appended.

### Configuration Storage

Per-base config (selected card properties, column order) is stored through the
Bases API `options` system, using the following keys:

| Key              | Type          | Description                                       |
| ---------------- | ------------- | ------------------------------------------------- |
| `cardProperties` | `multitext`   | List of property names to show on cards           |
| `columnOrder`    | `text` (JSON) | Serialised array of folder names in display order |

---

## Out of Scope (v1)

- Card counts in column headers
- Non-folder group-by types (select, tags, text properties)
- Inline card editing
- Collapsed columns
- WIP limits

## Tasks

### Phase I: Plan Project

- [x] Plan features
- [x] Draft spec

### Phase II: Project Setup

- [x] Setup plugin template
- [x] Install packages
- [x] Add XState
- [x] Setup storybook + maybe vitest for testing

### Phase III: Register Base View

- [x] Research the Bases public API — find `registerBasesView()` signature,
      `options` type definitions, and how the view receives its data/context
- [x] Define TypeScript types for the view context (notes list, folder
      structure, base options)
- [x] Strip boilerplate from `main.ts` (remove sample modal, ribbon icon, status
      bar, sample commands)
- [x] Register `kanbanBase` view type via `registerBasesView()` gated behind
      `requireApiVersion("1.10.1")`
- [x] Implement folder-derivation logic: given the base's root, return immediate
      child folders only (no subfolders)
- [x] Group the base's notes by their immediate parent folder
- [x] Render a minimal column layout: a horizontal row of `<div>` columns, each
      labelled with the folder name
- [x] Render each note as a plain `<div>` text element (title only) inside its
      column
- [x] Verify the view appears in the base view-type dropdown and displays notes
      correctly

### Phase IV: Enhance Kanban UI

- [x] Style columns to match Obsidian's base UI design language (width, spacing,
      header, scrollable body)
- [x] Style note cards (border, padding, hover state, cursor) using Obsidian CSS
      variables
- [x] Show selected base properties below the title on each card
- [x] Declare `cardProperties` in view `options` as a `multitext`
      property-picker; wire it to card rendering
- [x] Declare `columnOrder` in view `options` as a serialized JSON array; apply
      it when rendering columns
- [x] Add a **+ column** button that prompts for a name, calls
      `app.vault.createFolder()`, and appends the column
- [x] Customize the base UI's **+ button** to create a new note in the first
      column's folder via `app.vault.create()`
- [x] Ensure light/dark mode works correctly (no hardcoded colors)
- [x] Write Storybook stories for: column layout, card (title only), card (with
      properties)
- [x] Add `cardSize` slider option to view settings; apply as
      `--kanban-column-width` CSS custom property to resize columns live

### Phase V: Icons and Column Settings

#### Icons

Enhance the columns UI by adding an optional icon on the top left of each column
header. By default the top left of each column header is a button with a
randomly selected icon that is lower opacity to appear greyed out. Clicking it
displays an icon suggest dialog UI that includes the obsidian icon set plus
emojis. An example can be found in ~/projects/iconic/src/dialogs/IconPicker.tsx.

Icon selections should be persisted to the base view stored similarly to base
view settings.

When a new column is created, select a random icon that persists until user
changes it.

Ues XState to model stateful logic in finite state machines.

- [x] Install and configure `@xstate/react` (or standalone XState) for Preact —
      used custom `useXState` Preact hook wrapping XState actors
- [x] Design an fsm using xstate for displaying and using the icon selector —
      `iconMachine` in `src/views/KanbanView/iconMachine.ts`
- [x] Add icon button UI to left side of column headers — `IconButton` +
      `IconRenderer` components in `KanbanBoard.tsx`
- [x] Select default icon for column if not previously set — deterministic hash
      of folder name via `getDefaultIcon()`; shown at 0.35 opacity
- [x] Create an IconSuggest dialog to search and select an icon —
      `IconSuggestModal` in `src/views/KanbanView/IconSuggestModal.ts`
- [x] Persist icon selection for base view — `columnIcons` hidden text option
      (JSON map) in view config
- [x] Set default icon to something static and generic
- [ ] ~~Add animation to collapsing~~

#### Column Context Menu

On the right side of the column header should be an ellipsis button that opens a
context dialog. For now options include collapsing/expanding, and renaming the
column/folder.

In edit mode, the title is replaced with an inline text input with the current
column name. Below the input should be buttons to accept changes or cancel
changes.

Use XState to model logic as FSMs

- [x] Design an fsm using xstate to model editing, collapsed, and expanded
      states for columns — `columnMachine` in
      `src/views/KanbanView/columnMachine.ts`; states: `idle` (supports RENAME,
      TOGGLE_COLLAPSE) and `editing` (supports SET_DRAFT, CONFIRM, CANCEL)
- [x] Add ellipsis button to the right of column header —
      `lucide-more-horizontal` icon, hidden until hover
- [x] Add context menu to ellipsis button with options to collapse/expand and
      rename — Obsidian `Menu` with Rename, Collapse/Expand, and Remove icon
      items
- [x] Implement renaming feature with save button and cancel buttons — inline
      input replaces h2 in editing state; Save/Cancel buttons below;
      Enter/Escape shortcuts; renames folder on disk and migrates
      columnOrder/columnIcons/columnStates keys
- [x] Add item to context dialog to remove icon — "Remove icon" menu item
      deletes the column's entry from the icons signal
- [x] Implement expanding and collapsing — column body conditionally rendered;
      collapsed column shrinks to header width
- [x] Persist expanding and collapsing column states for the base view —
      `columnStates` hidden text option (JSON map) in view config; migrated on
      rename

### Phase VI: Drag 'n' Drop

#### Reorder Columns

Implement drag and drop functionality for columns to reorder them and persist
their order in the base. Dragging and dropping columns should be modeled with
XState using the hooks in src/hooks/xstate.ts.

Save any XState machine defs in the src/machines directory. Update lint config
to cover those files.

- [x] Implement `columnOrderMachine`: states
      `idle → dragging → reordered/canceled`; on `reordered` persist new order
      to `columnOrder` option — `src/machines/columnOrderMachine.ts`
- [x] Render a column drag handle
- [x] Highlight active position while a column is being reordered — CSS classes
      `kanban-base-column--dragging` (opacity 0.5) and
      `kanban-base-column--drop-target` (accent outline)
- [x] Wire HTML5 drag events to machine — `draggable` on handle,
      `onDragStart`/`onDragOver`/`onDrop`/`onDragEnd` on column div
- [x] Live preview column order during drag via `previewColumns` in
      `KanbanBoard`; persist to `columnOrder` on drop
- [x] Write Storybook stories for drag states: `ColumnDragging`,
      `ColumnDropTarget` in `KanbanColumn.stories.tsx` and
      `KanbanBoard.stories.tsx`
- [x] Manual end-to-end test: reorder columns, verify order persists

#### Drag and Drop Cards Between Columns

- [x] Implement `cardDragMachine`: states `idle → dragging → dropped/canceled`;
      on `dropped` call `app.vault.rename()` to move file to target folder, then
      trigger base re-render
- [x] Wire pointer events (mousedown/mousemove/mouseup or HTML5 drag events) to
      both machines
- [x] Render a drop-target highlight on the active column while a card is being
      dragged
- [x] Handle edge cases: dropping card onto its own column (no-op), dropping
      outside any column (cancel)
- [x] Write Storybook stories for drag states: card dragging
- [x] Manual end-to-end test: drag card across columns, verify file moves on
      disk

### Phase VII: Polish

#### Columns Refactor

Currently, the system picks up folder names based on the .md files that are
received from the filter UI. The problem is, if all cards are moved to another
column the original column will be hidden.

I've come up with at least two options to solve this:

##### Collect sibling folders from matching stories

For every folder of every file that matches the query, automatically collect
sibling folders as columns.

This will surface empty columns without major changes. The downside though is
this plugin becomes more opinionated about how kanban folders are organized.

##### Specify parent folder in view settings

Add a view setting similar to card size that lets users specify the target
folder then list all direct subfolders as columns.

This way it's more explicit.

##### Other options

Maybe there is another option I'm not considering?

##### Tasks

- [x] Discuss and plan a solution — chose explicit `FolderOption` (`columnRoot`)
      with inline empty-board prompt
- [x] Register `columnRoot` as a `FolderOption` in `KANBAN_OPTIONS` (`index.ts`)
- [x] Add `deriveColumnsFromRoot(root, entries)` pure function — seeds columns
      from all direct subfolders of root, assigns entries by parent path
- [x] Modify `onDataUpdated` to resolve `columnRoot` config → call
      `deriveColumnsFromRoot`; show inline prompt when unset or folder deleted
- [x] Fix `handleCardDrop`, `handleRenameColumn`, `handleAddColumn` to use
      `columnRootFolder` instead of re-deriving from entries
- [x] Create `FolderSuggestModal` (patterned on `IconSuggestModal`) for folder
      picker
- [x] Add empty-board prompt UI to `KanbanBoard` when `columnRootSet` is false
- [x] Add `deriveColumnsFromRoot` vitest suite (5 cases); update
      `create-mock-app` with `getFolderByPath`/`getAllFolders` stubs
- [x] Add `NoRootConfigured` Storybook story to `KanbanBoard.stories.tsx`

#### Cards

- [x] Add drag handle to left edge of card
- [x] Add an ellipsis context menu button on the right edge of card
- [x] Add rename to context menu
- [x] Add delete to context menu
- [x] Add open to context menu
- [x] Add open in new tab to context menu
- [x] Add new button at the bottom of every column (inline input, Enter adds
      card and stays open for next)

#### Add "Remove Folder" Menu Item to Column

In the Column context menu, add an option to remove the column. If the column is
empty just delete the column and folder. If there are at least one card, show a
modal to select which column to move tickets to with a button to confirm or
cancel.

- [x] Define modal with column select UI, confirm, and cancel buttons
- [x] Add menu action to remove column
- [x] Link add menu action to modal
- [x] Ensure column cannot be removed while collapsed

#### General Cleanup

- [x] Use context to pass ref to KanbanView
- [x] Fix column header content alignment
- [x] Fix rename card cancel button
- [x] Create reusable inline form
- [x] Apply inline form to rename column, new column, rename card UIs
- [x] Focus on inline form UI
- [x] Open cards in new tabs
- [x] Improve Add column button styles
- [x] Move add column logic into state machine
- [x] Move column state machines into machines/ directory
- [x] Retain order and icon when renaming columns
- [x] Pick up new folders when added to target directory

### Phase VIII: Properties

#### Part I: Initial Property Support

Render selected properties from the Kase UI on each card. Start with supporting
a list of tags when selected from the Base UI by rendering the associated tags
with each card. Tags should render leveraging default styles from users'
existing settings or theme where applicable.

- [x] Research and plan implementation to access selected properties from the
      Bases UI
- [x] Display the selected tags on each card

#### Part II: Support Remaining Property Types

- [x] Support a list of links
- [x] Support date fields
- [x] Support remaining types

### Phase IX: Property-Based Kanban View

Introduce a second kanban view type — **Kanban** (`kanbanPropertyView`) — that
uses a single-value text property (e.g. `status`) as the column source, driven
by the Bases UI's native group-by selector. The existing folder-based view is
renamed to **Kanban Folders** in the view-type selector. Shared UI components
and machines are extracted into a common base so both views reuse as much code
as possible.

**Supported field types:** `text` and `status` (both are single-value string
fields in Obsidian). Multi-value fields (`tags`, `multitext`) are explicitly out
of scope — using them as the group-by field displays a friendly error.

---

#### Part I: Rename & Refactor Existing View

- [ ] Rename the existing view's display label to **"Kanban Folders"** in the
      `registerBasesView()` call — keep the internal ID `kanbanBase` unchanged to
      avoid any config migration burden
- [ ] Identify all components, machines, hooks, and utilities that are
      view-agnostic and move them to a shared location (e.g.
      `src/views/KanbanBase/`): `KanbanColumn`, `KanbanCard`, `InlineForm`,
      `IconSuggestModal`, `RemoveColumnModal`, `columnMachine`, `iconMachine`,
      `cardDragMachine`, `columnOrderMachine`, drag-handle styles, card styles,
      column header styles (`FolderSuggestModal` stays with the folder view — it
      is folder-specific)
- [ ] Introduce a shared `KanbanView` base class (or shared context/props type)
      that both `KanbanFolderView` and `KanbanPropertyView` extend — it owns the
      board-level state: column order, column icons, column collapse states, card
      properties display list, card size

---

#### Part II: Register New View Type

- [ ] Register **"Kanban"** (`kanbanPropertyView`) via `registerBasesView()`
      alongside the existing view
- [ ] Declare view `options` for `kanbanPropertyView`:

| Key                  | Type                  | Description                                                           |
| -------------------- | --------------------- | --------------------------------------------------------------------- |
| `cardProperties`     | `multitext`           | Properties displayed on each card (reused from folder view)           |
| `columnOrder`        | `text` (JSON, hidden) | Serialised array of column value strings in display order             |
| `columnIcons`        | `text` (JSON, hidden) | Map of column value → icon name                                       |
| `columnStates`       | `text` (JSON, hidden) | Map of column value → `{ collapsed: boolean }`                        |
| `userDefinedColumns` | `text` (JSON, hidden) | Ordered list of all user-created column values; persists indefinitely until explicitly deleted |
| `defaultColumn`      | `text` (hidden)       | Column value targeted by the built-in "+" button; managed via a custom dropdown in the settings panel since column options are dynamic |
| `showEmptyColumns`   | `toggle`              | Whether to show columns with no cards (default `true`)                |
| `showUncategorized`  | `toggle`              | Whether to show the "Uncategorized" column (default `true`)           |
| `cardSize`           | `slider`              | Column width (reused from folder view; default 220, min 50, max 800)  |

  No `groupByProperty` option — the group-by field is configured through the
  standard Bases UI group-by selector.

---

#### Part III: Property Picker & Column Derivation

- [x] **Research spike — `BasesConfigFileView.groupBy` runtime shape**: ✅
      **Result**: `(this.config as any).groupBy` is an object `{ property: string,
      direction: "ASC" | "DESC" }`. Example: `{ property: "note.Status", direction:
      "ASC" }`. The property ID uses Obsidian's `note.<key>` prefix format — strip
      the `note.` prefix to get the raw frontmatter key (e.g. `"Status"`). This
      is accessible at runtime; no fallback to `PropertyOption` is needed.
      `groupedData` returns one `BasesEntryGroup` per distinct string value (all
      with `hasKey: true` and a `StringValue` key), plus one final group with
      `hasKey: false` for uncategorized cards (those with no value for the
      group-by property).
- [ ] Column source: consume `BasesQueryResult.groupedData` — each
      `BasesEntryGroup` becomes one column, keyed by its `Value`. The group-by
      property name is read from `(this.config as any).groupBy?.property` and the
      frontmatter key is derived by stripping the `note.` prefix. The group-by
      field is set by the user in the standard Bases UI; no custom property picker
      is needed in the view options.
- [ ] **Unsupported field type error**: inspect the key type of the first group
      with `hasKey() === true`. If its key is anything other than a `StringValue`
      (i.e. the field is a number, date, boolean, link, or multi-value list),
      render a full-board error state instead of the column layout:
      > "This property type is not supported by the Kanban view. Please select a
      > text or status property as the group-by field. If you'd like support for
      > this type, [open a GitHub issue](#)."
- [ ] **No group-by configured**: if all groups have `hasKey() === false` (i.e.
      `groupBy` is absent or its `property` is unset), show an empty-board prompt
      instructing the user to set a group-by field in the Bases UI. Note:
      distinguish this from the normal uncategorized group — when a group-by IS
      set, the uncategorized group also has `hasKey() === false` but the other
      groups have `hasKey() === true`; when no group-by is set, every group has
      `hasKey() === false`.
- [ ] Implement `deriveColumnsFromGroupedData(groups, userDefinedColumns)`:
  - Collect column values from the non-null group keys (each is a `StringValue`)
  - Merge in `userDefinedColumns` (preserves user-defined columns that have no
    cards yet)
  - Deduplicate and order by `columnOrder`; append unknowns at the end
  - `userDefinedColumns` entries persist until the user explicitly deletes the
    column — empty workflow columns (e.g. "Done") survive across sessions
- [ ] Cards in the null-key group (`NullValue`) appear in the **"Uncategorized"**
      column when `showUncategorized` is `true`, otherwise hidden
- [ ] Empty columns (no matching cards) shown or hidden based on `showEmptyColumns`

---

#### Part IV: Card Movement (Writing Property Values)

- [ ] Create `cardPropertyDragMachine` (`src/machines/cardPropertyDragMachine.ts`)
      — a new XState machine mirroring `cardDragMachine`'s states
      (`idle → dragging`) and events (`DRAG_START`, `DRAG_OVER`, `DROP`,
      `CANCEL`) but with property-write semantics on `DROP` instead of
      `app.vault.rename()`. Context: `{ filePath, sourceColumn, targetColumn,
      groupByProperty }` where columns are string property values (or `null` for
      Uncategorized) and `groupByProperty` is the raw frontmatter key derived by
      stripping the `note.` prefix from `(this.config as any).groupBy.property`
      (e.g. `"note.Status"` → `"Status"`) — passed in at `DRAG_START`.
  - **Regular column → regular column**: write the target column's string value
    to `groupByProperty` in the note's frontmatter, replacing the previous value
  - **Uncategorized → regular column**: write the target column's string value
    to `groupByProperty` (property was previously absent or empty)
  - **Regular column → Uncategorized column**: delete the `groupByProperty` key
    from the note's frontmatter entirely
  - **Uncategorized → Uncategorized**: no-op
  - Note: gating whether the Uncategorized column accepts drops (based on
    `showUncategorized` / `showEmptyColumns`) is handled in the render layer by
    not rendering it as a drop target — the machine itself does not enforce this
- [ ] Property writes use `app.fileManager.processFrontMatter()` to update the
      note's frontmatter without clobbering other fields
- [ ] After a property write, the base query re-runs reactively and the board
      updates (same pattern as the folder view's vault rename)

---

#### Part V: Column Management

**Creating cards**
- [ ] Each column has an inline "add card" button at the bottom (same as the
      folder view). When the user confirms a card name, a new note is created and
      the group-by property is written to its frontmatter with the column's string
      value. The card appears in the column reactively once the base query
      re-runs.
- [ ] Cards created in the **Uncategorized column** are created with no property
      value set — the group-by property key is omitted from frontmatter entirely,
      leaving the card uncategorized.
- [ ] The built-in Obsidian "+" button creates a new note in the column specified
      by `defaultColumn` (pre-populating its property value). If `defaultColumn`
      is unset, the first column in display order is used. If the first column is
      Uncategorized, the note is created with no property value. The view settings
      panel exposes a **"Default column"** dropdown listing all current column
      names (including Uncategorized) so the user can change this.

**Creating columns**
- [ ] The "Add column" button prompts for a column name (value string). The new
      value is appended to `userDefinedColumns` in the view config and immediately
      appears as an (initially empty) column on the board. No file changes occur
      at creation time — the value becomes available as a property value when a
      card is dragged into or created within the column
- [ ] A randomly selected default icon is assigned to the new column (same logic
      as the folder view)

**Renaming columns**
- [ ] Renaming a column writes the new string value to the group-by property on
      every card in that column via `app.fileManager.processFrontMatter()`, then
      updates the column's key in `columnOrder`, `columnIcons`, `columnStates`,
      and `userDefinedColumns`. Obsidian's property option suggestions are derived
      dynamically from values present on notes, so no separate registry update is
      needed.
- [ ] If the renamed column is the current `defaultColumn`, update `defaultColumn`
      to the new name.

**Removing columns**
- [ ] If the column is empty, remove it from `columnOrder`, `columnIcons`,
      `columnStates`, and `userDefinedColumns` — the user explicitly chose to
      delete it
- [ ] If the column has cards, show a modal to choose a target column to move
      them to (same pattern as the folder view's remove-column modal) — moving
      here means writing the target column's string value to the group-by property
      on each affected card via `app.fileManager.processFrontMatter()`.
- [ ] If the removed column is the current `defaultColumn`, clear `defaultColumn`
      so it falls back to the first column in display order.

**Ordering & icons**
- [ ] Column drag-to-reorder and icon assignment work identically to the folder
      view, persisted via `columnOrder` and `columnIcons`

**Collapse / expand**
- [ ] Column collapse/expand works identically to the folder view, persisted via
      `columnStates`

**Card context menu**
- [ ] Each card's ellipsis context menu (rename, delete, open, open in new tab)
      is inherited unchanged from Phase VII — cards are still notes and all note
      operations apply regardless of which kanban view type is active.

---

#### Part VI: Tests & Stories

- [x] **Research spike**: ✅ `groupBy.property` is accessible at runtime (see Part III findings).
- [ ] Vitest unit tests for `deriveColumnsFromGroupedData` covering: groups from
      string-value keys, merge of `userDefinedColumns`, empty columns, null-key
      (Uncategorized) group, unsupported key type detection
- [ ] Vitest unit tests for `cardPropertyDragMachine` covering: regular→regular
      (value replaced), Uncategorized→regular (value written), regular→Uncategorized
      (property key deleted), Uncategorized→Uncategorized (no-op), cancel returns
      to idle with no write
- [ ] Vitest unit tests for rename-column logic: value updated across all
      affected cards, `defaultColumn` updated when renamed column was the default
- [ ] Vitest unit tests for remove-column logic: `defaultColumn` cleared when
      removed column was the default
- [ ] Storybook stories for: no group-by configured (prompt state), unsupported
      field type (error state), board with status columns, Uncategorized column
      visible, empty columns shown/hidden
- [ ] Manual end-to-end tests: drag card between status columns (verify frontmatter
      updated), drag card to Uncategorized (verify property key removed), drag
      from Uncategorized to column (verify property written), create card in column
      (verify frontmatter pre-populated), create card in Uncategorized (verify
      property key absent), use "+" button with default column set (verify correct
      column targeted), create column before any cards then create a card in it,
      verify user-defined column persists when emptied, rename column (verify
      frontmatter updated across all affected cards), remove non-empty column,
      set group-by to an unsupported type (verify friendly error shown)

