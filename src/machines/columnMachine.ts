import { assign, setup } from 'xstate'

export const columnMachine = setup({
	types: {} as {
		context: {
			name: string
			draft: string
			newCardName: string
		}
		events:
			| { type: 'RENAME' }
			| { type: 'SET_DRAFT'; draft: string }
			| { type: 'CONFIRM' }
			| { type: 'CANCEL' }
			| { type: 'ADD_CARD' }
			| { type: 'SET_NEW_CARD_NAME'; name: string }
		input: { name: string }
	},
}).createMachine({
	id: 'column',
	initial: 'idle',
	context: ({ input }) => ({
		name: input.name,
		draft: input.name,
		newCardName: '',
	}),
	states: {
		idle: {
			on: {
				RENAME: { target: 'editing' },
				ADD_CARD: { target: 'addingCard' },
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
				CONFIRM: {
					target: 'addingCard',
					actions: assign({ newCardName: '' }),
				},
				CANCEL: {
					target: 'idle',
					actions: assign({ newCardName: '' }),
				},
			},
		},
	},
})
