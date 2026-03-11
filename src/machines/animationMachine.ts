import { setup } from 'xstate'

export const animationMachine = setup({
	types: {} as {
		// context: {}
		events:
			| { type: 'ACTIVATE' }
			| { type: 'ENTER' }
			| { type: 'START' }
			| { type: 'COMPLETE' }
			| { type: 'DEACTIVATE' }
			| { type: 'LEAVE' }
			| { type: 'STOP' }
		// input: {}
	},
}).createMachine({
	id: 'animation',
	initial: 'inactive',
	//	context: ({}) => ({}),
	states: {
		inactive: {
			on: {
				ACTIVATE: {
					target: 'entering',
				},
			},
		},

		entering: {
			on: {
				START: {
					target: 'starting',
				},
			},
		},

		starting: {
			on: {
				COMPLETE: {
					target: 'active',
				},
			},
		},

		active: {
			on: {
				DEACTIVATE: {
					target: 'leaving',
				},
			},
		},

		leaving: {
			on: {
				LEAVE: {
					target: 'ending',
				},
			},
		},

		ending: {
			on: {
				COMPLETE: {
					target: 'inactive',
				},
			},
		},
	},
})
