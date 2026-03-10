import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { columnOrderMachine, reorderColumns } from './columnOrderMachine'

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
	it('starts in idle state', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('transitions to dragging on DRAG_START and records dragIndex', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', index: 1 })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('dragging')
		expect(snap.context.dragIndex).toBe(1)
		actor.stop()
	})

	it('updates dropIndex on DRAG_OVER', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		expect(actor.getSnapshot().context.dropIndex).toBe(2)
		actor.stop()
	})

	it('goes to reordered then idle on DROP', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DROP' })
		// reordered is an always-transition state, so it immediately goes to idle
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('returns to idle on CANCEL', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'CANCEL' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('clears dropIndex on DRAG_START', () => {
		const actor = createActor(columnOrderMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', index: 0 })
		actor.send({ type: 'DRAG_OVER', index: 2 })
		actor.send({ type: 'CANCEL' })
		actor.send({ type: 'DRAG_START', index: 1 })
		expect(actor.getSnapshot().context.dropIndex).toBeNull()
		actor.stop()
	})
})
