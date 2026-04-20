import { Plugin, requireApiVersion } from 'obsidian'
import { KANBAN_FACTORY, KANBAN_ID, KANBAN_OPTIONS } from './views/KanbanFolderView'
import { makeKanbanPropertyFactory, KANBAN_PROPERTY_ID, KANBAN_PROPERTY_OPTIONS } from './views/KanbanPropertyView'

export default class KanbanBasePlugin extends Plugin {
	async onload() {
		if (requireApiVersion('1.10.1')) {
			this.registerBasesView(KANBAN_ID, {
				name: 'Kanban Folders',
				icon: 'lucide-kanban-square',
				factory: KANBAN_FACTORY,
				options: KANBAN_OPTIONS,
			})
			this.registerBasesView(KANBAN_PROPERTY_ID, {
				name: 'Kanban',
				icon: 'lucide-kanban-square',
				factory: makeKanbanPropertyFactory(this.app),
				options: KANBAN_PROPERTY_OPTIONS,
			})
		}
	}

	onunload() {}
}
