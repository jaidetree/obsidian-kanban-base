import type { SendFrom } from 'hooks/xstate'
import { useXState } from 'hooks/xstate'
import type { BasesPropertyId } from 'obsidian'
import { Menu } from 'obsidian'
import type { Icon } from 'types/icons'
import type { SnapshotFrom } from 'xstate'
import { columnMachine } from '../../machines/columnMachine'
import { useApp } from './AppContext'
import { IconSuggestModal } from './IconSuggestModal'
import { InlineForm } from './InlineForm'
import { KanbanCard } from './KanbanCard'
import type { IKanbanColumn } from './types'
import { useKanbanView } from './KanbanViewContext'
import { ObsidianIcon } from './ObsidianIcon'
import { RemoveColumnModal } from './RemoveColumnModal'

const DEFAULT_ICON = 'lucide-circle'

interface IconButtonProps {
	icon: Icon | null
	onIconChange: (icon: Icon | null) => void
	disabled?: boolean
}

function IconButton({ icon, onIconChange, disabled }: IconButtonProps) {
	const app = useApp()
	const displayIcon = icon?.value ?? DEFAULT_ICON
	const isDefault = icon === null

	const handleClick = () => {
		if (disabled) return
		new IconSuggestModal(app, selectedIcon => onIconChange(selectedIcon)).open()
	}

	return (
		<button
			class={`kanban-base-icon-btn clickable-icon${isDefault ? ' kanban-base-icon-btn--default' : ''}`}
			onClick={handleClick}
			disabled={disabled}
			aria-label="Change column icon"
		>
			{icon?.prefix === 'Emoji' ? (
				displayIcon
			) : (
				<ObsidianIcon iconId={displayIcon} />
			)}
		</button>
	)
}

interface KanbanColumnDragHandleProps {
	onDragStart: () => void
}

function KanbanColumnDragHandle({ onDragStart }: KanbanColumnDragHandleProps) {
	return (
		<span
			class="kanban-base-column-drag-handle"
			draggable
			onDragStart={e => {
				e.dataTransfer!.effectAllowed = 'move'
				onDragStart()
			}}
		>
			<ObsidianIcon iconId="lucide-grip-vertical" />
		</span>
	)
}

interface KanbanColumnRenameInputProps {
	draft: string
	columnName: string
	send: SendFrom<typeof columnMachine>
}

function KanbanColumnRenameInput({
	draft,
	columnName,
	send,
}: KanbanColumnRenameInputProps) {
	const view = useKanbanView()

	function handleSubmit(_e: SubmitEvent) {
		const newName = draft.trim()
		send({ type: 'CONFIRM' })
		if (newName && newName !== columnName) {
			void view.renameColumn(columnName, newName)
		}
	}

	return (
		<InlineForm
			value={draft}
			onSubmit={handleSubmit}
			onInput={e => {
				send({
					type: 'SET_DRAFT',
					draft: e.currentTarget.value,
				})
			}}
			onCancel={() => {
				send({ type: 'CANCEL' })
			}}
		/>
	)
}

interface KanbanColumnHeaderProps {
	columnName: string
	icon: Icon | null
	onIconChange: (icon: Icon | null) => void
	isCollapsed: boolean
	onToggleCollapse: () => void
	snapshot: SnapshotFrom<typeof columnMachine>
	send: SendFrom<typeof columnMachine>
	onDragStart: () => void
	onRemoveColumn: () => void
}

function KanbanColumnHeader({
	columnName,
	icon,
	onIconChange,
	isCollapsed,
	onToggleCollapse,
	snapshot,
	send,
	onDragStart,
	onRemoveColumn,
}: KanbanColumnHeaderProps) {
	const handleMenuClick = (evt: MouseEvent) => {
		const menu = new Menu()
		menu.addItem(item => {
			item.setTitle(isCollapsed ? 'Expand' : 'Collapse')
				.setIcon(isCollapsed ? 'chevron-down' : 'chevron-up')
				.onClick(onToggleCollapse)
		})
		menu.addItem(item => {
			item.setTitle('Remove icon')
				.setIcon('lucide-x')
				.onClick(() => {
					onIconChange(null)
				})
		})
		if (!isCollapsed) {
			menu.addItem(item => {
				item.setTitle('Rename column')
					.setIcon('lucide-pencil')
					.onClick(() => {
						send({ type: 'RENAME' })
					})
			})
			menu.addItem(item => {
				item.setTitle('Remove column')
					.setIcon('lucide-trash')
					.onClick(onRemoveColumn)
			})
		}
		menu.showAtMouseEvent(evt)
	}

	return (
		<div class="kanban-base-column-header">
			<KanbanColumnDragHandle onDragStart={onDragStart} />
			<IconButton
				icon={icon}
				onIconChange={onIconChange}
				disabled={isCollapsed}
			/>
			{snapshot.value === 'editing' ? (
				<KanbanColumnRenameInput
					draft={snapshot.context.draft}
					columnName={columnName}
					send={send}
				/>
			) : (
				<h2>{snapshot.context.name}</h2>
			)}
			<button
				class="kanban-base-column-menu-btn clickable-icon"
				aria-label="Column options"
				onClick={handleMenuClick}
			>
				<ObsidianIcon iconId="lucide-more-horizontal" />
			</button>
		</div>
	)
}

