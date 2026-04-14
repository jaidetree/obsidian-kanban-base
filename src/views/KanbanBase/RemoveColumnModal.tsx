import type { App } from 'obsidian'
import { Modal } from 'obsidian'
import { h, render, TargetedSubmitEvent } from 'preact'
import { ObsidianIcon } from './ObsidianIcon'

interface RemoveColumnModalFormProps {
	modal: Modal
	columnName: string
	columnNames: string[]
	onConfirm: (targetName: string) => void
}

function RemoveColumnModalForm({
	modal,
	columnName,
	columnNames,
	onConfirm,
}: RemoveColumnModalFormProps) {
	function handleSubmit(e: TargetedSubmitEvent<HTMLFormElement>) {
		e.preventDefault()
		const form = e.currentTarget as HTMLFormElement & { targetColumn: HTMLSelectElement }
		onConfirm(form.targetColumn.value)
		modal.close()
	}

	return (
		<form
			class="kanban-base-remove-column-modal__form"
			onSubmit={handleSubmit}
		>
			<p class="kanban-base-remove-column-modal__intro">
				The column "{columnName}" still has some cards in it. Which
				column should the items be moved to?
			</p>
			<label
				for="kanban-base-remove-column-modal__select"
				class="kanban-base-remove-column-modal__label"
			>
				Move cards from "{columnName}" to column …
			</label>
			<select
				id="kanban-base-remove-column-modal__select"
				class="kanban-base-remove-column-modal__select"
				name="targetColumn"
			>
				{columnNames.map(column => (
					<option value={column}>{column}</option>
				))}
			</select>
			<div class="kanban-base-remove-column-modal__actions">
				<button class="kanban-base-remove-column-modal__confirm">
					<ObsidianIcon iconId="lucide-trash" />
					Remove Column
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
		private readonly columnName: string,
		private readonly columnNames: string[],
		private readonly onConfirm: (targetName: string) => void,
	) {
		super(app)
		this.modalEl.classList.add('kanban-base-remove-column-modal')
	}

	onOpen() {
		this.setTitle(`Remove Column "${this.columnName}"`)
		render(
			h(RemoveColumnModalForm, {
				modal: this,
				columnName: this.columnName,
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
