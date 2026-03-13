import type { BasesEntry, BasesPropertyId } from 'obsidian'
import { Keymap, Menu } from 'obsidian'
import { TargetedDragEvent } from 'preact'
import { useState } from 'preact/hooks'
import { useApp } from './AppContext'
import { InlineForm } from './InlineForm'
import { ObsidianIcon } from './ObsidianIcon'

export function KanbanCard({
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
		if (isRenaming) {
			e.preventDefault()
			e.stopPropagation()
			return
		}
		const leaf = app.workspace.getLeaf(!Keymap.isModEvent(e))
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

	async function handleRenameConfirm() {
		const newName = draft.trim()
		if (newName && newName !== entry.file.basename) {
			const dir = entry.file.parent?.path
			const newPath = dir ? `${dir}/${newName}.md` : `${newName}.md`
			await app.fileManager.renameFile(entry.file, newPath)
		}
		setIsRenaming(false)
	}

	function handleDragStart(
		e: TargetedDragEvent<HTMLDivElement | HTMLSpanElement>,
	) {
		e.dataTransfer!.effectAllowed = 'move'
		e.dataTransfer!.setData('text/card', entry.file.path)
		onDragStart(entry.file.path)
	}

	function handleDragEvent(
		e: TargetedDragEvent<HTMLDivElement | HTMLSpanElement>,
	) {
		if (e.dataTransfer!.dropEffect === 'none') {
			onDragCancel()
		}
	}

	return (
		<div
			class="kanban-base-card"
			onClick={handleClick}
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEvent}
		>
			<span
				class="kanban-base-card-drag-handle"
				draggable
				onDragStart={handleDragStart}
				onDragEnd={handleDragEvent}
			>
				<ObsidianIcon iconId="lucide-grip-vertical" />
			</span>
			<div class="kanban-base-card-content">
				{isRenaming ? (
					<>
						<InlineForm
							value={draft}
							onSubmit={(_e: SubmitEvent) => {
								handleRenameConfirm()
							}}
							onInput={e => setDraft(e.currentTarget.value)}
							onCancel={() => {
								setIsRenaming(false)
							}}
						/>
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
