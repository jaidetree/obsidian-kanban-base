import { setup, assign } from 'xstate';

export const columnMachine = setup({
	types: {} as {
		context: { name: string; draft: string; isCollapsed: boolean };
		events:
			| { type: 'RENAME' }
			| { type: 'SET_DRAFT'; draft: string }
			| { type: 'CONFIRM' }
			| { type: 'CANCEL' }
			| { type: 'TOGGLE_COLLAPSE' };
		input: { name: string; isCollapsed: boolean };
	},
}).createMachine({
	id: 'column',
	initial: 'idle',
	context: ({ input }) => ({
		name: input.name,
		draft: input.name,
		isCollapsed: input.isCollapsed,
	}),
	states: {
		idle: {
			on: {
				RENAME: 'editing',
				TOGGLE_COLLAPSE: {
					actions: assign({ isCollapsed: ({ context }) => !context.isCollapsed }),
				},
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
	},
});
