---
name: using-obsidian-api
description: "Reference for interacting with the Obsidian Bases API in this plugin"
---

## Obsidian Bases API

### Main types

- `BasesEntry`: Represents a note/entry with properties
- `BasesViewConfig`: View configuration (user options)
- `BasesPropertyId`: Property identifier (string)
- `App`: Obsidian application instance
- `TFile`: Obsidian file

### View registration

```typescript
import { requireApiVersion } from 'obsidian';

// Requires Obsidian 1.10.1+ (public Bases API)
if (requireApiVersion('1.10.1')) {
  this.registerBasesView({
    id: 'kanban-base',
    name: 'Kanban',
    icon: 'lucide-layout-kanban',
    factory: (controller, containerEl) => new KanbanView(controller, containerEl),
    options: () => [/* ViewOption[] */],
  });
}
```

### View class

```typescript
import { BasesView } from 'obsidian';
import { mount, unmount } from 'svelte';
import Component from './Component.svelte';

export class KanbanView extends BasesView {
  private component: ReturnType<typeof mount> | null = null;

  constructor(controller: unknown, containerEl: HTMLElement) {
    super(controller);
    this.component = mount(Component, {
      target: containerEl,
      props: { app: this.app, config: this.config, data: this.data },
    });
  }

  onDataUpdated() {
    // called when base query results change — update Svelte props
  }

  onunload() {
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
  }
}
```

### Data access

```typescript
// Get property value from an entry
const value = entry.getValue(propertyId); // returns Value

// Get string representation
const str = value.toString();

// Get property display name
const displayName = config.getDisplayName(propertyId);

// Get a config option value
const props = config.get('cardProperties');
```

### Vault operations

```typescript
// Move a file (drag card between columns)
await app.vault.rename(file, newPath);

// Create a new note
await app.vault.create(path, '');

// Create a folder (new column)
await app.vault.createFolder(path);
```

### Folder structure

```typescript
import type { TFolder } from 'obsidian';

// Get immediate child folders only (subfolders are ignored — they host nested kanbans)
function getImmediateChildFolders(parent: TFolder): TFolder[] {
  return parent.children.filter((child): child is TFolder => child instanceof TFolder);
}
```

### Mocks (Storybook / tests)

`src/__mocks__/obsidian.ts` is aliased over the real `'obsidian'` package in
Storybook via `viteFinal` in `.storybook/main.ts`.

Helper factories:

```typescript
import { aFile } from 'src/__mocks__/aFile';
import { aBasesEntry } from 'src/__mocks__/aBasesEntry';
import { aValue } from 'src/__mocks__/aValue';
import { createMockApp } from 'src/__mocks__/create-mock-app';
```
