import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { columnOrderMachine, reorderColumns } from './columnOrderMachine'

const defaultInput = { columns: ['A', 'B', 'C'] }

describe('reorderColumns', () => {
	it('moves item forward', () => {
		expect(reorderColumns(['A', 'B', 'C'], 0, 2)).toEqual(['B', 'C', 'A'])
	})

	it('moves item backward', () => {
		expect(reorderColumns(['A', 'B', 'C'], 2, 0)).toEqual(['C', 'A', 'B'])
	})

	it('returns same array when from === to', () => {
		expect(reorderColumns(['A', 'B', 'C'], 1, 1)).toEqual(['A', 'B', 'C'])
	})

	it('handles two-element swap', () => {
		expect(reorderColumns(['A', 'B'], 0, 1)).toEqual(['B', 'A'])
	})
})

describe('columnOrderMachine', () => {
	it('starts in idle state with provided columns', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		expect(actor.getSnapshot().value).toBe('idle')
		expect(actor.getSnapshot().context.columns).toEqual(['A', 'B', 'C'])
		actor.stop()
	})

	it('transitions to dragging on DRAG_START and records dragIndex', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 1 })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('dragging')
		expect(snap.context.dragIndex).toBe(1)
		actor.stop()
	})

	it('updates dropIndex on DRAG_OVER', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		expect(actor.getSnapshot().context.dropIndex).toBe(2)
		actor.stop()
	})

	it('goes to idle on DROP and reorders columns', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'DROP' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.columns).toEqual(['B', 'C', 'A'])
		expect(snap.context.dragIndex).toBeNull()
		expect(snap.context.dropIndex).toBeNull()
		actor.stop()
	})

	it('returns to idle on CANCEL without reordering', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'CANCEL' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.columns).toEqual(['A', 'B', 'C'])
		actor.stop()
	})

	it('clears drag indices on DRAG_START', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'CANCEL' })
		actor.send({ type: 'DRAG_START', index: 1 })
		expect(actor.getSnapshot().context.dropIndex).toBeNull()
		actor.stop()
	})

	it('updates columns on SET_COLUMNS', () => {
		const actor = createActor(columnOrderMachine, { input: defaultInput })
		actor.start()
		actor.send({ type: 'SET_COLUMNS', columns: ['A', 'B', 'C', 'D'] })
		expect(actor.getSnapshot().context.columns).toEqual(['A', 'B', 'C', 'D'])
		actor.stop()
	})
})
