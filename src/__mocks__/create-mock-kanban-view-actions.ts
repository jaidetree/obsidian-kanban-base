import type { IKanbanViewActions } from '../views/KanbanView/KanbanViewContext'

export function createMockKanbanViewActions(
	overrides?: Partial<IKanbanViewActions>,
): IKanbanViewActions {
	return {
		addColumn: async () => {},
		setColumnRoot: () => {},
		updateIcons: () => {},
		updateColumnStates: () => {},
		renameColumn: async () => {},
		removeColumn: async () => {},
		addCard: async () => {},
		dropCard: async () => {},
		...overrides,
	}
}
