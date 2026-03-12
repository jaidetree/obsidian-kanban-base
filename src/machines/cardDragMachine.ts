import { assign, setup } from 'xstate'

export const cardDragMachine = setup({
	types: {} as {
		context: {
			dragFile: string | null
			sourceColumn: string | null
			targetColumn: string | null
		}
		events:
			| { type: 'DRAG_START'; filePath: string; sourceColumn: string }
			| { type: 'DRAG_OVER'; targetColumn: string }
			| { type: 'DROP' }
			| { type: 'CANCEL' }
	},
}).createMachine({
	id: 'cardDrag',
	initial: 'idle',
	context: {
		dragFile: null,
		sourceColumn: null,
		targetColumn: null,
	},
	states: {
		idle: {
			on: {
				DRAG_START: {
					target: 'dragging',
					actions: assign({
						dragFile: ({ event }) => event.filePath,
						sourceColumn: ({ event }) => event.sourceColumn,
						targetColumn: null,
					}),
				},
			},
		},
		dragging: {
			on: {
				DRAG_OVER: {
					actions: assign({
						targetColumn: ({ event }) => event.targetColumn,
					}),
				},
				DROP: {
					target: 'idle',
					actions: assign({
						dragFile: null,
						sourceColumn: null,
						targetColumn: null,
					}),
				},
				CANCEL: {
					target: 'idle',
					actions: assign({
						dragFile: null,
						sourceColumn: null,
						targetColumn: null,
					}),
				},
			},
		},
	},
})
