import { useActorRef, useActorState } from 'hooks/xstate'
import type { BasesPropertyId, TFolder } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useState } from 'preact/hooks'
import { type Actor } from 'xstate'
import { boardMachine } from '../../machines/boardMachine'
import { cardDragMachine } from '../../machines/cardDragMachine'
import { useApp } from './AppContext'
import { FolderSuggestModal } from './FolderSuggestModal'
import { InlineForm, InlineFormProps } from './InlineForm'
import { KanbanColumn } from './KanbanColumn'
import type { IKanbanColumn } from './KanbanView'
import { useKanbanView } from './KanbanViewContext'

function EmptyBoard() {
	const view = useKanbanView()
	const app = useApp()

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
	cardProperties: BasesPropertyId[]
	cardSize: number
	columnRootSet: boolean
	boardActor: Actor<typeof boardMachine>
	cardDragActor: Actor<typeof cardDragMachine>
}

export function KanbanBoard({
	columns,
	cardProperties,
	cardSize,
	columnRootSet,
	boardActor,
	cardDragActor,
}: KanbanBoardProps) {
	const view = useKanbanView()
	const [adding, setAdding] = useState(false)

	const boardActorRef = useActorRef(boardActor)
	const [boardSnapshot, boardSend] = useActorState(boardActorRef)

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

	const { displayColumns, dragIndex, dropIndex } = boardSnapshot.context

	const previewColumns = displayColumns
		.map(record => ({
			record,
			column: columns.find(c => c.folder.name === record.name),
		}))
		.filter(
			(x): x is { record: typeof x.record; column: IKanbanColumn } =>
				x.column !== undefined,
		)

	async function handleConfirmNewColumn(newColumnName: string) {
		if (!newColumnName) return
		await view.addColumn(newColumnName)
		setAdding(false)
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
			{previewColumns.map(({ record, column }, idx) => (
				<KanbanColumn
					key={column.folder.path}
					column={column}
					cardProperties={cardProperties}
					icon={record.icon}
					onIconChange={icon =>
						boardSend({ type: 'SET_ICON', name: record.name, icon })
					}
					isCollapsed={record.isCollapsed}
					onCollapse={isCollapsed => {
						boardSend({
							type: 'SET_COLLAPSE',
							name: record.name,
							isCollapsed,
						})
					}}
					otherColumnNames={previewColumns
						.filter(x => x.record.name !== record.name)
						.map(x => x.record.name)}
					dragIndex={idx}
					onDragStart={index =>
						boardSend({ type: 'DRAG_START', index })
					}
					onDragOver={index =>
						boardSend({ type: 'DRAG_OVER', index })
					}
					onDrop={() => boardSend({ type: 'DROP' })}
					onDragCancel={() => boardSend({ type: 'CANCEL' })}
					isDragging={
						boardSnapshot.matches('dragging') && dragIndex === idx
					}
					isDragTarget={
						boardSnapshot.matches('dragging') && dropIndex === idx
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
						void handleConfirmNewColumn(newColumnString)
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
