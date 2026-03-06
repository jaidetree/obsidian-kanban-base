import { Plugin, requireApiVersion } from 'obsidian';
import { KANBAN_ID, KANBAN_FACTORY, KANBAN_OPTIONS } from './views/KanbanView';

export default class KanbanBasePlugin extends Plugin {
	async onload() {
		if (requireApiVersion('1.10.1')) {
			this.registerBasesView(KANBAN_ID, {
				name: 'Kanban',
				icon: 'lucide-layout-kanban',
				factory: KANBAN_FACTORY,
				options: KANBAN_OPTIONS,
			});
		}
	}

	onunload() {}
}
