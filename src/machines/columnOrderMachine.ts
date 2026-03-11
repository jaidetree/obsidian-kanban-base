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
		input: { columns: string[] }
		context: {
			columns: string[]
			displayColumns: string[]
			dragIndex: number | null
			dropIndex: number | null
		}
		events:
			| { type: 'SET_COLUMNS'; columns: string[] }
			| { type: 'DRAG_START'; index: number }
			| { type: 'DRAG_OVER'; index: number }
			| { type: 'DROP' }
			| { type: 'CANCEL' }
	},
}).createMachine({
	id: 'columnOrder',
	initial: 'idle',
	context: ({ input }) => ({
		columns: input.columns,
		displayColumns: input.columns,
		dragIndex: null,
		dropIndex: null,
	}),
	states: {
		idle: {
			on: {
				SET_COLUMNS: {
					actions: assign({
						columns: ({ event }) => event.columns,
						displayColumns: ({ event }) => event.columns,
					}),
				},
				DRAG_START: {
					target: 'dragging',
					actions: assign({
						dragIndex: ({ event }) => event.index,
						dropIndex: null,
						displayColumns: ({ context }) => context.columns,
					}),
				},
			},
		},
		dragging: {
			on: {
				DRAG_OVER: {
					actions: assign({
						dropIndex: ({ event }) => event.index,
						displayColumns: ({ context, event }) =>
							context.dragIndex !== null
								? reorder(context.columns, context.dragIndex, event.index)
								: context.columns,
					}),
				},
				DROP: {
					target: 'idle',
					actions: assign(({ context }) => ({
						columns: context.displayColumns,
						dragIndex: null,
						dropIndex: null,
					})),
				},
				CANCEL: {
					target: 'idle',
					actions: assign(({ context }) => ({
						dragIndex: null,
						dropIndex: null,
						displayColumns: context.columns,
					})),
				},
			},
		},
	},
})

export { reorder as reorderColumns }
