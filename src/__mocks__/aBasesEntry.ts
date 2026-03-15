import type { BasesEntry, TFile } from "obsidian";

import { aFile } from "./aFile";
import { aValue, aTagValue, MockListValue } from "./aValue";

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
      return aValue((this.file as unknown as Record<string, unknown>)[property]);
    }

    const raw = this._frontmatter[property];
    if (property === 'tags' && Array.isArray(raw)) {
      return new MockListValue(raw.map(t => aTagValue(String(t))));
    }
    return aValue(raw);
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
