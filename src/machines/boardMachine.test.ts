import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { boardMachine, reorderColumns } from './boardMachine'
import type { ColumnRecord } from './boardMachine'

function rec(name: string, overrides: Partial<ColumnRecord> = {}): ColumnRecord {
	return { name, icon: null, isCollapsed: false, ...overrides }
}

const defaultInput = {
	columns: [rec('A'), rec('B'), rec('C')],
}

describe('reorderColumns', () => {
	it('moves item forward', () => {
		const cols = [rec('A'), rec('B'), rec('C')]
		const result = reorderColumns(cols, 0, 2)
		expect(result.map(r => r.name)).toEqual(['B', 'C', 'A'])
	})

	it('moves item backward', () => {
		const cols = [rec('A'), rec('B'), rec('C')]
		const result = reorderColumns(cols, 2, 0)
		expect(result.map(r => r.name)).toEqual(['C', 'A', 'B'])
	})

	it('returns same array when from === to', () => {
		const cols = [rec('A'), rec('B'), rec('C')]
		expect(reorderColumns(cols, 1, 1)).toEqual(cols)
	})

	it('handles two-element swap', () => {
		const cols = [rec('A'), rec('B')]
		const result = reorderColumns(cols, 0, 1)
		expect(result.map(r => r.name)).toEqual(['B', 'A'])
	})
})

describe('boardMachine — drag/drop', () => {
	it('starts in idle state with provided columns', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		expect(actor.getSnapshot().value).toBe('idle')
		expect(actor.getSnapshot().context.columns.map(r => r.name)).toEqual(['A', 'B', 'C'])
		actor.stop()
	})

	it('transitions to dragging on DRAG_START and records dragIndex', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 1 })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('dragging')
		expect(snap.context.dragIndex).toBe(1)
		actor.stop()
	})

	it('updates dropIndex on DRAG_OVER', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		expect(actor.getSnapshot().context.dropIndex).toBe(2)
		actor.stop()
	})

	it('DRAG_OVER updates displayColumns to preview order', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		expect(actor.getSnapshot().context.displayColumns.map(r => r.name)).toEqual(['B', 'C', 'A'])
		actor.stop()
	})

	it('goes to idle on DROP and reorders columns', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'DROP' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.columns.map(r => r.name)).toEqual(['B', 'C', 'A'])
		expect(snap.context.displayColumns.map(r => r.name)).toEqual(['B', 'C', 'A'])
		expect(snap.context.dragIndex).toBeNull()
		expect(snap.context.dropIndex).toBeNull()
		actor.stop()
	})

	it('returns to idle on CANCEL without reordering', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'CANCEL' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.columns.map(r => r.name)).toEqual(['A', 'B', 'C'])
		expect(snap.context.displayColumns.map(r => r.name)).toEqual(['A', 'B', 'C'])
		actor.stop()
	})

	it('clears drag indices on subsequent DRAG_START', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'CANCEL' })
		actor.send({ type: 'DRAG_START', index: 1 })
		expect(actor.getSnapshot().context.dropIndex).toBeNull()
		actor.stop()
	})
})

describe('boardMachine — MERGE_COLUMNS', () => {
	it('adds new columns at end', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'MERGE_COLUMNS', folderNames: ['A', 'B', 'C', 'D'] })
		const cols = actor.getSnapshot().context.columns
		expect(cols.map(r => r.name)).toEqual(['A', 'B', 'C', 'D'])
		const colD = cols.find(r => r.name === 'D')
		expect(colD?.icon).toBeNull()
		expect(colD?.isCollapsed).toBe(false)
		actor.stop()
	})

	it('removes columns not in folderNames', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'MERGE_COLUMNS', folderNames: ['A', 'C'] })
		expect(actor.getSnapshot().context.columns.map(r => r.name)).toEqual(['A', 'C'])
		actor.stop()
	})

	it('preserves existing relative order', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		// Reorder to C, A, B
		actor.send({ type: 'DRAG_START', index: 2 })
		actor.send({ type: 'DRAG_OVER', index: 0 })
		actor.send({ type: 'DROP' })
		// Merge with same names
		actor.send({ type: 'MERGE_COLUMNS', folderNames: ['A', 'B', 'C'] })
		expect(actor.getSnapshot().context.columns.map(r => r.name)).toEqual(['C', 'A', 'B'])
		actor.stop()
	})

	it('preserves icon and isCollapsed on kept records', () => {
		const icon = { name: 'check', value: 'check', prefix: 'Li' }
		const actor = createActor(boardMachine, {
			input: {
				columns: [
					rec('A', { icon, isCollapsed: true }),
					rec('B'),
					rec('C'),
				],
			},
		})
		actor.start()
		actor.send({ type: 'MERGE_COLUMNS', folderNames: ['A', 'B', 'C'] })
		const cols = actor.getSnapshot().context.columns
		const colA = cols.find(r => r.name === 'A')
		expect(colA?.icon).toEqual(icon)
		expect(colA?.isCollapsed).toBe(true)
		actor.stop()
	})

	it('updates displayColumns alongside columns', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'MERGE_COLUMNS', folderNames: ['A', 'B'] })
		const snap = actor.getSnapshot()
		expect(snap.context.displayColumns.map(r => r.name)).toEqual(['A', 'B'])
		actor.stop()
	})
})

