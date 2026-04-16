import type { BasesEntry, BasesEntryGroup, Value } from 'obsidian'
import { MockNullValue } from './aValue'

export class MockBasesEntryGroup implements BasesEntryGroup {
	constructor(
		public key: Value | undefined,
		public entries: BasesEntry[],
	) {}

	hasKey(): boolean {
		return this.key !== undefined && !(this.key instanceof MockNullValue)
	}
}

export function aBasesEntryGroup(
	key: Value | undefined,
	entries: BasesEntry[] = [],
): BasesEntryGroup {
	return new MockBasesEntryGroup(key, entries)
}
