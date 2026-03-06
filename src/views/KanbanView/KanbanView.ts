import { BasesView, TFolder, type QueryController } from 'obsidian';
import { render, h } from 'preact';
import type { BasesEntry } from 'obsidian';
import { KanbanBoard } from './KanbanBoard';
import { KANBAN_ID } from '.';

export interface KanbanColumn {
	folder: TFolder;
	entries: BasesEntry[];
}

/**
 * Given a flat list of entries, return columns derived from their immediate
 * parent folders. Only entries whose grandparent folder is the shared root are
 * included — entries nested deeper (subfolders) are excluded.
 */
export function deriveColumns(entries: BasesEntry[]): KanbanColumn[] {
	if (entries.length === 0) return [];

	// Only consider markdown files — ignore .base and other non-note files
	const mdEntries = entries.filter(e => e.file.extension === 'md');
	if (mdEntries.length === 0) return [];

	// Collect all immediate parent folders
	const folderMap = new Map<string, { folder: TFolder; entries: BasesEntry[] }>();

	for (const entry of mdEntries) {
		const folder = entry.file.parent;
		if (!folder || folder.isRoot()) continue;
		if (!folderMap.has(folder.path)) {
			folderMap.set(folder.path, { folder, entries: [] });
		}
		folderMap.get(folder.path)!.entries.push(entry);
	}

	// Determine root: parent of the shallowest folder (fewest path segments).
	// This avoids insertion-order sensitivity when entries live at mixed depths.
	const folders = [...folderMap.values()].map(v => v.folder);
	const shallowest = folders.reduce((a, b) =>
		a.path.split('/').length <= b.path.split('/').length ? a : b
	);
	const root = shallowest.parent ?? null;

	// Only keep folders whose parent is the shared root (immediate children)
	const columns: KanbanColumn[] = [];
	for (const { folder, entries } of folderMap.values()) {
		if (root === null || folder.parent?.path === root.path) {
			columns.push({ folder, entries });
		}
	}

	// Sort columns alphabetically by folder name (default order)
	columns.sort((a, b) => a.folder.name.localeCompare(b.folder.name));

	return columns;
}

export class KanbanView extends BasesView {
	readonly type = KANBAN_ID;
	private readonly containerEl: HTMLElement;

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller);
		this.containerEl = containerEl;
		// data is not yet available in the constructor — wait for onDataUpdated()
	}

	onDataUpdated(): void {
		render(
			h(KanbanBoard, { columns: deriveColumns(this.data.data), app: this.app }),
			this.containerEl,
		);
	}

	onunload(): void {
		render(null, this.containerEl);
	}
}
