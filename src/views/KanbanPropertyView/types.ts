import type { IKanbanColumn } from '../KanbanBase/types'

/**
 * Property-view-specific column: same as the shared column but flagged when
 * it was created from the null-key group (notes with no value for the
 * group-by property).
 */
export interface IKanbanPropertyColumn extends IKanbanColumn {
	isUncategorized: boolean
}
