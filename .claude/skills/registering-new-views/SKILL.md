---
name: registering-new-views
description: Guide for creating and registering a new Bases view in this plugin (Svelte-based).
---

# Creating a New Bases View

## Process Overview

```
Discovery → Confirmation → Generation → Verification
```

---

## Phase 1: Discovery

### Always ask

1. **Name**: What should this view be called?
   - Derive: `id` (kebab-case), `ViewName` (PascalCase), filenames

2. **Purpose**: What does it do in one sentence?

3. **Icon**: What lucide icon represents it? (`lucide-{icon-name}`)

### Adaptive questions

4. **Properties**: What entry properties does it display?
5. **Layout**: Should column count / size / gap be configurable?
6. **Interaction**: Are cards clickable? Does it need drag state?
7. **Options**: Any other user-configurable settings?

---

## Phase 2: Confirmation

Present this summary before generating:

```markdown
## View Summary

**Name**: {ViewName}
**ID**: {view-id}
**Icon**: lucide-{icon}
**Description**: {description}

**Files to generate**:
- src/views/{ViewName}/index.ts
- src/views/{ViewName}/{ViewName}View.ts       ← BasesView subclass
- src/views/{ViewName}/{ViewName}View.svelte   ← Svelte component
- src/views/{ViewName}/{ViewName}View.stories.svelte
- src/views/{ViewName}/__fixtures__/configs.ts
- (Optional) src/views/{ViewName}/types.ts

**Configuration options**:
| Option | Type | Default |
|--------|------|---------|

Proceed to generate?
```

---

## Phase 3: Generation

### 1. `src/views/{ViewName}/index.ts`

```typescript
import type { BasesViewFactory, ViewOption } from 'obsidian';
import { {ViewName}View } from './{ViewName}View';

export const {VIEW_NAME}_ID = '{view-id}';

export const {VIEW_NAME}_FACTORY: BasesViewFactory = (controller, containerEl) =>
  new {ViewName}View(controller, containerEl);

export const {VIEW_NAME}_OPTIONS = (): ViewOption[] => [
  {
    type: 'group',
    displayName: 'Display',
    items: [
      // options go here
    ],
  },
];
```

### 2. `src/views/{ViewName}/{ViewName}View.ts`

```typescript
import { BasesView } from 'obsidian';
import { mount, unmount } from 'svelte';
import Component from './{ViewName}View.svelte';

export class {ViewName}View extends BasesView {
  private component: ReturnType<typeof mount> | null = null;

  constructor(controller: unknown, containerEl: HTMLElement) {
    super(controller);
    this.component = mount(Component, {
      target: containerEl,
      props: {
        app: this.app,
        config: this.config,
        data: this.data,
      },
    });
  }

  onDataUpdated() {
    // Svelte reactivity handles prop updates
  }

  onunload() {
    if (this.component) {
      unmount(this.component);
      this.component = null;
    }
  }
}
```

### 3. `src/views/{ViewName}/{ViewName}View.svelte`

```svelte
<script lang="ts">
  import type { App, BasesViewConfig } from 'obsidian';

  interface Props {
    app: App;
    config: BasesViewConfig;
    data: { entries: unknown[]; groupedData: unknown[] };
  }

  const { app, config, data }: Props = $props();
</script>

<div class="{view-id}-view">
  <!-- view content -->
</div>

<style>
  .{view-id}-view {
    /* use Obsidian CSS variables, e.g. var(--background-primary) */
  }
</style>
```

### 4. `src/views/{ViewName}/{ViewName}View.stories.svelte`

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { aBasesEntry } from 'src/__mocks__/aBasesEntry';
  import { createMockApp } from 'src/__mocks__/create-mock-app';
  import {ViewName}View from './{ViewName}View.svelte';

  const { Story } = defineMeta({
    title: 'Views/{Display Name}',
    component: {ViewName}View,
    tags: ['autodocs'],
    args: {
      app: createMockApp(),
      config: { get: () => null, getDisplayName: () => '' },
      data: {
        entries: [aBasesEntry({}, { title: 'Note 1' })],
        groupedData: [],
      },
    },
  });
</script>

<Story name="Default" />

<Story name="Full" args={{ /* override args */ }} />
```

### 5. `src/views/{ViewName}/__fixtures__/configs.ts`

```typescript
export const DEFAULT_CONFIG = {
  // minimal / most common defaults
};

export const FULL_CONFIG = {
  ...DEFAULT_CONFIG,
  // all options explicitly set
};
```

### 6. Register in `src/main.ts`

```typescript
import { requireApiVersion } from 'obsidian';
import { {VIEW_NAME}_ID, {VIEW_NAME}_FACTORY, {VIEW_NAME}_OPTIONS } from './views/{ViewName}';

// inside onload():
if (requireApiVersion('1.10.1')) {
  this.registerBasesView({
    id: {VIEW_NAME}_ID,
    name: '{Display Name}',
    icon: 'lucide-{icon}',
    factory: {VIEW_NAME}_FACTORY,
    options: {VIEW_NAME}_OPTIONS,
  });
}
```

---

## Phase 4: Verification

```
├── src/views/{ViewName}/index.ts                  ✓ exports id, factory, options
├── src/views/{ViewName}/{ViewName}View.ts          ✓ extends BasesView, mounts/unmounts Svelte
├── src/views/{ViewName}/{ViewName}View.svelte      ✓ uses $props(), Obsidian CSS vars
├── src/views/{ViewName}/{ViewName}View.stories.svelte ✓ uses defineMeta, createMockApp
├── src/views/{ViewName}/__fixtures__/configs.ts   ✓ exports DEFAULT_CONFIG, FULL_CONFIG
└── src/main.ts                                    ✓ registers view with requireApiVersion guard
```

---

## View Options Reference

| Type        | Key properties                                                                    |
|-------------|-----------------------------------------------------------------------------------|
| `text`      | `displayName`, `key`, `default`, `placeholder?`                                   |
| `dropdown`  | `displayName`, `key`, `default`, `options: Record<string,string>`, `shouldHide?`  |
| `slider`    | `displayName`, `key`, `default`, `min`, `max`, `step`, `shouldHide?`              |
| `toggle`    | `displayName`, `key`, `default`, `shouldHide?`                                    |
| `property`  | `displayName`, `key`, `default`, `shouldHide?`                                    |
| `multitext` | `displayName`, `key`, `default`, `shouldHide?`                                    |
| `group`     | `displayName`, `items: ViewOption[]`, `shouldHide?`                               |

### Conditional visibility example

```typescript
{
  type: 'dropdown',
  displayName: 'Content Visibility',
  key: 'overlayContentVisibility',
  default: 'always',
  shouldHide: (config) => config.get('layout') !== 'overlay',
  options: { always: 'Always', hover: 'On Hover' },
}
```

## Story Tags Reference

| Tag              | Meaning                             |
|------------------|-------------------------------------|
| `autodocs`       | Auto-generate documentation         |
| `status:testing` | View is in testing phase            |
| `status:stable`  | View is stable and production-ready |
