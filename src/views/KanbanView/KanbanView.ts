import type { BasesEntry } from 'obsidian'
import { BasesView, TFile, TFolder, type QueryController } from 'obsidian'
import { h, render } from 'preact'
import type { BoardColumnStates } from 'types/columns'
import type { BoardIcons } from 'types/icons'
import { createActor, type Actor } from 'xstate'
import { KANBAN_ID } from '.'
import { KanbanBoard } from './KanbanBoard'
import { cardDragMachine } from '../../machines/cardDragMachine'
import { columnOrderMachine } from '../../machines/columnOrderMachine'

export interface IKanbanColumn {
	folder: TFolder
	entries: BasesEntry[]
}

/**
 * Derive columns from a known root folder. All direct subfolders of `root`
 * become columns (including empty ones). Entries are assigned to columns based
 * on their immediate parent folder path.
 */
export function deriveColumnsFromRoot(
	root: TFolder,
	entries: BasesEntry[],
): IKanbanColumn[] {
	// Seed columns from all direct subfolder children, sorted alphabetically.
	// Use duck-typing ('children' in c) rather than instanceof TFolder so this
	// works in both production and test environments (where TFolder is a mock).
	const subfolders = root.children
		.filter((c): c is TFolder => 'children' in c && !('extension' in c))
		.sort((a, b) => a.name.localeCompare(b.name))

	const folderMap = new Map<string, IKanbanColumn>()
	for (const folder of subfolders) {
		folderMap.set(folder.path, { folder, entries: [] })
	}

	// Assign markdown entries to matching direct-child columns
	for (const entry of entries) {
		if (entry.file.extension !== 'md') continue
		const parent = entry.file.parent
		if (!parent) continue
		const col = folderMap.get(parent.path)
		if (col) col.entries.push(entry)
	}

	return [...folderMap.values()]
}

/**
 * Given a flat list of entries, return columns derived from their immediate
 * parent folders. Only entries whose grandparent folder is the shared root are
 * included — entries nested deeper (subfolders) are excluded.
 */
export function deriveColumns(entries: BasesEntry[]): IKanbanColumn[] {
	if (entries.length === 0) return []

	// Only consider markdown files — ignore .base and other non-note files
	const mdEntries = entries.filter(e => e.file.extension === 'md')
	if (mdEntries.length === 0) return []

	// Collect all immediate parent folders
	const folderMap = new Map<
		string,
		{ folder: TFolder; entries: BasesEntry[] }
	>()

	for (const entry of mdEntries) {
		const folder = entry.file.parent
		if (!folder || folder.isRoot()) continue
		if (!folderMap.has(folder.path)) {
			folderMap.set(folder.path, { folder, entries: [] })
		}
		folderMap.get(folder.path)!.entries.push(entry)
	}

	// Determine root: parent of the shallowest folder (fewest path segments).
	// This avoids insertion-order sensitivity when entries live at mixed depths.
	const folders = [...folderMap.values()].map(v => v.folder)
	const shallowest = folders.reduce((a, b) =>
		a.path.split('/').length <= b.path.split('/').length ? a : b,
	)
	const root = shallowest.parent ?? null

	// Only keep folders whose parent is the shared root (immediate children)
	const columns: IKanbanColumn[] = []
	for (const { folder, entries } of folderMap.values()) {
		if (root === null || folder.parent?.path === root.path) {
			columns.push({ folder, entries })
		}
	}

	// Sort columns alphabetically by folder name (default order)
	columns.sort((a, b) => a.folder.name.localeCompare(b.folder.name))

	return columns
}

/**
 * Re-order columns according to a saved order array (folder names).
 * Columns not present in the order are appended at the end in their
 * original (alphabetical) order.
 */
export function applyColumnOrder(
	columns: IKanbanColumn[],
	order: string[],
): IKanbanColumn[] {
	if (order.length === 0) return columns
	const ordered = order
		.map(name => columns.find(c => c.folder.name === name))
		.filter((c): c is IKanbanColumn => c !== undefined)
	const unordered = columns.filter(c => !order.includes(c.folder.name))
	return [...ordered, ...unordered]
}

