import type { BasesPropertyId } from 'obsidian'
import { BasesView, type QueryController } from 'obsidian'
import { h, render } from 'preact'
import { createActor, type Actor } from 'xstate'
import { KANBAN_PROPERTY_ID } from '.'
import { boardMachine, type ColumnRecord } from '../../machines/boardMachine'
import { cardDragMachine } from '../../machines/cardDragMachine'
import { AppContext } from '../KanbanBase/AppContext'
import { KanbanViewContext } from '../KanbanBase/KanbanViewContext'
import {
	KanbanPropertyBoard,
	NoGroupByPrompt,
	UnsupportedTypeError,
} from './KanbanPropertyBoard'
import { deriveColumnsFromGroupedData } from './deriveColumnsFromGroupedData'

export class KanbanPropertyView extends BasesView {
	readonly type = KANBAN_PROPERTY_ID
	private readonly containerEl: HTMLElement
	private boardActor: Actor<typeof boardMachine> | null = null
	private cardDragActor: Actor<typeof cardDragMachine> | null = null
	private isSyncingFromConfig = false

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

	private parseUserDefinedColumns(): string[] {
		try {
			const raw = this.config.get('userDefinedColumns')
			if (!raw || typeof raw !== 'string') return []
			const parsed = JSON.parse(raw) as unknown
			if (!Array.isArray(parsed)) return []
			return parsed.filter((x): x is string => typeof x === 'string')
		} catch {
			return []
		}
	}

	onDataUpdated(): void {
		const cardProperties: BasesPropertyId[] = this.config.getOrder() ?? []
		const cardSize = (this.config.get('cardSize') as number | null) ?? 220
		const showEmptyColumns =
			(this.config.get('showEmptyColumns') as boolean | null) ?? true
		const showUncategorized =
			(this.config.get('showUncategorized') as boolean | null) ?? true
		const userDefinedColumns = this.parseUserDefinedColumns()

		// Use the config as the primary signal for whether group-by is configured.
		// Relying on data alone is unreliable: when group-by IS set but no notes
		// have that property value, groupedData only contains the uncategorized
		// group (all hasKey() === false), which looks identical to "no group-by".
		const groupByProperty = (
			(this.config as unknown as { groupBy?: { property?: string } | null }).groupBy
		)?.property
		const groupByConfigured = !!groupByProperty

		const result = deriveColumnsFromGroupedData(
			this.data.groupedData,
			userDefinedColumns,
			groupByConfigured,
		)

		if (result.kind === 'no-group-by') {
			render(h(NoGroupByPrompt, null), this.containerEl)
			return
		}

		if (result.kind === 'unsupported-type') {
			render(h(UnsupportedTypeError, null), this.containerEl)
			return
		}

		const rawColumns = result.columns
		const columnNames = rawColumns.map(c => c.name)

		if (!this.cardDragActor) {
			this.cardDragActor = createActor(cardDragMachine)
			this.cardDragActor.start()
		}

		if (!this.boardActor) {
			// First board-mode call: initialise actor from saved boardState
			const saved = this.parseBoardState()
			const savedByName = new Map(saved.map(r => [r.name, r]))
			const savedNames = saved.map(r => r.name)

			// Order raw columns by saved names, append unknowns
			const orderedNames = [
				...savedNames.filter(n => columnNames.includes(n)),
				...columnNames.filter(n => !savedByName.has(n)),
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

			this.boardActor.start()

			// Persist board state on any actor change (icons, collapse, reorder)
			this.boardActor.subscribe(snapshot => {
				if (this.isSyncingFromConfig) return
				this.config.set(
					'boardState',
					JSON.stringify(snapshot.context.columns),
				)
			})
		} else {
			// Subsequent calls: merge live columns into existing actor
			this.isSyncingFromConfig = true
			this.boardActor.send({ type: 'MERGE_COLUMNS', folderNames: columnNames })
			this.isSyncingFromConfig = false
		}

		render(
			h(
				KanbanViewContext.Provider,
				{ value: this },
				h(
					AppContext.Provider,
					{ value: this.app },
					h(KanbanPropertyBoard, {
						columns: rawColumns,
						showEmptyColumns,
						showUncategorized,
						cardProperties,
						cardSize,
						boardActor: this.boardActor,
						cardDragActor: this.cardDragActor,
					}),
				),
			),
			this.containerEl,
		)
	}

	async createFileForView(): Promise<void> {
		// Part V will write the group-by property value; for now create at vault root.
		const base = 'Untitled'
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

	// -------------------------------------------------------------------------
	// IKanbanViewActions

	async addColumn(name: string): Promise<void> {
		const trimmed = name.trim()
		if (!trimmed) return
		const current = this.parseUserDefinedColumns()
		if (current.includes(trimmed)) return
		this.config.set('userDefinedColumns', JSON.stringify([...current, trimmed]))
		// boardMachine will append the column on the next MERGE_COLUMNS
	}

	setColumnRoot(_folderPath: string): void {
		// No-op for property view — column root is not folder-based
	}

	async renameColumn(oldName: string, newName: string): Promise<void> {
		// Part V: update property values on all cards in the column.
		// For now just update the actor so the UI reflects the rename.
		const trimmed = newName.trim()
		if (!trimmed || trimmed === oldName) return
		this.boardActor?.send({ type: 'RENAME_COLUMN', oldName, newName: trimmed })
	}

	async removeColumn(columnName: string, _targetColumnName?: string): Promise<void> {
		// Part V: move/delete cards. For now remove from userDefinedColumns only.
		const current = this.parseUserDefinedColumns()
		this.config.set(
			'userDefinedColumns',
			JSON.stringify(current.filter(n => n !== columnName)),
		)
	}

	async addCard(_columnName: string, _name: string): Promise<void> {
		// Part V stub
	}

	async dropCard(_filePath: string, _targetColumnName: string): Promise<void> {
		// Part IV stub
	}
}
