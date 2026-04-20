import { describe, expect, it, vi } from 'vitest'
import type { BasesEntryGroup } from 'obsidian'
import { KanbanPropertyView } from './KanbanPropertyView'
import { aBasesEntry } from '../../__mocks__/aBasesEntry'
import { aBasesEntryGroup } from '../../__mocks__/aBasesEntryGroup'
import { aFile } from '../../__mocks__/aFile'
import { MockNullValue, MockStringValue } from '../../__mocks__/aValue'
import { createMockApp } from '../../__mocks__/create-mock-app'

function makeView({
	groupedData = [] as BasesEntryGroup[],
	userDefinedColumns = [] as string[],
} = {}) {
	const configStorage: Record<string, unknown> = {
		userDefinedColumns: JSON.stringify(userDefinedColumns),
	}

	const processFrontMatter = vi.fn()

	const mockController = {
		config: {
			get: (key: string) => configStorage[key] ?? null,
			set: (key: string, value: unknown) => {
				configStorage[key] = value
			},
			getOrder: () => [],
		},
		data: { entries: [], groupedData },
	}

	const app = createMockApp({
		fileManager: { processFrontMatter } as never,
	})

	const view = new KanbanPropertyView(
		mockController as never,
		document.createElement('div'),
		app,
	)
	;(view as never as { groupByPropertyKey: string }).groupByPropertyKey =
		'Status'

	return { view, configStorage, processFrontMatter }
}

/** Invoke the frontmatter processor captured in a mock.calls entry and return the mutated object. */
function applyProcessor(
	mockFn: ReturnType<typeof vi.fn>,
	callIndex: number,
	initial: Record<string, unknown> = {},
): Record<string, unknown> {
	const processor = mockFn.mock.calls[callIndex]![1] as (
		fm: Record<string, unknown>,
	) => void
	processor(initial)
	return initial
}

// ─── renameColumn ─────────────────────────────────────────────────────────────

describe('KanbanPropertyView.renameColumn', () => {
	it('writes new property value to every card in the column', async () => {
		const file1 = aFile({ path: 'notes/card1.md' })
		const file2 = aFile({ path: 'notes/card2.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file: file1 }),
				aBasesEntry({ file: file2 }),
			]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.renameColumn('Todo', 'In Progress')

		expect(processFrontMatter).toHaveBeenCalledTimes(2)
		expect(processFrontMatter.mock.calls[0]![0]).toBe(file1)
		expect(processFrontMatter.mock.calls[1]![0]).toBe(file2)

		expect(applyProcessor(processFrontMatter, 0)).toEqual({
			Status: 'In Progress',
		})
		expect(applyProcessor(processFrontMatter, 1)).toEqual({
			Status: 'In Progress',
		})
	})

	it('does not write to cards in other columns', async () => {
		const file1 = aFile({ path: 'notes/card1.md' })
		const file2 = aFile({ path: 'notes/card2.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file: file1 }),
			]),
			aBasesEntryGroup(new MockStringValue('Done'), [
				aBasesEntry({ file: file2 }),
			]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.renameColumn('Todo', 'In Progress')

		expect(processFrontMatter).toHaveBeenCalledTimes(1)
		expect(processFrontMatter.mock.calls[0]![0]).toBe(file1)
	})

	it('does not write to cards when renaming the Uncategorized column', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockNullValue(), [aBasesEntry({ file })]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.renameColumn('Uncategorized', 'New Name')

		expect(processFrontMatter).not.toHaveBeenCalled()
	})

	it('updates userDefinedColumns when renamed column was user-defined', async () => {
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), []),
		]

		const { view, configStorage } = makeView({
			groupedData,
			userDefinedColumns: ['Todo', 'Done'],
		})
		await view.renameColumn('Todo', 'In Progress')

		const updated = JSON.parse(
			configStorage['userDefinedColumns'] as string,
		) as string[]
		expect(updated).toContain('In Progress')
		expect(updated).not.toContain('Todo')
		expect(updated).toContain('Done')
	})

	it('does not modify userDefinedColumns when renamed column was not user-defined', async () => {
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), []),
		]

		const { view, configStorage } = makeView({
			groupedData,
			userDefinedColumns: ['Done'],
		})
		await view.renameColumn('Todo', 'In Progress')

		const updated = JSON.parse(
			configStorage['userDefinedColumns'] as string,
		) as string[]
		expect(updated).toEqual(['Done'])
	})

	it('is a no-op when new name is empty', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file }),
			]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.renameColumn('Todo', '   ')

		expect(processFrontMatter).not.toHaveBeenCalled()
	})

	it('is a no-op when new name equals the old name', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file }),
			]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.renameColumn('Todo', 'Todo')

		expect(processFrontMatter).not.toHaveBeenCalled()
	})
})

// ─── removeColumn ─────────────────────────────────────────────────────────────

describe('KanbanPropertyView.removeColumn', () => {
	it('moves all cards to the target column by writing the new value', async () => {
		const file1 = aFile({ path: 'notes/card1.md' })
		const file2 = aFile({ path: 'notes/card2.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file: file1 }),
				aBasesEntry({ file: file2 }),
			]),
			aBasesEntryGroup(new MockStringValue('Done'), []),
		]

		const { view, processFrontMatter } = makeView({
			groupedData,
			userDefinedColumns: ['Todo', 'Done'],
		})
		await view.removeColumn('Todo', 'Done')

		expect(processFrontMatter).toHaveBeenCalledTimes(2)
		expect(applyProcessor(processFrontMatter, 0)).toEqual({ Status: 'Done' })
		expect(applyProcessor(processFrontMatter, 1)).toEqual({ Status: 'Done' })
	})

	it('deletes property key when moving cards to Uncategorized', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file }),
			]),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.removeColumn('Todo', 'Uncategorized')

		expect(processFrontMatter).toHaveBeenCalledTimes(1)
		const fm = applyProcessor(processFrontMatter, 0, { Status: 'Todo' })
		expect('Status' in fm).toBe(false)
	})

	it('removes the column from userDefinedColumns', async () => {
		const { view, configStorage } = makeView({
			userDefinedColumns: ['Todo', 'Done', 'Review'],
		})
		await view.removeColumn('Done')

		const updated = JSON.parse(
			configStorage['userDefinedColumns'] as string,
		) as string[]
		expect(updated).not.toContain('Done')
		expect(updated).toContain('Todo')
		expect(updated).toContain('Review')
	})

	it('does not call processFrontMatter when no target column is given', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockStringValue('Todo'), [
				aBasesEntry({ file }),
			]),
		]

		const { view, processFrontMatter } = makeView({
			groupedData,
			userDefinedColumns: ['Todo'],
		})
		await view.removeColumn('Todo')

		expect(processFrontMatter).not.toHaveBeenCalled()
	})

	it('moves cards from the Uncategorized column to a regular column', async () => {
		const file = aFile({ path: 'notes/card.md' })
		const groupedData = [
			aBasesEntryGroup(new MockNullValue(), [aBasesEntry({ file })]),
			aBasesEntryGroup(new MockStringValue('Done'), []),
		]

		const { view, processFrontMatter } = makeView({ groupedData })
		await view.removeColumn('Uncategorized', 'Done')

		expect(processFrontMatter).toHaveBeenCalledTimes(1)
		expect(applyProcessor(processFrontMatter, 0)).toEqual({ Status: 'Done' })
	})
})
