import { assign, setup } from 'xstate'
import type { Icon } from 'types/icons'

export interface ColumnRecord {
	name: string
	icon: Icon | null
	isCollapsed: boolean
}

function reorder(columns: ColumnRecord[], from: number, to: number): ColumnRecord[] {
	if (from === to) return columns
	const result = [...columns]
	const item = result.splice(from, 1)[0]
	if (item === undefined) return columns
	result.splice(to, 0, item)
	return result
}

export const boardMachine = setup({
	types: {} as {
		input: { columns: ColumnRecord[] }
		context: {
			columns: ColumnRecord[]
			displayColumns: ColumnRecord[]
			dragIndex: number | null
			dropIndex: number | null
		}
		events:
			| { type: 'MERGE_COLUMNS'; folderNames: string[] }
			| { type: 'RENAME_COLUMN'; oldName: string; newName: string }
			| { type: 'SET_ICON'; name: string; icon: Icon | null }
			| { type: 'SET_COLLAPSE'; name: string; isCollapsed: boolean }
			| { type: 'DRAG_START'; index: number }
			| { type: 'DRAG_OVER'; index: number }
			| { type: 'DROP' }
			| { type: 'CANCEL' }
	},
}).createMachine({
	id: 'board',
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
				MERGE_COLUMNS: {
					actions: assign(({ context, event }) => {
						const nameSet = new Set(event.folderNames)
						// Keep existing records in their current relative order, dropping removed ones
						const kept = context.columns.filter(r => nameSet.has(r.name))
						// Append truly new names at end with defaults
						const keptNames = new Set(kept.map(r => r.name))
						const added = event.folderNames
							.filter(n => !keptNames.has(n))
							.map(n => ({ name: n, icon: null as Icon | null, isCollapsed: false }))
						const merged = [...kept, ...added]
						return { columns: merged, displayColumns: merged }
					}),
				},
				RENAME_COLUMN: {
					actions: assign(({ context, event }) => {
						const rename = (records: ColumnRecord[]) =>
							records.map(r =>
								r.name === event.oldName ? { ...r, name: event.newName } : r,
							)
						return {
							columns: rename(context.columns),
							displayColumns: rename(context.displayColumns),
						}
					}),
				},
				SET_ICON: {
					actions: assign(({ context, event }) => {
						const update = (records: ColumnRecord[]) =>
							records.map(r =>
								r.name === event.name ? { ...r, icon: event.icon } : r,
							)
						return {
							columns: update(context.columns),
							displayColumns: update(context.displayColumns),
						}
					}),
				},
				SET_COLLAPSE: {
					actions: assign(({ context, event }) => {
						const update = (records: ColumnRecord[]) =>
							records.map(r =>
								r.name === event.name
									? { ...r, isCollapsed: event.isCollapsed }
									: r,
							)
						return {
							columns: update(context.columns),
							displayColumns: update(context.displayColumns),
						}
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
