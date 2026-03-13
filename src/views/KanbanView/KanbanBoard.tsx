import { useSignal, useSignalEffect } from '@preact/signals'
import { useActorRef, useActorState } from 'hooks/xstate'
import type { BasesPropertyId, TFolder } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useState } from 'preact/hooks'
import type { BoardColumnStates } from 'types/columns'
import type { BoardIcons } from 'types/icons'
import { type Actor } from 'xstate'
import { cardDragMachine } from '../../machines/cardDragMachine'
import { columnOrderMachine } from '../../machines/columnOrderMachine'
import { FolderSuggestModal } from './FolderSuggestModal'
import { InlineForm, InlineFormProps } from './InlineForm'
import { KanbanColumn } from './KanbanColumn'
import type { IKanbanColumn } from './KanbanView'
import { useKanbanView } from './KanbanViewContext'

interface EmptyBoardProps {}

function EmptyBoard({}: EmptyBoardProps) {
	const view = useKanbanView()

	return (
		<div class="kanban-base-no-root">
			<p class="kanban-base-no-root-message">
				Select a root folder to get started
			</p>
			<button
				class="kanban-base-no-root-button"
				onClick={() => {
					new FolderSuggestModal(app, (folder: TFolder) => {
						view.setColumnRoot(folder.path)
					}).open()
				}}
			>
				Select folder
			</button>
		</div>
	)
}

interface NewColumnProps {
	onSubmit: (newColumnName: string) => void
	onCancel: InlineFormProps['onCancel']
}

function NewColumn({ onCancel, onSubmit }: NewColumnProps) {
	const [newName, setNewName] = useState('')

	return (
		<InlineForm
			class="kanban-base-add-column"
			placeholder="New column name"
			value={newName}
			onInput={e => setNewName(e.currentTarget.value)}
			onCancel={onCancel}
			onSubmit={_e => onSubmit(newName.trim())}
		/>
	)
}

export interface KanbanBoardProps {
	columns: IKanbanColumn[]
	cardProperties: string[]
	cardSize: number
	columnIcons: BoardIcons
	columnStates: BoardColumnStates
	columnRootSet: boolean
	columnOrderActor: Actor<typeof columnOrderMachine>
	cardDragActor: Actor<typeof cardDragMachine>
}

export function KanbanBoard({
	columns,
	cardProperties,
	cardSize,
	columnIcons,
	columnStates,
	columnRootSet,
	columnOrderActor,
	cardDragActor,
}: KanbanBoardProps) {
	const view = useKanbanView()

	const iconsSignal = useSignal(columnIcons)
	const columnStatesSignal = useSignal(columnStates)
	const [adding, setAdding] = useState(false)

	const actorRef = useActorRef(columnOrderActor)
	const [dragSnapshot, dragSend] = useActorState(actorRef)

	const cardDragActorRef = useActorRef(cardDragActor)
	const [cardDragSnapshot, cardDragSend] = useActorState(cardDragActorRef)

	const handleCardDrop = (folderName: string) => {
		const snap = cardDragActorRef.current.getSnapshot()
		if (
			snap.value === 'dragging' &&
			snap.context.dragFile !== null &&
			snap.context.sourceColumn !== folderName
		) {
			void view.dropCard(snap.context.dragFile, folderName)
		}
		cardDragSend({ type: 'DROP' })
	}

	const {
		displayColumns: displayNames,
		dragIndex,
		dropIndex,
	} = dragSnapshot.context

	// Map names → actual column data; append any columns not yet in machine context
	const known = new Set(displayNames)
	const previewColumns: IKanbanColumn[] = [
		...displayNames
			.map(name => columns.find(c => c.folder.name === name))
			.filter((c): c is IKanbanColumn => c !== undefined),
		...columns.filter(c => !known.has(c.folder.name)),
	]

	async function handleConfirmNewColumn(newColumnName: string) {
		if (!newColumnName) return
		await view.addColumn(newColumnName)
		setAdding(false)
	}

	useSignalEffect(() => {
		view.updateIcons(iconsSignal.value)
	})

	useSignalEffect(() => {
		view.updateColumnStates(columnStatesSignal.value)
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
				{
					'--kanban-column-width': `${cardSize}px`,
				} as CSSProperties
			}
		>
			{previewColumns.map((column, idx) => (
				<KanbanColumn
					key={column.folder.path}
					column={column}
					cardProperties={cardProperties as BasesPropertyId[]}
					iconsSignal={iconsSignal}
					isCollapsed={
						columnStatesSignal.value[column.folder.name]
							?.isCollapsed ?? false
					}
					onStateChange={handleStateChange}
					otherColumnNames={previewColumns
						.filter(c => c.folder.name !== column.folder.name)
						.map(c => c.folder.name)}
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
					onCardDragStart={filePath =>
						cardDragSend({
							type: 'DRAG_START',
							filePath,
							sourceColumn: column.folder.name,
						})
					}
					onCardDragOver={() =>
						cardDragSend({
							type: 'DRAG_OVER',
							targetColumn: column.folder.name,
						})
					}
					onCardDrop={() => handleCardDrop(column.folder.name)}
					onCardDragCancel={() => cardDragSend({ type: 'CANCEL' })}
					isCardDragTarget={
						cardDragSnapshot.matches('dragging') &&
						cardDragSnapshot.context.targetColumn ===
							column.folder.name
					}
				/>
			))}
			{!columnRootSet ? (
				<EmptyBoard />
			) : adding ? (
				<NewColumn
					onSubmit={(newColumnString: string) => {
						handleConfirmNewColumn(newColumnString)
					}}
					onCancel={() => {
						setAdding(false)
					}}
				/>
			) : (
				<button
					class="kanban-base__add-column"
					onClick={() => setAdding(true)}
				>
					+ Add column
				</button>
			)}
		</div>
	)
}