describe('boardMachine — RENAME_COLUMN', () => {
	it('updates name in columns and displayColumns', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'RENAME_COLUMN', oldName: 'B', newName: 'Beta' })
		const snap = actor.getSnapshot()
		expect(snap.context.columns.map(r => r.name)).toEqual(['A', 'Beta', 'C'])
		expect(snap.context.displayColumns.map(r => r.name)).toEqual(['A', 'Beta', 'C'])
		actor.stop()
	})

	it('preserves icon and isCollapsed after rename', () => {
		const icon = { name: 'star', value: 'star', prefix: 'Li' }
		const actor = createActor(boardMachine, {
			input: {
				columns: [rec('A'), rec('B', { icon, isCollapsed: true }), rec('C')],
			},
		})
		actor.start()
		actor.send({ type: 'RENAME_COLUMN', oldName: 'B', newName: 'Beta' })
		const renamed = actor.getSnapshot().context.columns.find(r => r.name === 'Beta')
		expect(renamed).toBeDefined()
		expect(renamed!.icon).toEqual(icon)
		expect(renamed!.isCollapsed).toBe(true)
		actor.stop()
	})

	it('is a no-op for unknown names', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'RENAME_COLUMN', oldName: 'X', newName: 'Y' })
		expect(actor.getSnapshot().context.columns.map(r => r.name)).toEqual(['A', 'B', 'C'])
		actor.stop()
	})
})

describe('boardMachine — SET_ICON', () => {
	it('sets icon on matching record', () => {
		const icon = { name: 'heart', value: 'heart', prefix: 'Li' }
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'SET_ICON', name: 'B', icon })
		const cols = actor.getSnapshot().context.columns
		expect(cols.find(r => r.name === 'B')?.icon).toEqual(icon)
		expect(cols.find(r => r.name === 'A')?.icon).toBeNull()
		actor.stop()
	})

	it('clears icon when set to null', () => {
		const icon = { name: 'heart', value: 'heart', prefix: 'Li' }
		const actor = createActor(boardMachine, {
			input: { columns: [rec('A', { icon })] },
		})
		actor.start()
		actor.send({ type: 'SET_ICON', name: 'A', icon: null })
		expect(actor.getSnapshot().context.columns.find(r => r.name === 'A')?.icon).toBeNull()
		actor.stop()
	})

	it('updates displayColumns as well', () => {
		const icon = { name: 'heart', value: 'heart', prefix: 'Li' }
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'SET_ICON', name: 'A', icon })
		expect(actor.getSnapshot().context.displayColumns.find(r => r.name === 'A')?.icon).toEqual(icon)
		actor.stop()
	})
})

describe('boardMachine — SET_COLLAPSE', () => {
	it('sets isCollapsed on matching record', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'SET_COLLAPSE', name: 'C', isCollapsed: true })
		const cols = actor.getSnapshot().context.columns
		expect(cols.find(r => r.name === 'C')?.isCollapsed).toBe(true)
		expect(cols.find(r => r.name === 'A')?.isCollapsed).toBe(false)
		actor.stop()
	})

	it('can uncollapse a collapsed record', () => {
		const actor = createActor(boardMachine, {
			input: { columns: [rec('A', { isCollapsed: true })] },
		})
		actor.start()
		actor.send({ type: 'SET_COLLAPSE', name: 'A', isCollapsed: false })
		expect(actor.getSnapshot().context.columns.find(r => r.name === 'A')?.isCollapsed).toBe(false)
		actor.stop()
	})

	it('updates displayColumns as well', () => {
		const actor = createActor(boardMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'SET_COLLAPSE', name: 'B', isCollapsed: true })
		expect(actor.getSnapshot().context.displayColumns.find(r => r.name === 'B')?.isCollapsed).toBe(true)
		actor.stop()
	})
})
