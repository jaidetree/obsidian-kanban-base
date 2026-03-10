import { useSignal, useSignalEffect } from '@preact/signals'
import { useActorRef, useActorState } from 'hooks/xstate'
import type { App, BasesPropertyId } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useState } from 'preact/hooks'
import type { BoardColumnStates } from 'types/columns'
import type { BoardIcons } from 'types/icons'
import { type Actor } from 'xstate'
import {
	columnOrderMachine,
	reorderColumns,
} from '../../machines/columnOrderMachine'
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
	columnOrderActor: Actor<typeof columnOrderMachine>
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
	columnOrderActor,
	app,
}: KanbanBoardProps) {
	const iconsSignal = useSignal(columnIcons)
	const columnStatesSignal = useSignal(columnStates)
	const [adding, setAdding] = useState(false)
	const [newName, setNewName] = useState('')

	const actorRef = useActorRef(columnOrderActor)
	const [dragSnapshot, dragSend] = useActorState(actorRef)

	// Machine context is the source of truth for committed column order
	const { columns: committedNames, dragIndex, dropIndex } = dragSnapshot.context
	const displayNames =
		dragSnapshot.matches('dragging') && dragIndex !== null && dropIndex !== null
			? reorderColumns(committedNames, dragIndex, dropIndex)
			: committedNames

	// Map names → actual column data; append any columns not yet in machine context
	const known = new Set(displayNames)
	const previewColumns: IKanbanColumn[] = [
		...displayNames
			.map(name => columns.find(c => c.folder.name === name))
			.filter((c): c is IKanbanColumn => c !== undefined),
		...columns.filter(c => !known.has(c.folder.name)),
	]

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
			{previewColumns.map((column, idx) => (
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
					dragIndex={idx}
					onDragStart={index =>
						dragSend({ type: 'DRAG_START', index })
					}
					onDragOver={index => dragSend({ type: 'DRAG_OVER', index })}
					onDrop={() => dragSend({ type: 'DROP' })}
					onDragCancel={() => dragSend({ type: 'CANCEL' })}
					isDragging={
						dragSnapshot.matches('dragging') && dragIndex === idx
					}
					isDragTarget={
						dragSnapshot.matches('dragging') && dropIndex === idx
					}
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
