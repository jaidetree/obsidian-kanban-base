/**
 * Mock of the obsidian package for Storybook.
 *
 * Provides mock implementations of runtime classes/functions while
 * re-exporting types from the real package (TypeScript strips these at compile time).
 */

export type {
  App,
  BasesPropertyId,
  BasesQueryResult,
  BasesViewConfig,
  BasesViewFactory,
  Component,
  FrontMatterCache,
  GroupOption,
  Plugin,
  QueryController,
  RenderContext,
  Value,
  ViewOption,
} from 'obsidian';

export { MockBooleanValue as BooleanValue, MockListValue as ListValue, MockNullValue as NullValue, MockNumberValue as NumberValue, MockStringValue as StringValue, MockTagValue as TagValue } from './aValue';
export type { BooleanValue as BooleanValueType, ListValue as ListValueType, NullValue as NullValueType, NumberValue as NumberValueType, StringValue as StringValueType } from 'obsidian';

export { MockTFile as TFile } from './aFile';
export type { TFile as TFileType } from 'obsidian';

export { MockBasesEntry as BasesEntry } from './aBasesEntry';
export type { BasesEntry as BasesEntryType } from 'obsidian';

import { createMockApp } from "./create-mock-app";

export class Platform {
  static isMobile = false;
}

interface MockController {
  app?: ReturnType<typeof createMockApp>;
  config?: { get: (key: string) => unknown };
  data?: { entries: unknown[]; groupedData: unknown[] };
}

// Mocked BasesView base class
export class BasesView {
  app: ReturnType<typeof createMockApp>;
  config: { get: (key: string) => unknown };
  data: { entries: unknown[]; groupedData: unknown[] };
  containerEl: HTMLElement;

  constructor(controller?: MockController) {
    this.app = controller?.app ?? createMockApp();
    this.config = controller?.config ?? { get: (_key: string) => null };
    this.data = controller?.data ?? { entries: [], groupedData: [] };
    this.containerEl = document.createElement('div');
  }

  onDataUpdated(): void {}
  onunload(): void {}
}

export type { BasesView as BasesViewType } from 'obsidian';

export const normalizePath = (path: string): string => path.replace(/\\/g, '/');

export const Keymap = {
  isModEvent: (evt: MouseEvent | KeyboardEvent): boolean =>
    evt.ctrlKey || evt.metaKey || evt.altKey || evt.shiftKey,
};

export const MarkdownRenderer = {
  render: async (
    _app: unknown,
    markdown: string,
    el: HTMLElement,
    _sourcePath: string,
    _component: unknown,
  ): Promise<void> => {
    el.textContent = markdown;
  },
};

export const setIcon = (el: HTMLElement, name: string): void => {
  el.setAttribute('data-icon', name);
  el.textContent = name;
};

export const getIconIds = (): string[] => [
  'folder', 'check', 'circle', 'star', 'heart', 'home', 'list', 'tag',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class FuzzySuggestModal<T> {
  setPlaceholder(_s: string) {}
  open() {}
  onClose: () => void = () => {};
}

class MockMenuItem {
  setTitle(_s: string) { return this; }
  setIcon(_s: string) { return this; }
  onClick(cb: () => void) { void cb; return this; }
}

export class Menu {
  addItem(cb: (item: MockMenuItem) => void) { cb(new MockMenuItem()); return this; }
  showAtMouseEvent(_evt: MouseEvent) { return this; }
  showAtPosition(_pos: { x: number; y: number }) { return this; }
}

export class Modal {
  contentEl: HTMLElement;
  constructor(_app: unknown) {
    this.contentEl = document.createElement('div');
  }
  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export const openExternal = (url: string): void => {
  window.open(url, '_blank');
};
