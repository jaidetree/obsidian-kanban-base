import type { Signal } from '@preact/signals'
import { useComputed } from '@preact/signals'
import { useXState } from 'hooks/xstate'
import type { BasesPropertyId } from 'obsidian'
import { Menu } from 'obsidian'
import { useEffect } from 'preact/hooks'
import { BoardIcons } from 'types/icons'
import { columnMachine } from '../../machines/columnMachine'
import { useApp } from './AppContext'
import { IconSuggestModal } from './IconSuggestModal'
import { KanbanCard } from './KanbanCard'
import type { IKanbanColumn } from './KanbanView'
import { ObsidianIcon } from './ObsidianIcon'

const DEFAULT_ICON = 'lucide-circle'

interface IconButtonProps {
	folderName: string
	iconsSignal: Signal<BoardIcons>
	disabled?: boolean
}

function IconButton({ folderName, iconsSignal, disabled }: IconButtonProps) {
	const app = useApp()
	const chosenIcon = useComputed(() => iconsSignal.value[folderName])
	const displayIcon = useComputed(
		() => chosenIcon.value?.value ?? DEFAULT_ICON,
	)

	const isDefault = chosenIcon.value === undefined

	const handleClick = () => {
		if (disabled) return
		const modal = new IconSuggestModal(app, icon => {
			iconsSignal.value = { ...iconsSignal.value, [folderName]: icon }
		})
		modal.open()
	}

	return (
		<button
			class={`kanban-base-icon-btn clickable-icon${isDefault ? ' kanban-base-icon-btn--default' : ''}`}
			onClick={handleClick}
			disabled={disabled}
			aria-label="Change column icon"
		>
			{chosenIcon.value?.prefix === 'Emoji' ? (
				displayIcon
			) : chosenIcon ? (
				<ObsidianIcon iconId={displayIcon.value} />
			) : null}
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

interface KanbanColumnProps {
	column: IKanbanColumn
	cardProperties: BasesPropertyId[]
	iconsSignal: Signal<BoardIcons>
	isCollapsed: boolean
	onStateChange: (folderName: string, state: { isCollapsed: boolean }) => void
	onRenameColumn: (oldName: string, newName: string) => Promise<void>
	onAddCard: (name: string) => Promise<void>
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
}

export function KanbanColumn({
	column,
	cardProperties,
	iconsSignal,
	isCollapsed,
	onStateChange,
	onRenameColumn,
	onAddCard,
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
}: KanbanColumnProps) {
	const [snapshot, send] = useXState(columnMachine, {
		input: { name: column.folder.name, isCollapsed },
	})

	useEffect(() => {
		onStateChange(column.folder.name, {
			isCollapsed: snapshot.context.isCollapsed,
		})
	}, [snapshot.context.isCollapsed])

	const handleMenuClick = (evt: MouseEvent) => {
		const menu = new Menu()
		if (!snapshot.context.isCollapsed) {
			menu.addItem(item => {
				item.setTitle('Rename')
					.setIcon('pencil')
					.onClick(() => {
						send({ type: 'RENAME' })
					})
			})
		}
		menu.addItem(item => {
			const collapsed = snapshot.context.isCollapsed
			item.setTitle(collapsed ? 'Expand' : 'Collapse')
				.setIcon(collapsed ? 'chevron-down' : 'chevron-up')
				.onClick(() => {
					send({ type: 'TOGGLE_COLLAPSE' })
				})
		})
		menu.addItem(item => {
			item.setTitle('Remove icon')
				.setIcon('x')
				.onClick(() => {
					const updated = { ...iconsSignal.value }
					delete updated[column.folder.name]
					iconsSignal.value = updated
				})
		})
		menu.showAtMouseEvent(evt)
	}

	const handleConfirm = () => {
		const newName = snapshot.context.draft.trim()
		send({ type: 'CONFIRM' })
		if (newName && newName !== column.folder.name) {
			void onRenameColumn(column.folder.name, newName)
		}
	}

	const handleAddCardKeyDown = async (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			const name = snapshot.context.newCardName.trim()
			if (name) await onAddCard(name)
			send({ type: 'CONFIRM_ADD_CARD' })
		}
		if (e.key === 'Escape') send({ type: 'CANCEL_ADD_CARD' })
	}

	const handleRenameKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') handleConfirm()
		if (e.key === 'Escape') send({ type: 'CANCEL' })
	}

	const dragClasses = [
		'kanban-base-column',
		snapshot.context.isCollapsed ? 'kanban-base-column--collapsed' : '',
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
				<div class="kanban-base-column-header">
					<KanbanColumnDragHandle
						onDragStart={() => onDragStart(dragIndex)}
					/>
					<IconButton
						folderName={column.folder.name}
						iconsSignal={iconsSignal}
						disabled={snapshot.context.isCollapsed}
					/>
					{snapshot.value === 'editing' ? (
						<div class="kanban-base-column-rename">
							<input
								class="kanban-base-column-rename-input"
								value={snapshot.context.draft}
								onInput={e =>
									send({
										type: 'SET_DRAFT',
										draft: (e.target as HTMLInputElement)
											.value,
									})
								}
								onKeyDown={handleRenameKeyDown}
								autoFocus
							/>
							<div class="kanban-base-column-rename-actions">
								<button
									class="kanban-base-column-rename-confirm"
									onClick={handleConfirm}
								>
									Save
								</button>
								<button
									class="kanban-base-column-rename-cancel"
									onClick={() => send({ type: 'CANCEL' })}
								>
									Cancel
								</button>
							</div>
						</div>
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
				{!snapshot.context.isCollapsed && (
					<div class="kanban-base-column-body">
						{column.entries.map(entry => (
							<KanbanCard
								key={entry.file.path}
								entry={entry}
								cardProperties={cardProperties}
								onDragStart={onCardDragStart}
								onDragCancel={onCardDragCancel}
							/>
						))}
						<div className="kanban-base-column__footer">
							{snapshot.value === 'addingCard' ? (
								<input
									className="kanban-base-column__add-card-input"
									placeholder="Card name"
									value={snapshot.context.newCardName}
									ref={el => { if (el) el.focus() }}
									onInput={e =>
										send({
											type: 'SET_NEW_CARD_NAME',
											name: (e.target as HTMLInputElement).value,
										})
									}
									onKeyDown={e => { void handleAddCardKeyDown(e) }}
									onBlur={() => send({ type: 'CANCEL_ADD_CARD' })}
								/>
							) : (
								<button
									className="kanban-base-column__add-button"
									onClick={() => send({ type: 'START_ADD_CARD' })}
								>
									<ObsidianIcon iconId="lucide-plus-circle" />
									Add Card
								</button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
