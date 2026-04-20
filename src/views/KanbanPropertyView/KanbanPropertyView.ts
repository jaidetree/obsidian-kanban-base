import type { App, BasesPropertyId } from 'obsidian'
import { BasesView, TFile, type QueryController } from 'obsidian'
import { h, render } from 'preact'
import { createActor, type Actor } from 'xstate'
import { KANBAN_PROPERTY_ID } from '.'
import { boardMachine, type ColumnRecord } from '../../machines/boardMachine'
import { cardPropertyDragMachine } from '../../machines/cardPropertyDragMachine'
import { AppContext } from '../KanbanBase/AppContext'
import { KanbanViewContext } from '../KanbanBase/KanbanViewContext'
import { parseBoardState } from '../KanbanBase/parseBoardState'
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
	private cardDragActor: Actor<typeof cardPropertyDragMachine> | null = null
	private isSyncingFromConfig = false
	private groupByPropertyKey = ''
	private cardFolderPath = ''

	constructor(
		controller: QueryController,
		containerEl: HTMLElement,
		app: App,
	) {
		super(controller)
		this.containerEl = containerEl
		this.app = app
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
			this.config as unknown as { groupBy?: { property?: string } | null }
		).groupBy?.property
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
			this.cardDragActor = createActor(cardPropertyDragMachine)
			this.cardDragActor.start()
		}

		// Strip the "note." prefix that Bases adds to property IDs (e.g. "note.Status" → "Status")
		// Store on the instance so addCard / renameColumn / removeColumn can use it.
		this.groupByPropertyKey = groupByProperty?.startsWith('note.')
			? groupByProperty.slice(5)
			: (groupByProperty ?? '')

		this.cardFolderPath =
			(this.config.get('cardFolder') as string | null) ?? ''

		if (!this.boardActor) {
			// First board-mode call: initialise actor from saved boardState
			const saved = parseBoardState(this.config)
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
			this.boardActor.send({
				type: 'MERGE_COLUMNS',
				folderNames: columnNames,
			})
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
						groupByProperty: this.groupByPropertyKey,
						boardActor: this.boardActor,
						cardDragActor: this.cardDragActor,
					}),
				),
			),
			this.containerEl,
		)
	}

	async createFileForView(): Promise<void> {
		const displayColumns =
			this.boardActor?.getSnapshot().context.displayColumns ?? []
		const firstColumnName = displayColumns[0]?.name ?? null

		if (
			firstColumnName &&
			firstColumnName !== 'Uncategorized' &&
			this.groupByPropertyKey
		) {
			const key = this.groupByPropertyKey
			const columnName = firstColumnName
			await super.createFileForView(
				undefined,
				(fm: Record<string, unknown>) => {
					fm[key] = columnName
				},
			)
		} else {
			await super.createFileForView()
		}
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
		this.config.set(
			'userDefinedColumns',
			JSON.stringify([...current, trimmed]),
		)
		// boardMachine will append the column on the next MERGE_COLUMNS
	}

	setColumnRoot(_folderPath: string): void {
		// No-op for property view — column root is not folder-based
	}

	async renameColumn(oldName: string, newName: string): Promise<void> {
		const trimmed = newName.trim()
		if (!trimmed || trimmed === oldName) return

		// Write the new value to every card in the column
		if (this.groupByPropertyKey && oldName !== 'Uncategorized') {
			const key = this.groupByPropertyKey
			const group = this.data.groupedData.find(
				g => g.hasKey() && g.key?.toString() === oldName,
			)
			if (group) {
				for (const entry of group.entries) {
					if (entry.file instanceof TFile) {
						await this.app.fileManager.processFrontMatter(
							entry.file,
							(fm: Record<string, unknown>) => {
								fm[key] = trimmed
							},
						)
					}
				}
			}
		}

		// Update userDefinedColumns if this was a user-defined column
		const current = this.parseUserDefinedColumns()
		if (current.includes(oldName)) {
			this.config.set(
				'userDefinedColumns',
				JSON.stringify(current.map(n => (n === oldName ? trimmed : n))),
			)
		}

		this.boardActor?.send({
			type: 'RENAME_COLUMN',
			oldName,
			newName: trimmed,
		})
	}

	async removeColumn(
		columnName: string,
		targetColumnName?: string,
	): Promise<void> {
		// Move cards to target column if one was specified
		if (targetColumnName !== undefined && this.groupByPropertyKey) {
			const key = this.groupByPropertyKey
			const group = this.data.groupedData.find(g =>
				columnName === 'Uncategorized'
					? !g.hasKey()
					: g.hasKey() && g.key?.toString() === columnName,
			)
			if (group) {
				for (const entry of group.entries) {
					if (entry.file instanceof TFile) {
						await this.app.fileManager.processFrontMatter(
							entry.file,
							(fm: Record<string, unknown>) => {
								if (targetColumnName === 'Uncategorized') {
									delete fm[key]
								} else {
									fm[key] = targetColumnName
								}
							},
						)
					}
				}
			}
		}

		const current = this.parseUserDefinedColumns()
		this.config.set(
			'userDefinedColumns',
			JSON.stringify(current.filter(n => n !== columnName)),
		)
		// next onDataUpdated MERGE_COLUMNS drops the record from boardActor automatically
	}

	async addCard(columnName: string, name: string): Promise<void> {
		const trimmed = name.trim()
		if (!trimmed) return
		const prefix = this.cardFolderPath ? `${this.cardFolderPath}/` : ''
		let path = `${prefix}${trimmed}.md`
		let i = 1
		while (this.app.vault.getAbstractFileByPath(path)) {
			path = `${prefix}${trimmed} ${i}.md`
			i++
		}
		const file = await this.app.vault.create(path, '')
		if (columnName !== 'Uncategorized' && this.groupByPropertyKey) {
			const key = this.groupByPropertyKey
			await this.app.fileManager.processFrontMatter(
				file,
				(fm: Record<string, unknown>) => {
					fm[key] = columnName
				},
			)
		}
	}

	async dropCard(filePath: string, targetColumnName: string): Promise<void> {
		const groupByPropertyKey = this.groupByPropertyKey
		if (!groupByPropertyKey) return

		const file = this.app.vault.getAbstractFileByPath(filePath)
		if (!(file instanceof TFile)) return

		await this.app.fileManager.processFrontMatter(
			file,
			(fm: Record<string, unknown>) => {
				if (targetColumnName === 'Uncategorized') {
					delete fm[groupByPropertyKey]
				} else {
					fm[groupByPropertyKey] = targetColumnName
				}
			},
		)
	}
}
