import type { App } from 'obsidian'
import { Modal } from 'obsidian'

export class RemoveColumnModal extends Modal {
	constructor(
		app: App,
		private readonly columnNames: string[],
		private readonly onConfirm: (targetName: string) => void,
	) {
		super(app)
	}

	onOpen() {
		const { contentEl } = this
		contentEl.createEl('h3', { text: 'Move cards to…' })
		const select = contentEl.createEl('select')
		for (const name of this.columnNames) {
			select.createEl('option', { text: name, value: name })
		}
		const actions = contentEl.createEl('div', {
			cls: 'kanban-base-remove-column-actions',
		})
		const confirm = actions.createEl('button', { text: 'Confirm' })
		confirm.addEventListener('click', () => {
			this.onConfirm(select.value)
			this.close()
		})
		const cancel = actions.createEl('button', { text: 'Cancel' })
		cancel.addEventListener('click', () => this.close())
	}

	onClose() {
		this.contentEl.empty()
	}
}
