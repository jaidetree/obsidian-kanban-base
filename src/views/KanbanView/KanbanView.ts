import { BasesView, TFolder, type QueryController } from 'obsidian';
import { mount, unmount } from 'svelte';
import type { BasesEntry } from 'obsidian';
import KanbanBoard from './KanbanBoard.svelte';
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

	// Collect all immediate parent folders
	const folderMap = new Map<string, { folder: TFolder; entries: BasesEntry[] }>();

	for (const entry of entries) {
		const folder = entry.file.parent;
		if (!folder || folder.isRoot()) continue;
		if (!folderMap.has(folder.path)) {
			folderMap.set(folder.path, { folder, entries: [] });
		}
		folderMap.get(folder.path)!.entries.push(entry);
	}

	// Determine root: the common parent of all entry folders
	const folders = [...folderMap.values()].map(v => v.folder);
	const root = folders[0]?.parent ?? null;

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
	private component: ReturnType<typeof mount> | null = null;
	private readonly containerEl: HTMLElement;

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller);
		this.containerEl = containerEl;
		this.component = mount(KanbanBoard, {
			target: containerEl,
			props: {
				columns: deriveColumns(this.data.data),
				app: this.app,
			},
		});
	}

	onDataUpdated(): void {
		if (this.component) {
			unmount(this.component);
		}
		this.component = mount(KanbanBoard, {
			target: this.containerEl,
			props: {
				columns: deriveColumns(this.data.data),
				app: this.app,
			},
		});
	}

	onunload(): void {
		if (this.component) {
			unmount(this.component);
			this.component = null;
		}
	}
}
