import type { BasesEntry } from 'obsidian'
import { BasesView, TFile, TFolder, type QueryController } from 'obsidian'
import { h, render } from 'preact'
import { createActor, type Actor } from 'xstate'
import { KANBAN_ID } from '.'
import { KanbanBoard } from './KanbanBoard'
import { AppContext } from './AppContext'
import { KanbanViewContext } from './KanbanViewContext'
import { cardDragMachine } from '../../machines/cardDragMachine'
import { boardMachine, type ColumnRecord } from '../../machines/boardMachine'

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
	private boardActor: Actor<typeof boardMachine> | null = null
	private cardDragActor: Actor<typeof cardDragMachine> | null = null

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller)
		this.containerEl = containerEl
	}

	private parseBoardState(): ColumnRecord[] {
		try {
			const raw = this.config.get('boardState')
			if (!raw || typeof raw !== 'string') return []
			const parsed = JSON.parse(raw) as unknown
			if (!Array.isArray(parsed)) return []
			return parsed.filter(
				(item): item is ColumnRecord =>
					typeof item === 'object' &&
					item !== null &&
					typeof (item as Record<string, unknown>).name === 'string',
			)
		} catch {
			return []
		}
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

		if (!this.cardDragActor) {
			this.cardDragActor = createActor(cardDragMachine)
			this.cardDragActor.start()
		}

		const folderNames = rawColumns.map(c => c.folder.name)

		if (!this.boardActor) {
			// First call: initialise actor from saved boardState
			const saved = this.parseBoardState()
			const savedByName = new Map(saved.map(r => [r.name, r]))
			const savedNames = saved.map(r => r.name)

			// Order raw columns by saved names, append unknowns
			const orderedNames = [
				...savedNames.filter(n => folderNames.includes(n)),
				...folderNames.filter(n => !savedByName.has(n)),
			]

			const initialRecords: ColumnRecord[] = orderedNames.map(name => {
				const rec = savedByName.get(name)
				return {
					name,
					icon: rec?.icon ?? null,
					isCollapsed: rec?.isCollapsed ?? false,
				}
			})

			this.boardActor = createActor(boardMachine, {
				input: { columns: initialRecords },
			})

			let prevColumns: ColumnRecord[] | null = null
			this.boardActor.subscribe(snapshot => {
				const cols = snapshot.context.columns
				if (prevColumns !== null && cols !== prevColumns) {
					this.config.set('boardState', JSON.stringify(cols))
				}
				prevColumns = cols
			})

			this.boardActor.start()
		} else {
			// Subsequent calls: merge file-system state into actor
			this.boardActor.send({ type: 'MERGE_COLUMNS', folderNames })
		}

		// Derive first column folder for createFileForView
		const displayRecords =
			this.boardActor.getSnapshot().context.displayColumns
		const firstRecord = displayRecords[0]
		this.firstColumnFolder = firstRecord
			? (rawColumns.find(c => c.folder.name === firstRecord.name)?.folder ??
				null)
			: null

		render(
			h(KanbanViewContext.Provider, { value: this },
				h(AppContext.Provider, { value: this.app },
					h(KanbanBoard, {
						columns: rawColumns,
						cardProperties,
						cardSize,
						columnRootSet: !!columnRootPath,
						boardActor: this.boardActor,
						cardDragActor: this.cardDragActor,
					}),
				),
			),
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
		this.boardActor?.stop()
		this.cardDragActor?.stop()
		render(null, this.containerEl)
	}

	setColumnRoot(folderPath: string): void {
		this.config.set('columnRoot', folderPath)
	}

	async dropCard(
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

	async renameColumn(
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

		this.boardActor?.send({ type: 'RENAME_COLUMN', oldName, newName: trimmed })
	}

	async removeColumn(
		folderName: string,
		targetFolderName?: string,
	): Promise<void> {
		const folder =
			this.columnRootFolder?.children.find(
				(c): c is TFolder =>
					'children' in c && !('extension' in c) && c.name === folderName,
			) ?? null
		if (!folder) return

		if (targetFolderName) {
			const targetFolder =
				this.columnRootFolder?.children.find(
					(c): c is TFolder =>
						'children' in c &&
						!('extension' in c) &&
						c.name === targetFolderName,
				) ?? null
			if (!targetFolder) return
			for (const child of [...folder.children]) {
				if (child instanceof TFile) {
					await this.app.vault.rename(
						child,
						`${targetFolder.path}/${child.name}`,
					)
				}
			}
		}

		await this.app.fileManager.trashFile(folder)
		// next onDataUpdated MERGE_COLUMNS drops the record automatically
	}

	async addCard(
		folderName: string,
		name: string,
	): Promise<void> {
		const folder =
			this.columnRootFolder?.children.find(
				(c): c is TFolder =>
					'children' in c && !('extension' in c) && c.name === folderName,
			) ?? null
		if (!folder) return
		const base = `${folder.path}/${name}`
		let path = `${base}.md`
		let i = 1
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${base} ${i}.md`
			i++
		}
		await this.app.vault.create(path, '')
	}

	async addColumn(name: string): Promise<void> {
		const trimmed = name.trim()
		if (!trimmed || !this.columnRootFolder) return

		const rootPath = !this.columnRootFolder.isRoot()
			? this.columnRootFolder.path
			: ''
		const folderPath = rootPath ? `${rootPath}/${trimmed}` : trimmed

		await this.app.vault.createFolder(folderPath)
		// next onDataUpdated MERGE_COLUMNS appends the new record automatically
	}
}
