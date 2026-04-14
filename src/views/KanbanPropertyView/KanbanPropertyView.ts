import { BasesView, type QueryController } from 'obsidian'
import { h, render } from 'preact'
import { KANBAN_PROPERTY_ID } from '.'

export class KanbanPropertyView extends BasesView {
	readonly type = KANBAN_PROPERTY_ID
	private readonly containerEl: HTMLElement

	constructor(controller: QueryController, containerEl: HTMLElement) {
		super(controller)
		this.containerEl = containerEl
	}

	onDataUpdated(): void {
		render(
			h(
				'div',
				{ class: 'kanban-property-placeholder' },
				'Select a group-by field in the Bases UI to use the Kanban view.',
			),
			this.containerEl,
		)
	}

	async createFileForView(): Promise<void> {
		// Stub — implemented in Part III once column derivation is in place
	}

	onunload(): void {
		render(null, this.containerEl)
	}
}
