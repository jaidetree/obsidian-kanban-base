import { assign, setup } from 'xstate'

export const columnMachine = setup({
	types: {} as {
		context: { name: string; draft: string; isCollapsed: boolean; newCardName: string }
		events:
			| { type: 'RENAME' }
			| { type: 'SET_DRAFT'; draft: string }
			| { type: 'CONFIRM' }
			| { type: 'CANCEL' }
			| { type: 'TOGGLE_COLLAPSE' }
			| { type: 'START_ADD_CARD' }
			| { type: 'SET_NEW_CARD_NAME'; name: string }
			| { type: 'CONFIRM_ADD_CARD' }
			| { type: 'CANCEL_ADD_CARD' }
		input: { name: string; isCollapsed: boolean }
	},
	guards: {
		notCollapsed: ({ context }) => !context.isCollapsed,
	},
}).createMachine({
	id: 'column',
	initial: 'idle',
	context: ({ input }) => ({
		name: input.name,
		draft: input.name,
		isCollapsed: input.isCollapsed,
		newCardName: '',
	}),
	states: {
		idle: {
			on: {
				RENAME: { target: 'editing', guard: 'notCollapsed' },
				TOGGLE_COLLAPSE: {
					actions: assign({
						isCollapsed: ({ context }) => !context.isCollapsed,
					}),
				},
				START_ADD_CARD: { target: 'addingCard', guard: 'notCollapsed' },
			},
		},
		editing: {
			on: {
				SET_DRAFT: {
					actions: assign({ draft: ({ event }) => event.draft }),
				},
				CONFIRM: {
					target: 'idle',
					actions: assign({ name: ({ context }) => context.draft }),
				},
				CANCEL: {
					target: 'idle',
					actions: assign({ draft: ({ context }) => context.name }),
				},
			},
		},
		addingCard: {
			on: {
				SET_NEW_CARD_NAME: {
					actions: assign({ newCardName: ({ event }) => event.name }),
				},
				CONFIRM_ADD_CARD: {
					target: 'idle',
					actions: assign({ newCardName: '' }),
				},
				CANCEL_ADD_CARD: {
					target: 'idle',
					actions: assign({ newCardName: '' }),
				},
			},
		},
	},
})
