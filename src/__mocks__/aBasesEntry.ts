import type { BasesEntry, TFile } from "obsidian";

import { aFile } from "./aFile";
import { aValue } from "./aValue";

export class MockBasesEntry implements BasesEntry {
  constructor(
    public readonly file: TFile,
    private readonly _frontmatter: Record<string, unknown>,
    _overrides?: Partial<BasesEntry>,
  ) {
    Object.assign(this, _overrides);
  }

  getValue(propertyId: string) {
    const [source, property] = propertyId.split('.') as [string, string];

    if (source === 'file') {
      if (property === 'name') return aValue(this.file.basename);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return aValue((this.file as any)[property]);
    }

    return aValue(this._frontmatter[property]);
  }
}

export const aBasesEntry = (
  overrides: Partial<BasesEntry> = {},
  fm: Record<string, unknown> = {},
): BasesEntry => {
  return new MockBasesEntry(
    overrides.file ?? aFile(),
    fm,
    overrides,
  );
};
