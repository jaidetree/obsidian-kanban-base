import type { BasesEntry } from 'obsidian'

/**
 * Minimal column representation shared between the folder-based and
 * property-based kanban views.  Each concrete view extends this with its own
 * source-specific fields (e.g. TFolder for the folder view, or a property
 * value string for the property view).
 */
export interface IKanbanColumn {
	name: string
	entries: BasesEntry[]
}
