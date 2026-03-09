import { BasesView, TFolder, type QueryController } from "obsidian";
import { render, h } from "preact";
import type { BasesEntry } from "obsidian";
import { KanbanBoard } from "./KanbanBoard";
import { KANBAN_ID } from ".";
import type { BoardIcons } from "types/icons";
import type { BoardColumnStates } from "types/columns";

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
	const mdEntries = entries.filter((e) => e.file.extension === "md");
	if (mdEntries.length === 0) return [];

	// Collect all immediate parent folders
	const folderMap = new Map<
		string,
		{ folder: TFolder; entries: BasesEntry[] }
	>();

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
	const folders = [...folderMap.values()].map((v) => v.folder);
	const shallowest = folders.reduce((a, b) =>
		a.path.split("/").length <= b.path.split("/").length ? a : b,
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

/**
 * Re-order columns according to a saved order array (folder names).
 * Columns not present in the order are appended at the end in their
 * original (alphabetical) order.
 */
export function applyColumnOrder(
	columns: KanbanColumn[],
	order: string[],
): KanbanColumn[] {
	if (order.length === 0) return columns;
	const ordered = order
		.map((name) => columns.find((c) => c.folder.name === name))
		.filter((c): c is KanbanColumn => c !== undefined);
	const unordered = columns.filter((c) => !order.includes(c.folder.name));
	return [...ordered, ...unordered];
}

export class KanbanView extends BasesView {
	readonly type = KANBAN_ID;
	private readonly containerEl: HTMLElement;
	private firstColumnFolder: TFolder | null = null;

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller);
		this.containerEl = containerEl;
		// data is not yet available in the constructor — wait for onDataUpdated()
	}

	onDataUpdated(): void {
		const cardProperties =
			(this.config.get("cardProperties") as string[] | null) ?? [];
		const cardSize = (this.config.get("cardSize") as number | null) ?? 220;
		const columns = applyColumnOrder(
			deriveColumns(this.data.data),
			this.parseColumnOrder(),
		);
		this.firstColumnFolder = columns[0]?.folder ?? null;

		const columnIconsRaw =
			(this.config.get("columnIcons") as string | null) ?? "{}";
		let columnIcons: BoardIcons;
		try {
			columnIcons = JSON.parse(columnIconsRaw) as BoardIcons;
		} catch {
			columnIcons = {};
		}

		const columnStatesRaw =
			(this.config.get("columnStates") as string | null) ?? "{}";
		let columnStates: BoardColumnStates;
		try {
			columnStates = JSON.parse(columnStatesRaw) as BoardColumnStates;
		} catch {
			columnStates = {};
		}

		render(
			h(KanbanBoard, {
				columns,
				app: this.app,
				cardProperties,
				cardSize,
				columnIcons,
				columnStates,
				onAddColumn: (name: string) => this.handleAddColumn(name),
				onUpdateIcons: (icons: BoardIcons) => {
					this.config.set("columnIcons", JSON.stringify(icons));
				},
				onUpdateColumnStates: (states: BoardColumnStates) => {
					this.config.set("columnStates", JSON.stringify(states));
				},
				onRenameColumn: (oldName: string, newName: string) =>
					this.handleRenameColumn(oldName, newName),
			}),
			this.containerEl,
		);
	}

	async createFileForView(): Promise<void> {
		if (!this.firstColumnFolder) return;
		const folder = this.firstColumnFolder;
		const base = `${folder.path}/Untitled`;
		let path = `${base}.md`;
		let i = 1;
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${base} ${i}.md`;
			i++;
		}
		await this.app.vault.create(path, "");
	}

	onunload(): void {
		render(null, this.containerEl);
	}

	private parseColumnOrder(): string[] {
		try {
			const raw = this.config.get("columnOrder");
			if (!raw || typeof raw !== "string") return [];
			const parsed = JSON.parse(raw) as unknown;
			if (!Array.isArray(parsed)) return [];
			return parsed.filter(
				(item): item is string => typeof item === "string",
			);
		} catch {
			return [];
		}
	}

	private async handleRenameColumn(
		oldName: string,
		newName: string,
	): Promise<void> {
		const trimmed = newName.trim();
		if (!trimmed || trimmed === oldName) return;

		const column = deriveColumns(this.data.data).find(
			(c) => c.folder.name === oldName,
		);
		if (!column) return;

		const parent = column.folder.parent;
		const parentPath =
			parent && !parent.isRoot() ? parent.path + "/" : "";
		await this.app.vault.rename(
			column.folder,
			`${parentPath}${trimmed}`,
		);

		// Migrate column order
		const currentOrder = this.parseColumnOrder();
		if (currentOrder.length > 0) {
			const newOrder = currentOrder.map((n) =>
				n === oldName ? trimmed : n,
			);
			this.config.set("columnOrder", JSON.stringify(newOrder));
		}

		// Migrate column icons and states to new key
		this.migrateColumnKey("columnIcons", oldName, trimmed);
		this.migrateColumnKey("columnStates", oldName, trimmed);
	}

	private migrateColumnKey(
		configKey: string,
		oldName: string,
		newName: string,
	): void {
		try {
			const raw =
				(this.config.get(configKey) as string | null) ?? "{}";
			const data = JSON.parse(raw) as Record<string, unknown>;
			if (oldName in data) {
				data[newName] = data[oldName];
				delete data[oldName];
				this.config.set(configKey, JSON.stringify(data));
			}
		} catch {
			// ignore malformed config
		}
	}

	private async handleAddColumn(name: string): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed || !this.firstColumnFolder) return;

		const parent = this.firstColumnFolder.parent;
		const rootPath = parent && !parent.isRoot() ? parent.path : "";
		const folderPath = rootPath ? `${rootPath}/${trimmed}` : trimmed;

		// Seed the column order from existing columns, then append the new name
		const existingOrder = this.parseColumnOrder();
		const existingNames = deriveColumns(this.data.data).map(
			(c) => c.folder.name,
		);
		const base = existingOrder.length > 0 ? existingOrder : existingNames;
		const newOrder = [...base.filter((n) => n !== trimmed), trimmed];
		this.config.set("columnOrder", JSON.stringify(newOrder));

		await this.app.vault.createFolder(folderPath);
	}
}
