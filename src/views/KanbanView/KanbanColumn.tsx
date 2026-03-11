import type { Signal } from '@preact/signals'
import { useComputed } from '@preact/signals'
import { useXState } from 'hooks/xstate'
import type { BasesEntry, BasesPropertyId } from 'obsidian'
import { Keymap, Menu, setIcon } from 'obsidian'
import { useEffect, useRef } from 'preact/hooks'
import { BoardIcons } from 'types/icons'
import { columnMachine } from '../../machines/columnMachine'
import { useApp } from './AppContext'
import { IconSuggestModal } from './IconSuggestModal'
import type { IKanbanColumn } from './KanbanView'

const DEFAULT_ICON = 'lucide-circle'

function IconRenderer({ iconId }: { iconId: string }) {
	const ref = useRef<HTMLSpanElement>(null)
	useEffect(() => {
		if (ref.current) setIcon(ref.current, iconId)
	}, [iconId])
	return <span ref={ref} class="kanban-base-icon" />
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
				<IconRenderer iconId={displayIcon.value} />
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
			⫼
		</span>
	)
}

function KanbanCard({
	entry,
	cardProperties,
}: {
	entry: BasesEntry
	cardProperties: BasesPropertyId[]
}) {
	const app = useApp()

	const handleClick = (e: MouseEvent) => {
		const leaf = app.workspace.getLeaf(Keymap.isModEvent(e))
		void leaf.openFile(entry.file)
	}

	return (
		<div class="kanban-base-card" onClick={handleClick}>
			<div class="kanban-base-card-title">{entry.file.basename}</div>
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
	)
}

interface KanbanColumnProps {
	column: IKanbanColumn
	cardProperties: BasesPropertyId[]
	iconsSignal: Signal<BoardIcons>
	isCollapsed: boolean
	onStateChange: (folderName: string, state: { isCollapsed: boolean }) => void
	onRenameColumn: (oldName: string, newName: string) => Promise<void>
	dragIndex: number
	onDragStart: (index: number) => void
	onDragOver: (index: number) => void
	onDrop: () => void
	onDragCancel: () => void
	isDragging: boolean
	isDragTarget: boolean
}

export function KanbanColumn({
	column,
	cardProperties,
	iconsSignal,
	isCollapsed,
	onStateChange,
	onRenameColumn,
	dragIndex,
	onDragStart,
	onDragOver,
	onDrop,
	onDragCancel,
	isDragging,
	isDragTarget,
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

	const handleRenameKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') handleConfirm()
		if (e.key === 'Escape') send({ type: 'CANCEL' })
	}

	const dragClasses = [
		'kanban-base-column',
		snapshot.context.isCollapsed ? 'kanban-base-column--collapsed' : '',
		isDragging ? 'kanban-base-column--dragging' : '',
		isDragTarget ? 'kanban-base-column--drop-target' : '',
	]
		.filter(Boolean)
		.join(' ')

	return (
		<div
			class={dragClasses}
			onDragOver={e => {
				e.preventDefault()
				onDragOver(dragIndex)
			}}
			onDrop={e => {
				e.preventDefault()
				onDrop()
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
						<IconRenderer iconId="lucide-more-horizontal" />
					</button>
				</div>
				{!snapshot.context.isCollapsed && (
					<div class="kanban-base-column-body">
						{column.entries.map(entry => (
							<KanbanCard
								key={entry.file.path}
								entry={entry}
								cardProperties={cardProperties}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
