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

export { MockBooleanValue as BooleanValue, MockListValue as ListValue, MockNullValue as NullValue, MockNumberValue as NumberValue, MockStringValue as StringValue } from './aValue';
export type { BooleanValue as BooleanValueType, ListValue as ListValueType, NullValue as NullValueType, NumberValue as NumberValueType, StringValue as StringValueType } from 'obsidian';

export { MockTFile as TFile } from './aFile';
export type { TFile as TFileType } from 'obsidian';

export { MockBasesEntry as BasesEntry } from './aBasesEntry';
export type { BasesEntry as BasesEntryType } from 'obsidian';

import { createMockApp } from "./create-mock-app";

export class Platform {
  static isMobile = false;
}

// Mocked BasesView base class
export class BasesView {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  containerEl: HTMLElement;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(controller: any) {
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

export const openExternal = (url: string): void => {
  window.open(url, '_blank');
};
