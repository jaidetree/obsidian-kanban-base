import type { TFile } from "obsidian";

export class MockTFile {
  vault: unknown = null;
  basename: string = '';
  path: string = '';
  extension: string = '';
  name: string = '';
  parent: unknown = null;
  stat = { ctime: 0, mtime: 0, size: 0 };
  content?: string;

  constructor(overrides: Partial<TFile> & { content?: string } = {}) {
    Object.assign(this, overrides);
  }
}

export const aFile = (
  overrides: Partial<TFile> & { content?: string } = {},
): TFile => {
  const basename = overrides.basename ?? 'test';
  const extension = overrides.extension ?? 'md';
  const path = overrides.path ?? `${basename}.${extension}`;
  const name = overrides.name ?? `${basename}.${extension}`;
  return new MockTFile({ ...overrides, basename, path, extension, name }) as unknown as TFile;
};
