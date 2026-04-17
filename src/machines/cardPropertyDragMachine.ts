import { assign, setup } from 'xstate'

/**
 * Drag machine for the property-based Kanban view.
 * Mirrors cardDragMachine but carries groupByProperty in context so that
 * the view can write the correct frontmatter key on DROP without re-reading
 * config mid-drag.
 *
 * Columns are identified by their string property value (e.g. "In Progress")
 * or by the special name "Uncategorized" for the null-key group.
 *
 * Drop semantics (executed by the view, not the machine):
 *   regular → regular      write targetColumn value to groupByProperty
 *   uncategorized → regular write targetColumn value to groupByProperty
 *   regular → uncategorized delete groupByProperty key from frontmatter
 *   uncategorized → uncat  no-op (same column — board guards prevent the DROP)
 */
export const cardPropertyDragMachine = setup({
	types: {} as {
		context: {
			dragFile: string | null
			sourceColumn: string | null
			targetColumn: string | null
			groupByProperty: string | null
		}
		events:
			| {
					type: 'DRAG_START'
					filePath: string
					sourceColumn: string
					groupByProperty: string
			  }
			| { type: 'DRAG_OVER'; targetColumn: string }
			| { type: 'DROP' }
			| { type: 'CANCEL' }
	},
}).createMachine({
	id: 'cardPropertyDrag',
	initial: 'idle',
	context: {
		dragFile: null,
		sourceColumn: null,
		targetColumn: null,
		groupByProperty: null,
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
						groupByProperty: ({ event }) => event.groupByProperty,
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
						groupByProperty: null,
					}),
				},
				CANCEL: {
					target: 'idle',
					actions: assign({
						dragFile: null,
						sourceColumn: null,
						targetColumn: null,
						groupByProperty: null,
					}),
				},
			},
		},
	},
})