export class KanbanView extends BasesView {
	readonly type = KANBAN_ID
	private readonly containerEl: HTMLElement
	private firstColumnFolder: TFolder | null = null
	private columnRootFolder: TFolder | null = null
	private columnOrderActor: Actor<typeof columnOrderMachine> | null = null
	private cardDragActor: Actor<typeof cardDragMachine> | null = null
	private lastExternalColumns: string[] | null = null

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller)
		this.containerEl = containerEl
	}

	onDataUpdated(): void {
		const cardProperties =
			(this.config.get('cardProperties') as string[] | null) ?? []
		const cardSize = (this.config.get('cardSize') as number | null) ?? 220

		// Resolve columnRoot from config
		const columnRootPath = this.config.get('columnRoot') as string | undefined
		let rawColumns: IKanbanColumn[]
		if (!columnRootPath) {
			this.columnRootFolder = null
			rawColumns = []
		} else {
			const resolved = this.app.vault.getFolderByPath(columnRootPath)
			if (!resolved) {
				// Folder was deleted — clear stale config and show prompt
				this.config.set('columnRoot', '')
				this.columnRootFolder = null
				rawColumns = []
			} else {
				this.columnRootFolder = resolved
				rawColumns = deriveColumnsFromRoot(resolved, this.data.data)
			}
		}

		let columns: IKanbanColumn[]
		if (!this.cardDragActor) {
			this.cardDragActor = createActor(cardDragMachine)
			this.cardDragActor.start()
		}

		if (!this.columnOrderActor) {
			// First call: initialise actor with order from saved config
			columns = applyColumnOrder(rawColumns, this.parseColumnOrder())
			const colNames = columns.map(c => c.folder.name)
			this.columnOrderActor = createActor(columnOrderMachine, {
				input: { columns: colNames },
			})
			let prevCols: string[] | null = null
			this.columnOrderActor.subscribe((snapshot) => {
				const cols = snapshot.context.columns
				if (
					prevCols !== null &&
					cols !== prevCols &&
					cols !== this.lastExternalColumns
				) {
					this.config.set('columnOrder', JSON.stringify(cols))
				}
				prevCols = cols
			})
			this.columnOrderActor.start()
		} else {
			// Subsequent calls: preserve machine order, merge in any new/removed columns
			const machineOrder = this.columnOrderActor.getSnapshot().context.columns
			columns = applyColumnOrder(rawColumns, machineOrder)
			const colNames = columns.map(c => c.folder.name)
			this.lastExternalColumns = colNames
			this.columnOrderActor.send({ type: 'SET_COLUMNS', columns: colNames })
		}

		this.firstColumnFolder = columns[0]?.folder ?? null

		const columnIconsRaw =
			(this.config.get('columnIcons') as string | null) ?? '{}'
		let columnIcons: BoardIcons
		try {
			columnIcons = JSON.parse(columnIconsRaw) as BoardIcons
		} catch {
			columnIcons = {}
		}

		const columnStatesRaw =
			(this.config.get('columnStates') as string | null) ?? '{}'
		let columnStates: BoardColumnStates
		try {
			columnStates = JSON.parse(columnStatesRaw) as BoardColumnStates
		} catch {
			columnStates = {}
		}

		render(
			h(KanbanBoard, {
				columns,
				app: this.app,
				cardProperties,
				cardSize,
				columnIcons,
				columnStates,
				columnRootSet: !!columnRootPath,
				onAddColumn: (name: string) => this.handleAddColumn(name),
				onSetColumnRoot: (folderPath: string) => {
					this.config.set('columnRoot', folderPath)
				},
				onUpdateIcons: (icons: BoardIcons) => {
					this.config.set('columnIcons', JSON.stringify(icons))
				},
				onUpdateColumnStates: (states: BoardColumnStates) => {
					this.config.set('columnStates', JSON.stringify(states))
				},
				onRenameColumn: (oldName: string, newName: string) =>
					this.handleRenameColumn(oldName, newName),
				columnOrderActor: this.columnOrderActor,
				cardDragActor: this.cardDragActor,
				onCardDrop: (filePath: string, targetFolderName: string) =>
					this.handleCardDrop(filePath, targetFolderName),
			}),
			this.containerEl,
		)
	}

	async createFileForView(): Promise<void> {
		if (!this.firstColumnFolder) return
		const folder = this.firstColumnFolder
		const base = `${folder.path}/Untitled`
		let path = `${base}.md`
		let i = 1
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${base} ${i}.md`
			i++
		}
		await this.app.vault.create(path, '')
	}

	onunload(): void {
		this.columnOrderActor?.stop()
		this.cardDragActor?.stop()
		render(null, this.containerEl)
	}

	private async handleCardDrop(
		filePath: string,
		targetFolderName: string,
	): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(filePath)
		if (!(file instanceof TFile)) return
		const targetFolder =
			this.columnRootFolder?.children.find(
				(c): c is TFolder =>
					'children' in c && !('extension' in c) && c.name === targetFolderName,
			) ?? null
		if (!targetFolder) return
		await this.app.vault.rename(file, targetFolder.path + '/' + file.name)
	}

	private parseColumnOrder(): string[] {
		try {
			const raw = this.config.get('columnOrder')
			if (!raw || typeof raw !== 'string') return []
			const parsed = JSON.parse(raw) as unknown
			if (!Array.isArray(parsed)) return []
			return parsed.filter(
				(item): item is string => typeof item === 'string',
			)
		} catch {
			return []
		}
	}

	private async handleRenameColumn(
		oldName: string,
		newName: string,
	): Promise<void> {
		const trimmed = newName.trim()
		if (!trimmed || trimmed === oldName) return

		const folder =
			this.columnRootFolder?.children.find(
				(c): c is TFolder =>
					'children' in c && !('extension' in c) && c.name === oldName,
			) ?? null
		if (!folder) return

		const parent = folder.parent
		const parentPath = parent && !parent.isRoot() ? parent.path + '/' : ''
		await this.app.vault.rename(folder, `${parentPath}${trimmed}`)

		// Migrate column order
		const currentOrder = this.parseColumnOrder()
		if (currentOrder.length > 0) {
			const newOrder = currentOrder.map(n =>
				n === oldName ? trimmed : n,
			)
			this.config.set('columnOrder', JSON.stringify(newOrder))
		}

		// Migrate column icons and states to new key
		this.migrateColumnKey('columnIcons', oldName, trimmed)
		this.migrateColumnKey('columnStates', oldName, trimmed)
	}

	private migrateColumnKey(
		configKey: string,
		oldName: string,
		newName: string,
	): void {
		try {
			const raw = (this.config.get(configKey) as string | null) ?? '{}'
			const data = JSON.parse(raw) as Record<string, unknown>
			if (oldName in data) {
				data[newName] = data[oldName]
				delete data[oldName]
				this.config.set(configKey, JSON.stringify(data))
			}
		} catch {
			// ignore malformed config
		}
	}

	private async handleAddColumn(name: string): Promise<void> {
		const trimmed = name.trim()
		if (!trimmed || !this.columnRootFolder) return

		const rootPath = !this.columnRootFolder.isRoot()
			? this.columnRootFolder.path
			: ''
		const folderPath = rootPath ? `${rootPath}/${trimmed}` : trimmed

		// Seed the column order from existing columns, then append the new name
		const existingOrder = this.parseColumnOrder()
		const existingNames = deriveColumnsFromRoot(
			this.columnRootFolder,
			this.data.data,
		).map(c => c.folder.name)
		const base = existingOrder.length > 0 ? existingOrder : existingNames
		const newOrder = [...base.filter(n => n !== trimmed), trimmed]
		this.config.set('columnOrder', JSON.stringify(newOrder))

		await this.app.vault.createFolder(folderPath)
	}
}
