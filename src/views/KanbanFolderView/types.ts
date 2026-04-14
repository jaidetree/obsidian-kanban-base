import type { TFolder } from 'obsidian'
import type { IKanbanColumn } from '../KanbanBase/types'

/**
 * Folder-view-specific column: same as the shared column but with the
 * underlying TFolder attached for vault rename / create / trash operations.
 */
export interface IKanbanFolderColumn extends IKanbanColumn {
	folder: TFolder
}
