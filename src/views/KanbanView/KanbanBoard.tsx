import { useSignal, useSignalEffect } from '@preact/signals'
import type { App, BasesPropertyId } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useState } from 'preact/hooks'
import type { BoardColumnStates } from 'types/columns'
import type { BoardIcons } from 'types/icons'
import { KanbanColumn } from './KanbanColumn'
import type { IKanbanColumn } from './KanbanView'

interface KanbanBoardProps {
	columns: IKanbanColumn[]
	app: App
	cardProperties: string[]
	cardSize: number
	columnIcons: BoardIcons
	columnStates: BoardColumnStates
	onAddColumn: (name: string) => Promise<void>
	onUpdateIcons: (icons: BoardIcons) => void
	onUpdateColumnStates: (states: BoardColumnStates) => void
	onRenameColumn: (oldName: string, newName: string) => Promise<void>
}

export function KanbanBoard({
	columns,
	cardProperties,
	cardSize,
	columnIcons,
	columnStates,
	onAddColumn,
	onUpdateIcons,
	onUpdateColumnStates,
	onRenameColumn,
	app,
}: KanbanBoardProps) {
	const iconsSignal = useSignal(columnIcons)
	const columnStatesSignal = useSignal(columnStates)
	const [adding, setAdding] = useState(false)
	const [newName, setNewName] = useState('')

	const handleConfirm = async () => {
		const name = newName.trim()
		if (!name) return
		await onAddColumn(name)
		setAdding(false)
		setNewName('')
	}

	const handleCancel = () => {
		setAdding(false)
		setNewName('')
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') void handleConfirm()
		if (e.key === 'Escape') handleCancel()
	}

	useSignalEffect(() => {
		onUpdateIcons(iconsSignal.value)
	})

	useSignalEffect(() => {
		onUpdateColumnStates(columnStatesSignal.value)
	})

	const handleStateChange = (
		folderName: string,
		state: { isCollapsed: boolean },
	) => {
		columnStatesSignal.value = {
			...columnStatesSignal.value,
			[folderName]: state,
		}
	}

	return (
		<div
			class="kanban-base-board"
			style={
				{ '--kanban-column-width': `${cardSize}px` } as CSSProperties
			}
		>
			{columns.map(column => (
				<KanbanColumn
					key={column.folder.path}
					app={app}
					column={column}
					cardProperties={cardProperties as BasesPropertyId[]}
					iconsSignal={iconsSignal}
					isCollapsed={
						columnStatesSignal.value[column.folder.name]
							?.isCollapsed ?? false
					}
					onStateChange={handleStateChange}
					onRenameColumn={onRenameColumn}
				/>
			))}
			{adding ? (
				<div class="kanban-base-column-add">
					<input
						class="kanban-base-column-add-input"
						type="text"
						placeholder="Column name"
						value={newName}
						onInput={e =>
							setNewName((e.target as HTMLInputElement).value)
						}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<div class="kanban-base-column-add-actions">
						<button
							class="kanban-base-column-add-confirm"
							onClick={() => void handleConfirm()}
						>
							Add
						</button>
						<button
							class="kanban-base-column-add-cancel"
							onClick={handleCancel}
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<button
					class="kanban-base-add-column"
					onClick={() => setAdding(true)}
				>
					+ Add column
				</button>
			)}
		</div>
	)
}
