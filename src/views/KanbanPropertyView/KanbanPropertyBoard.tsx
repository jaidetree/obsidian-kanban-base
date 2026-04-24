import { useActorRef, useActorState } from 'hooks/xstate'
import type { BasesPropertyId } from 'obsidian'
import type { CSSProperties } from 'preact'
import { useState } from 'preact/hooks'
import type { Actor } from 'xstate'
import { boardMachine } from '../../machines/boardMachine'
import { cardPropertyDragMachine } from '../../machines/cardPropertyDragMachine'
import { InlineForm } from '../KanbanBase/InlineForm'
import { KanbanColumn } from '../KanbanBase/KanbanColumn'
import { useKanbanView } from '../KanbanBase/KanbanViewContext'
import type { IKanbanPropertyColumn } from './types'

export function NoGroupByPrompt() {
	return (
		<div class="kanban-base-no-root">
			<p class="kanban-base-no-root-message">
				Select a group-by field in the Bases UI to use the Kanban view.
			</p>
		</div>
	)
}

export function UnsupportedTypeError() {
	return (
		<div class="kanban-base-no-root">
			<p class="kanban-base-no-root-message">
				This property type is not supported by the Kanban view. Please select a
				text or status property as the group-by field.
			</p>
		</div>
	)
}

interface NewColumnProps {
	onSubmit: (name: string) => void
	onCancel: () => void
}

function NewColumn({ onSubmit, onCancel }: NewColumnProps) {
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

export interface KanbanPropertyBoardProps {
	columns: IKanbanPropertyColumn[]
	showEmptyColumns: boolean
	showUncategorized: boolean
	cardProperties: BasesPropertyId[]
	cardSize: number
	groupByProperty: string
	boardActor: Actor<typeof boardMachine>
	cardDragActor: Actor<typeof cardPropertyDragMachine>
	addCardTop: boolean
	addCardBottom: boolean
}

export function KanbanPropertyBoard({
	columns,
	showEmptyColumns,
	showUncategorized,
	cardProperties,
	cardSize,
	groupByProperty,
	boardActor,
	cardDragActor,
	addCardTop,
	addCardBottom,
}: KanbanPropertyBoardProps) {
	const view = useKanbanView()
	const [addingColumn, setAddingColumn] = useState(false)

	const boardActorRef = useActorRef(boardActor)
	const [boardSnapshot, boardSend] = useActorState(boardActorRef)

	const cardDragActorRef = useActorRef(cardDragActor)
	const [cardDragSnapshot, cardDragSend] = useActorState(cardDragActorRef)

	const handleCardDrop = (columnName: string) => {
		const snap = cardDragActorRef.current.getSnapshot()
		if (
			snap.value === 'dragging' &&
			snap.context.dragFile !== null &&
			snap.context.sourceColumn !== columnName
		) {
			void view.dropCard(snap.context.dragFile, columnName)
		}
		cardDragSend({ type: 'DROP' })
	}

	const { displayColumns, dragIndex, dropIndex } = boardSnapshot.context

	// Map board records to columns, then apply visibility filters
	const visibleColumns = displayColumns
		.map(record => ({
			record,
			column: columns.find(c => c.name === record.name),
		}))
		.filter(
			(x): x is { record: typeof x.record; column: IKanbanPropertyColumn } =>
				x.column !== undefined,
		)
		.filter(({ column }) => showUncategorized || !column.isUncategorized)
		.filter(({ column }) => showEmptyColumns || column.entries.length > 0)

	return (
		<div
			class="kanban-base-board"
			style={
				{
					'--kanban-column-width': `${cardSize}px`,
				} as CSSProperties
			}
		>
			{visibleColumns.map(({ record, column }, idx) => (
				<KanbanColumn
					key={column.name}
					column={column}
					cardProperties={cardProperties}
					icon={record.icon}
					onIconChange={icon =>
						boardSend({ type: 'SET_ICON', name: record.name, icon })
					}
					isCollapsed={record.isCollapsed}
					onCollapse={isCollapsed =>
						boardSend({ type: 'SET_COLLAPSE', name: record.name, isCollapsed })
					}
					otherColumnNames={visibleColumns
						.filter(x => x.record.name !== record.name)
						.map(x => x.record.name)}
					dragIndex={idx}
					onDragStart={index => boardSend({ type: 'DRAG_START', index })}
					onDragOver={index => boardSend({ type: 'DRAG_OVER', index })}
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
							sourceColumn: column.name,
							groupByProperty,
						})
					}
					onCardDragOver={() =>
						cardDragSend({ type: 'DRAG_OVER', targetColumn: column.name })
					}
					onCardDrop={() => handleCardDrop(column.name)}
					onCardDragCancel={() => cardDragSend({ type: 'CANCEL' })}
					isCardDragTarget={
						cardDragSnapshot.matches('dragging') &&
						cardDragSnapshot.context.targetColumn === column.name
					}
					showAddTop={addCardTop}
					showAddBottom={addCardBottom}
				/>
			))}
			{addingColumn ? (
				<NewColumn
					onSubmit={name => {
						if (name) void view.addColumn(name)
						setAddingColumn(false)
					}}
					onCancel={() => setAddingColumn(false)}
				/>
			) : (
				<button
					class="kanban-base__add-column"
					onClick={() => setAddingColumn(true)}
				>
					+ Add column
				</button>
			)}
		</div>
	)
}
