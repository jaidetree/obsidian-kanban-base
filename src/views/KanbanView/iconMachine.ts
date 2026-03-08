import { setup, assign } from 'xstate';

export const iconMachine = setup({
	types: {} as {
		context: { chosenIcon: string | null };
		events:
			| { type: 'OPEN' }
			| { type: 'SELECT'; icon: string }
			| { type: 'CANCEL' };
		input: { chosenIcon: string | null };
	},
}).createMachine({
	id: 'iconPicker',
	initial: 'idle',
	context: ({ input }: { input: { chosenIcon: string | null } }) => ({
		chosenIcon: input.chosenIcon,
	}),
	states: {
		idle: { on: { OPEN: 'picking' } },
		picking: {
			on: {
				SELECT: {
					target: 'idle',
					actions: assign({ chosenIcon: ({ event }) => event.icon }),
				},
				CANCEL: 'idle',
			},
		},
	},
});
