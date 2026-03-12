import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { cardDragMachine } from './cardDragMachine'

describe('cardDragMachine', () => {
	it('starts in idle state with null context', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		actor.stop()
	})

	it('DRAG_START transitions to dragging and sets dragFile and sourceColumn', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', filePath: 'Todo/card.md', sourceColumn: 'Todo' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('dragging')
		expect(snap.context.dragFile).toBe('Todo/card.md')
		expect(snap.context.sourceColumn).toBe('Todo')
		expect(snap.context.targetColumn).toBeNull()
		actor.stop()
	})

	it('DRAG_OVER updates targetColumn', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', filePath: 'Todo/card.md', sourceColumn: 'Todo' })
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		expect(actor.getSnapshot().context.targetColumn).toBe('Done')
		actor.stop()
	})

	it('DROP transitions to idle and clears all context', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', filePath: 'Todo/card.md', sourceColumn: 'Todo' })
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		actor.send({ type: 'DROP' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		actor.stop()
	})

	it('CANCEL transitions to idle and clears all context', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_START', filePath: 'Todo/card.md', sourceColumn: 'Todo' })
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		actor.send({ type: 'CANCEL' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		actor.stop()
	})

	it('ignores DRAG_OVER in idle state', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		expect(actor.getSnapshot().value).toBe('idle')
		expect(actor.getSnapshot().context.targetColumn).toBeNull()
		actor.stop()
	})

	it('ignores DROP in idle state', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'DROP' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('ignores CANCEL in idle state', () => {
		const actor = createActor(cardDragMachine)
		actor.start()
		actor.send({ type: 'CANCEL' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})
})
