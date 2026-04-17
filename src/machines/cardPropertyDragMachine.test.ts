import { describe, expect, it } from 'vitest'
import { createActor } from 'xstate'
import { cardPropertyDragMachine } from './cardPropertyDragMachine'

const start = (filePath = 'notes/card.md', sourceColumn = 'Todo', groupByProperty = 'Status') => ({
	type: 'DRAG_START' as const,
	filePath,
	sourceColumn,
	groupByProperty,
})

describe('cardPropertyDragMachine', () => {
	it('starts in idle state with null context', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		expect(snap.context.groupByProperty).toBeNull()
		actor.stop()
	})

	it('DRAG_START transitions to dragging and captures all context including groupByProperty', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send(start('notes/card.md', 'Todo', 'Status'))
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('dragging')
		expect(snap.context.dragFile).toBe('notes/card.md')
		expect(snap.context.sourceColumn).toBe('Todo')
		expect(snap.context.targetColumn).toBeNull()
		expect(snap.context.groupByProperty).toBe('Status')
		actor.stop()
	})

	it('DRAG_OVER updates targetColumn', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send(start())
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		expect(actor.getSnapshot().context.targetColumn).toBe('Done')
		actor.stop()
	})

	it('DROP transitions to idle and clears all context', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send(start())
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		actor.send({ type: 'DROP' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		expect(snap.context.groupByProperty).toBeNull()
		actor.stop()
	})

	it('CANCEL transitions to idle and clears all context', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send(start())
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		actor.send({ type: 'CANCEL' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.dragFile).toBeNull()
		expect(snap.context.sourceColumn).toBeNull()
		expect(snap.context.targetColumn).toBeNull()
		expect(snap.context.groupByProperty).toBeNull()
		actor.stop()
	})

	it('ignores DRAG_OVER in idle state', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send({ type: 'DRAG_OVER', targetColumn: 'Done' })
		expect(actor.getSnapshot().value).toBe('idle')
		expect(actor.getSnapshot().context.targetColumn).toBeNull()
		actor.stop()
	})

	it('ignores DROP in idle state', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send({ type: 'DROP' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('ignores CANCEL in idle state', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send({ type: 'CANCEL' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('DRAG_START from Uncategorized column captures sourceColumn correctly', () => {
		const actor = createActor(cardPropertyDragMachine)
		actor.start()
		actor.send(start('notes/card.md', 'Uncategorized', 'Status'))
		expect(actor.getSnapshot().context.sourceColumn).toBe('Uncategorized')
		actor.stop()
	})
})
