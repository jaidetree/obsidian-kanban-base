import { assign, setup } from 'xstate'

function reorder(columns: string[], from: number, to: number): string[] {
	if (from === to) return columns
	const result = [...columns]
	const item = result.splice(from, 1)[0]
	if (item === undefined) return columns
	result.splice(to, 0, item)
	return result
}

export const columnOrderMachine = setup({
	types: {} as {
		context: {
			dragIndex: number | null
			dropIndex: number | null
		}
		events:
			| { type: 'DRAG_START'; index: number }
			| { type: 'DRAG_OVER'; index: number }
			| { type: 'DROP' }
			| { type: 'CANCEL' }
	},
}).createMachine({
	id: 'columnOrder',
	initial: 'idle',
	context: {
		dragIndex: null,
		dropIndex: null,
	},
	states: {
		idle: {
			on: {
				DRAG_START: {
					target: 'dragging',
					actions: assign({
						dragIndex: ({ event }) => event.index,
						dropIndex: null,
					}),
				},
			},
		},
		dragging: {
			on: {
				DRAG_OVER: {
					actions: assign({
						dropIndex: ({ event }) => event.index,
					}),
				},
				DROP: { target: 'reordered' },
				CANCEL: { target: 'canceled' },
			},
		},
		reordered: {
			always: { target: 'idle' },
		},
		canceled: {
			always: { target: 'idle' },
		},
	},
})

export { reorder as reorderColumns }
