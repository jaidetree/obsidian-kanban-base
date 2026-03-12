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

- [x] Discuss and plan a solution — chose explicit `FolderOption` (`columnRoot`) with inline empty-board prompt
- [x] Register `columnRoot` as a `FolderOption` in `KANBAN_OPTIONS` (`index.ts`)
- [x] Add `deriveColumnsFromRoot(root, entries)` pure function — seeds columns from all direct subfolders of root, assigns entries by parent path
- [x] Modify `onDataUpdated` to resolve `columnRoot` config → call `deriveColumnsFromRoot`; show inline prompt when unset or folder deleted
- [x] Fix `handleCardDrop`, `handleRenameColumn`, `handleAddColumn` to use `columnRootFolder` instead of re-deriving from entries
- [x] Create `FolderSuggestModal` (patterned on `IconSuggestModal`) for folder picker
- [x] Add empty-board prompt UI to `KanbanBoard` when `columnRootSet` is false
- [x] Add `deriveColumnsFromRoot` vitest suite (5 cases); update `create-mock-app` with `getFolderByPath`/`getAllFolders` stubs
- [x] Add `NoRootConfigured` Storybook story to `KanbanBoard.stories.tsx`

#### General Cleanup

- [x] Fix column header content alignment
- [ ] Improve Add column button styles
- [ ] Move add column logic into state machine
- [ ] Move column state machines into machines/ directory

### Phase VIII: Properties

Render selected properties from the base menu bar on each card.

### Phase IX: Group By Version
