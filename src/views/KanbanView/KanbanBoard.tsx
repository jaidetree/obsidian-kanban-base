import { useSignal, useSignalEffect } from '@preact/signals'
import { useXState } from 'hooks/xstate'
import type { App, BasesPropertyId } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import type { BoardColumnStates } from 'types/columns'
import type { BoardIcons } from 'types/icons'
import { columnOrderMachine, reorderColumns } from '../../machines/columnOrderMachine'
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
	onUpdateColumnOrder: (newOrder: string[]) => void
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
	onUpdateColumnOrder,
	app,
}: KanbanBoardProps) {
	const iconsSignal = useSignal(columnIcons)
	const columnStatesSignal = useSignal(columnStates)
	const [adding, setAdding] = useState(false)
	const [newName, setNewName] = useState('')

	const [dragSnapshot, dragSend] = useXState(columnOrderMachine)

	// Compute preview order during drag
	const { dragIndex, dropIndex } = dragSnapshot.context
	const columnNames = columns.map(c => c.folder.name)
	const previewNames =
		dragSnapshot.matches('dragging') &&
		dragIndex !== null &&
		dropIndex !== null
			? reorderColumns(columnNames, dragIndex, dropIndex)
			: columnNames
	const previewColumns = previewNames
		.map(name => columns.find(c => c.folder.name === name))
		.filter((c): c is IKanbanColumn => c !== undefined)

	// Fire onUpdateColumnOrder when machine enters reordered state
	useEffect(() => {
		if (
			dragSnapshot.matches('reordered') &&
			dragIndex !== null &&
			dropIndex !== null
		) {
			const newOrder = reorderColumns(columnNames, dragIndex, dropIndex)
			onUpdateColumnOrder(newOrder)
		}
	}, [dragSnapshot.value])

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
					onDragStart={index => dragSend({ type: 'DRAG_START', index })}
					onDragOver={index => dragSend({ type: 'DRAG_OVER', index })}
					onDrop={() => dragSend({ type: 'DROP' })}
					onDragCancel={() => dragSend({ type: 'CANCEL' })}
					isDragging={dragSnapshot.matches('dragging') && dragIndex === idx}
					isDragTarget={dragSnapshot.matches('dragging') && dropIndex === idx}
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
