import { createContext } from 'preact'
import { useContext } from 'preact/hooks'

export interface IKanbanViewActions {
	addColumn: (name: string) => Promise<void>
	setColumnRoot: (folderPath: string) => void
	renameColumn: (oldName: string, newName: string) => Promise<void>
	removeColumn: (columnName: string, targetColumnName?: string) => Promise<void>
	addCard: (columnName: string, name: string) => Promise<void>
	dropCard: (filePath: string, targetColumnName: string) => Promise<void>
}

export const KanbanViewContext = createContext<IKanbanViewActions | null>(null)

export function useKanbanView(): IKanbanViewActions {
	const ctx = useContext(KanbanViewContext)
	if (!ctx) throw new Error('useKanbanView must be used within KanbanViewContext.Provider')
	return ctx
}
