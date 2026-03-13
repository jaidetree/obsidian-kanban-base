import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { columnMachine } from './columnMachine'

describe('columnMachine', () => {
	it('starts in idle state with correct context defaults', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.name).toBe('Todo')
		expect(snap.context.draft).toBe('Todo')
		expect(snap.context.isCollapsed).toBe(false)
		expect(snap.context.newCardName).toBe('')
		actor.stop()
	})

	it('RENAME transitions to editing', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		expect(actor.getSnapshot().value).toBe('editing')
		actor.stop()
	})

	it('SET_DRAFT updates draft in editing state', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		actor.send({ type: 'SET_DRAFT', draft: 'Done' })
		expect(actor.getSnapshot().context.draft).toBe('Done')
		actor.stop()
	})

	it('CONFIRM transitions to idle and updates name', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		actor.send({ type: 'SET_DRAFT', draft: 'Done' })
		actor.send({ type: 'CONFIRM' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.name).toBe('Done')
		actor.stop()
	})

	it('CANCEL transitions to idle and restores draft to name', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		actor.send({ type: 'SET_DRAFT', draft: 'Done' })
		actor.send({ type: 'CANCEL' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.draft).toBe('Todo')
		actor.stop()
	})

	it('TOGGLE_COLLAPSE flips isCollapsed', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'TOGGLE_COLLAPSE' })
		expect(actor.getSnapshot().context.isCollapsed).toBe(true)
		actor.send({ type: 'TOGGLE_COLLAPSE' })
		expect(actor.getSnapshot().context.isCollapsed).toBe(false)
		actor.stop()
	})

	it('START_ADD_CARD transitions to addingCard', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'START_ADD_CARD' })
		expect(actor.getSnapshot().value).toBe('addingCard')
		actor.stop()
	})

	it('SET_NEW_CARD_NAME updates newCardName in addingCard state', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'START_ADD_CARD' })
		actor.send({ type: 'SET_NEW_CARD_NAME', name: 'My Task' })
		expect(actor.getSnapshot().context.newCardName).toBe('My Task')
		actor.stop()
	})

	it('CONFIRM_ADD_CARD transitions to idle and resets newCardName', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'START_ADD_CARD' })
		actor.send({ type: 'SET_NEW_CARD_NAME', name: 'My Task' })
		actor.send({ type: 'CONFIRM_ADD_CARD' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.newCardName).toBe('')
		actor.stop()
	})

	it('CANCEL_ADD_CARD transitions to idle and resets newCardName', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'START_ADD_CARD' })
		actor.send({ type: 'SET_NEW_CARD_NAME', name: 'My Task' })
		actor.send({ type: 'CANCEL_ADD_CARD' })
		const snap = actor.getSnapshot()
		expect(snap.value).toBe('idle')
		expect(snap.context.newCardName).toBe('')
		actor.stop()
	})

	it('START_ADD_CARD is ignored in editing state', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: false },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		actor.send({ type: 'START_ADD_CARD' })
		expect(actor.getSnapshot().value).toBe('editing')
		actor.stop()
	})

	it('RENAME is ignored when isCollapsed is true', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: true },
		})
		actor.start()
		actor.send({ type: 'RENAME' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})

	it('START_ADD_CARD is ignored when isCollapsed is true', () => {
		const actor = createActor(columnMachine, {
			input: { name: 'Todo', isCollapsed: true },
		})
		actor.start()
		actor.send({ type: 'START_ADD_CARD' })
		expect(actor.getSnapshot().value).toBe('idle')
		actor.stop()
	})
})
