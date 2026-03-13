import type { App } from 'obsidian'
import { Modal } from 'obsidian'
import { h, render, TargetedSubmitEvent } from 'preact'
import { ObsidianIcon } from './ObsidianIcon'

interface RemoveColumnModalFormProps {
	modal: Modal
	folderName: string
	columnNames: string[]
	onConfirm: (targetName: string) => void
}

function RemoveColumnModalForm({
	modal,
	folderName,
	columnNames,
	onConfirm,
}: RemoveColumnModalFormProps) {
	function handleSubmit(e: TargetedSubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		onConfirm(e.currentTarget.targetFolder.value)
		modal.close()
	}

	return (
		<form
			class="kanban-base-remove-column-modal__form"
			onSubmit={handleSubmit}
		>
			<p class="kanban-base-remove-column-modal__intro">
				The column "{folderName}" still has some cards in it. Which
				column should the items be moved to?
			</p>
			<label
				for="kanban-base-remove-column-modal__select"
				class="kanban-base-remove-column-modal__label"
			>
				Move cards from "{folderName}" to folder …
			</label>
			<select
				id="kanban-base-remove-column-modal__select"
				class="kanban-base-remove-column-modal__select"
				name="targetFolder"
			>
				{columnNames.map(column => (
					<option value={column}>{column}</option>
				))}
			</select>
			<div class="kanban-base-remove-column-modal__actions">
				<button class="kanban-base-remove-column-modal__confirm">
					<ObsidianIcon iconId="lucide-trash" />
					Remove Folder
				</button>
				<button
					class="kanban-base-remove-column-modal__cancel"
					type="button"
					onClick={_e => modal.close()}
				>
					<ObsidianIcon iconId="lucide-x" />
					Cancel
				</button>
			</div>
		</form>
	)
}

export class RemoveColumnModal extends Modal {
	constructor(
		app: App,
		private readonly folderName: string,
		private readonly columnNames: string[],
		private readonly onConfirm: (targetName: string) => void,
	) {
		super(app)
		this.modalEl.classList.add('kanban-base-remove-column-modal')
	}

	onOpen() {
		this.setTitle(`Remove Folder Column "${this.folderName}"`)
		render(
			h(RemoveColumnModalForm, {
				modal: this,
				folderName: this.folderName,
				columnNames: this.columnNames,
				onConfirm: this.onConfirm,
			}),
			this.contentEl,
		)
	}

	onClose() {
		render(null, this.contentEl)
		this.contentEl.empty()
	}
}
