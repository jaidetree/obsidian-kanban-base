import type { Signal } from '@preact/signals'
import { useComputed } from '@preact/signals'
import { useXState } from 'hooks/xstate'
import type { BasesEntry, BasesPropertyId } from 'obsidian'
import { Keymap, Menu, setIcon } from 'obsidian'
import { useEffect, useRef, useState } from 'preact/hooks'
import { BoardIcons } from 'types/icons'
import { columnMachine } from '../../machines/columnMachine'
import { useApp } from './AppContext'
import { IconSuggestModal } from './IconSuggestModal'
import type { IKanbanColumn } from './KanbanView'

const DEFAULT_ICON = 'lucide-circle'

function ObsidianIcon({
	iconId,
	className,
}: {
	iconId: string
	className?: string
}) {
	const ref = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		if (ref.current) setIcon(ref.current, iconId)
	}, [iconId])
	return (
		<span
			ref={ref}
			class={'kanban-base-icon' + (className ? ' ' + className : '')}
		/>
	)
}

interface IconButtonProps {
	folderName: string
	iconsSignal: Signal<BoardIcons>
}

function IconButton({ folderName, iconsSignal }: IconButtonProps) {
	const app = useApp()
	const chosenIcon = useComputed(() => iconsSignal.value[folderName])
	const displayIcon = useComputed(
		() => chosenIcon.value?.value ?? DEFAULT_ICON,
	)

	const isDefault = chosenIcon.value === undefined

	const handleClick = () => {
		const modal = new IconSuggestModal(app, icon => {
			iconsSignal.value = { ...iconsSignal.value, [folderName]: icon }
		})
		modal.open()
	}

	return (
		<button
			class={`kanban-base-icon-btn clickable-icon${isDefault ? ' kanban-base-icon-btn--default' : ''}`}
			onClick={handleClick}
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

function KanbanCard({
	entry,
	cardProperties,
	onDragStart,
	onDragCancel,
}: {
	entry: BasesEntry
	cardProperties: BasesPropertyId[]
	onDragStart: (filePath: string) => void
	onDragCancel: () => void
}) {
	const app = useApp()
	const [isRenaming, setIsRenaming] = useState(false)
	const [draft, setDraft] = useState('')

	const handleClick = (e: MouseEvent) => {
		if (isRenaming) return
		const leaf = app.workspace.getLeaf(Keymap.isModEvent(e))
		void leaf.openFile(entry.file)
	}

	const handleMenuClick = (e: MouseEvent) => {
		e.stopPropagation()
		const menu = new Menu()
		menu.addItem(item => {
			item.setTitle('Open')
				.setIcon('lucide-file-text')
				.onClick(() => {
					void app.workspace.getLeaf(false).openFile(entry.file)
				})
		})
		menu.addItem(item => {
			item.setTitle('Open in new tab')
				.setIcon('lucide-plus')
				.onClick(() => {
					void app.workspace.getLeaf('tab').openFile(entry.file)
				})
		})
		menu.addItem(item => {
			item.setTitle('Rename')
				.setIcon('pencil')
				.onClick(() => {
					setDraft(entry.file.basename)
					setIsRenaming(true)
				})
		})
		menu.addItem(item => {
			item.setTitle('Delete')
				.setIcon('trash')
				.onClick(() => {
					void app.fileManager.trashFile(entry.file)
				})
		})
		menu.showAtMouseEvent(e)
	}

	const handleRenameConfirm = async () => {
		const newName = draft.trim()
		setIsRenaming(false)
		if (newName && newName !== entry.file.basename) {
			const dir = entry.file.parent?.path
			const newPath = dir ? `${dir}/${newName}.md` : `${newName}.md`
			await app.fileManager.renameFile(entry.file, newPath)
		}
	}

	const handleRenameKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') void handleRenameConfirm()
		if (e.key === 'Escape') setIsRenaming(false)
	}

	return (
		<div class="kanban-base-card" onClick={handleClick}>
			<span
				class="kanban-base-card-drag-handle"
				draggable
				onDragStart={e => {
					e.dataTransfer!.effectAllowed = 'move'
					e.dataTransfer!.setData('text/card', entry.file.path)
					onDragStart(entry.file.path)
				}}
				onDragEnd={e => {
					if (e.dataTransfer!.dropEffect === 'none') {
						onDragCancel()
					}
				}}
			>
				<ObsidianIcon iconId="lucide-grip-vertical" />
			</span>
			<div class="kanban-base-card-content">
				{isRenaming ? (
					<>
						<input
							class="kanban-base-card-rename-input"
							value={draft}
							onInput={e =>
								setDraft((e.target as HTMLInputElement).value)
							}
							onKeyDown={handleRenameKeyDown}
							autoFocus
						/>
						<div class="kanban-base-card-rename-actions">
							<button
								class="kanban-base-card-rename-confirm"
								onClick={() => void handleRenameConfirm()}
							>
								Save
							</button>
							<button
								class="kanban-base-card-rename-cancel"
								onClick={() => setIsRenaming(false)}
							>
								Cancel
							</button>
						</div>
					</>
				) : (
					<div class="kanban-base-card-title">
						{entry.file.basename}
					</div>
				)}
				{cardProperties.map(propId => {
					const value = entry.getValue(propId)
					if (!value?.isTruthy()) return null
					return (
						<div key={propId} class="kanban-base-card-prop">
							{value.toString()}
						</div>
					)
				})}
			</div>
			<button
				class="kanban-base-card-menu-btn clickable-icon"
				aria-label="Card options"
				onClick={handleMenuClick}
			>
				<ObsidianIcon iconId="lucide-more-horizontal" />
			</button>
		</div>
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
	const [isAddingCard, setIsAddingCard] = useState(false)
	const [newCardName, setNewCardName] = useState('')

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
							{isAddingCard ? (
								<input
									className="kanban-base-column__add-card-input"
									placeholder="Card name"
									value={newCardName}
									onInput={e =>
										setNewCardName(
											(e.target as HTMLInputElement)
												.value,
										)
									}
									onKeyDown={async e => {
										if (e.key === 'Enter') {
											const name = newCardName.trim()
											if (name) await onAddCard(name)
											setNewCardName('')
										}
										if (e.key === 'Escape') {
											setIsAddingCard(false)
											setNewCardName('')
										}
									}}
									onBlur={() => {
										setIsAddingCard(false)
										setNewCardName('')
									}}
									autoFocus
								/>
							) : (
								<button
									className="kanban-base-column__add-button"
									onClick={() => setIsAddingCard(true)}
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
