import { describe, expect, it } from 'vitest'
import { aBasesEntry } from '../../__mocks__/aBasesEntry'
import { aBasesEntryGroup } from '../../__mocks__/aBasesEntryGroup'
import {
	MockBooleanValue,
	MockNumberValue,
	MockStringValue,
} from '../../__mocks__/aValue'
import { deriveColumnsFromGroupedData } from './deriveColumnsFromGroupedData'

// Helpers
const keyedGroup = (label: string, count = 0) =>
	aBasesEntryGroup(
		new MockStringValue(label),
		Array.from({ length: count }, () => aBasesEntry()),
	)

const unkeyedGroup = (count = 0) =>
	aBasesEntryGroup(
		undefined,
		Array.from({ length: count }, () => aBasesEntry()),
	)

describe('deriveColumnsFromGroupedData', () => {
	// -----------------------------------------------------------------------
	describe('no-group-by detection', () => {
		it('returns no-group-by for an empty groups array', () => {
			expect(deriveColumnsFromGroupedData([], [])).toEqual({ kind: 'no-group-by' })
		})

		it('returns no-group-by when the only group has hasKey() === false', () => {
			expect(deriveColumnsFromGroupedData([unkeyedGroup(5)], [])).toEqual({
				kind: 'no-group-by',
			})
		})

		it('returns no-group-by when all groups have hasKey() === false', () => {
			expect(
				deriveColumnsFromGroupedData([unkeyedGroup(3), unkeyedGroup(2)], []),
			).toEqual({ kind: 'no-group-by' })
		})

		it('returns columns (not no-group-by) when groupByConfigured=true even if all groups are keyless', () => {
			// Group-by IS set in config but no notes have that property value yet.
			// Should show a board (with Uncategorized) rather than the prompt.
			const result = deriveColumnsFromGroupedData([unkeyedGroup(0)], [], true)
			expect(result.kind).toBe('columns')
			if (result.kind !== 'columns') return
			// No named columns
			expect(result.columns.filter(c => !c.isUncategorized)).toHaveLength(0)
		})

		it('places keyless entries in Uncategorized when groupByConfigured=true and all notes are uncategorized', () => {
			const e1 = aBasesEntry()
			const e2 = aBasesEntry()
			const result = deriveColumnsFromGroupedData(
				[aBasesEntryGroup(undefined, [e1, e2])],
				[],
				true,
			)
			expect(result.kind).toBe('columns')
			if (result.kind !== 'columns') return
			const uncat = result.columns.find(c => c.isUncategorized)
			expect(uncat).toBeDefined()
			expect(uncat?.entries).toContain(e1)
			expect(uncat?.entries).toContain(e2)
		})
	})

	// -----------------------------------------------------------------------
	describe('unsupported-type detection', () => {
		it('returns unsupported-type for a NumberValue key', () => {
			const group = aBasesEntryGroup(new MockNumberValue(42), [aBasesEntry()])
			expect(deriveColumnsFromGroupedData([group], [])).toEqual({
				kind: 'unsupported-type',
			})
		})

		it('returns unsupported-type for a BooleanValue key', () => {
			const group = aBasesEntryGroup(new MockBooleanValue(true), [aBasesEntry()])
			expect(deriveColumnsFromGroupedData([group], [])).toEqual({
				kind: 'unsupported-type',
			})
		})

		it('does NOT return unsupported-type for a StringValue key', () => {
			const result = deriveColumnsFromGroupedData([keyedGroup('Todo', 1)], [])
			expect(result.kind).toBe('columns')
		})
	})

	// -----------------------------------------------------------------------
	describe('named columns', () => {
		it('produces one column per keyed group', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 2), keyedGroup('Done', 1)],
				[],
			)
			expect(result.kind).toBe('columns')
			if (result.kind !== 'columns') return
			const names = result.columns.map(c => c.name)
			expect(names).toContain('Todo')
			expect(names).toContain('Done')
		})

		it('assigns entries to the correct column', () => {
			const entry1 = aBasesEntry()
			const entry2 = aBasesEntry()
			const result = deriveColumnsFromGroupedData(
				[
					aBasesEntryGroup(new MockStringValue('Todo'), [entry1]),
					aBasesEntryGroup(new MockStringValue('Done'), [entry2]),
				],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const todo = result.columns.find(c => c.name === 'Todo')!
			const done = result.columns.find(c => c.name === 'Done')!
			expect(todo.entries).toEqual([entry1])
			expect(done.entries).toEqual([entry2])
		})

		it('preserves API group order for named columns', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('C'), keyedGroup('A'), keyedGroup('B')],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const names = result.columns.map(c => c.name)
			expect(names[0]).toBe('C')
			expect(names[1]).toBe('A')
			expect(names[2]).toBe('B')
		})

		it('sets isUncategorized to false on named columns', () => {
			const result = deriveColumnsFromGroupedData([keyedGroup('Todo')], [])
			if (result.kind !== 'columns') throw new Error('expected columns')
			expect(result.columns.find(c => c.name === 'Todo')?.isUncategorized).toBe(false)
		})
	})

	// -----------------------------------------------------------------------
	describe('uncategorized column', () => {
		it('includes an Uncategorized column when a keyless group exists', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 1), unkeyedGroup(2)],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const uncat = result.columns.find(c => c.isUncategorized)
			expect(uncat).toBeDefined()
			expect(uncat?.name).toBe('Uncategorized')
		})

		it('merges entries from multiple keyless groups into one Uncategorized column', () => {
			const e1 = aBasesEntry()
			const e2 = aBasesEntry()
			const e3 = aBasesEntry()
			const result = deriveColumnsFromGroupedData(
				[
					keyedGroup('Todo', 0),
					aBasesEntryGroup(undefined, [e1, e2]),
					aBasesEntryGroup(undefined, [e3]),
				],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const uncat = result.columns.find(c => c.isUncategorized)!
			expect(uncat.entries).toHaveLength(3)
			expect(uncat.entries).toContain(e1)
			expect(uncat.entries).toContain(e2)
			expect(uncat.entries).toContain(e3)
		})

		it('does not include an Uncategorized column when no keyless groups exist', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 1), keyedGroup('Done', 0)],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			expect(result.columns.find(c => c.isUncategorized)).toBeUndefined()
		})

		it('places Uncategorized last in the column array', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 1), unkeyedGroup(1)],
				[],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const last = result.columns[result.columns.length - 1]
			expect(last?.isUncategorized).toBe(true)
		})
	})

	// -----------------------------------------------------------------------
	describe('userDefinedColumns merging', () => {
		it('adds a user-defined column not present in any group', () => {
			const result = deriveColumnsFromGroupedData([keyedGroup('Todo', 1)], ['Done'])
			if (result.kind !== 'columns') throw new Error('expected columns')
			const done = result.columns.find(c => c.name === 'Done')
			expect(done).toBeDefined()
			expect(done?.entries).toHaveLength(0)
			expect(done?.isUncategorized).toBe(false)
		})

		it('does not duplicate a user-defined column that already has a group', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 1)],
				['Todo'],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			expect(result.columns.filter(c => c.name === 'Todo')).toHaveLength(1)
		})

		it('produces no extra columns when userDefinedColumns is empty', () => {
			const result = deriveColumnsFromGroupedData([keyedGroup('Todo', 1)], [])
			if (result.kind !== 'columns') throw new Error('expected columns')
			expect(result.columns).toHaveLength(1)
		})

		it('places user-defined extras after named columns and before Uncategorized', () => {
			const result = deriveColumnsFromGroupedData(
				[keyedGroup('Todo', 1), unkeyedGroup(1)],
				['Review'],
			)
			if (result.kind !== 'columns') throw new Error('expected columns')
			const names = result.columns.map(c => c.name)
			expect(names.indexOf('Todo')).toBeLessThan(names.indexOf('Review'))
			expect(names.indexOf('Review')).toBeLessThan(names.indexOf('Uncategorized'))
		})
	})
})