interface KanbanColumnAddCardProps {
	snapshot: SnapshotFrom<typeof columnMachine>
	send: SendFrom<typeof columnMachine>
	columnName: string
}

function KanbanColumnAddCard({
	snapshot,
	send,
	columnName,
}: KanbanColumnAddCardProps) {
	const view = useKanbanView()

	async function handleSubmit(_e: SubmitEvent) {
		const name = snapshot.context.newCardName.trim()
		if (name) await view.addCard(columnName, name)
		send({ type: 'CONFIRM' })
	}

	return (
		<div class="kanban-base-column__add-card">
			{snapshot.value === 'addingCard' ? (
				<InlineForm
					placeholder="Card name"
					value={snapshot.context.newCardName}
					onSubmit={e => { void handleSubmit(e) }}
					onInput={e => {
						send({
							type: 'SET_NEW_CARD_NAME',
							name: e.currentTarget.value,
						})
					}}
					onCancel={() => {
						send({ type: 'CANCEL' })
					}}
				/>
			) : (
				<button
					class="kanban-base-column__add"
					onClick={() => send({ type: 'ADD_CARD' })}
				>
					<ObsidianIcon iconId="lucide-plus-circle" />
					Add Card
				</button>
			)}
		</div>
	)
}

interface KanbanColumnProps {
	column: IKanbanColumn
	cardProperties: BasesPropertyId[]
	icon: Icon | null
	onIconChange: (icon: Icon | null) => void
	isCollapsed: boolean
	onCollapse: (isCollapsed: boolean) => void
	otherColumnNames: string[]
	dragIndex: number
	onDragStart: (index: number) => void
	onDragOver: (index: number) => void
	onDrop: () => void
	onDragCancel: () => void
	isDragging: boolean
	isDragTarget: boolean
	onCardDragStart: (filePath: string) => void
	onCardDragOver: () => void
	onCardDrop: () => void
	onCardDragCancel: () => void
	isCardDragTarget: boolean
	showAddTop?: boolean
	showAddBottom?: boolean
}

export function KanbanColumn({
	column,
	cardProperties,
	icon,
	onIconChange,
	isCollapsed,
	onCollapse,
	otherColumnNames,
	dragIndex,
	onDragStart,
	onDragOver,
	onDrop,
	onDragCancel,
	isDragging,
	isDragTarget,
	onCardDragStart,
	onCardDragOver,
	onCardDrop,
	onCardDragCancel,
	isCardDragTarget,
	showAddTop = false,
	showAddBottom = true,
}: KanbanColumnProps) {
	const app = useApp()
	const view = useKanbanView()

	// Primary machine: drives column rename (header) and top add-card (if shown)
	const [snapshot, send] = useXState(columnMachine, {
		input: { name: column.name },
	})

	// Independent machine for the bottom add-card so top and bottom don't share state
	const [bottomSnapshot, bottomSend] = useXState(columnMachine, {
		input: { name: column.name },
	})

	const handleRemoveColumn = () => {
		if (column.entries.length === 0) {
			void view.removeColumn(column.name)
		} else {
			new RemoveColumnModal(
				app,
				column.name,
				otherColumnNames,
				targetName => {
					void view.removeColumn(column.name, targetName)
				},
			).open()
		}
	}

	const dragClasses = [
		'kanban-base-column',
		isCollapsed ? 'kanban-base-column--collapsed' : '',
		isDragging ? 'kanban-base-column--dragging' : '',
		isDragTarget ? 'kanban-base-column--drop-target' : '',
		isCardDragTarget ? 'kanban-base-column--card-drop-target' : '',
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div
			class={dragClasses}
			onDragOver={e => {
				e.preventDefault()
				if (e.dataTransfer?.types.includes('text/card')) {
					onCardDragOver()
				} else {
					onDragOver(dragIndex)
				}
			}}
			onDrop={e => {
				e.preventDefault()
				if (e.dataTransfer?.types.includes('text/card')) {
					onCardDrop()
				} else {
					onDrop()
				}
			}}
			onDragEnd={() => {
				onDragCancel()
			}}
		>
			<div class="kanban-base-column-container">
				<KanbanColumnHeader
					columnName={column.name}
					icon={icon}
					onIconChange={onIconChange}
					isCollapsed={isCollapsed}
					onToggleCollapse={() => onCollapse(!isCollapsed)}
					snapshot={snapshot}
					send={send}
					onDragStart={() => onDragStart(dragIndex)}
					onRemoveColumn={handleRemoveColumn}
				/>
				{!isCollapsed && (
					<div class="kanban-base-column-body">
						{showAddTop && (
							<KanbanColumnAddCard
								snapshot={snapshot}
								send={send}
								columnName={column.name}
							/>
						)}
						{column.entries.map(entry => (
							<KanbanCard
								key={entry.file.path}
								entry={entry}
								cardProperties={cardProperties}
								onDragStart={onCardDragStart}
								onDragCancel={onCardDragCancel}
							/>
						))}
						{showAddBottom && (
							<KanbanColumnAddCard
								snapshot={bottomSnapshot}
								send={bottomSend}
								columnName={column.name}
							/>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
