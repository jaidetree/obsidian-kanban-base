import { Plugin, requireApiVersion } from 'obsidian'
import { KANBAN_FACTORY, KANBAN_ID, KANBAN_OPTIONS } from './views/KanbanView'

export default class KanbanBasePlugin extends Plugin {
	async onload() {
		if (requireApiVersion('1.10.1')) {
			this.registerBasesView(KANBAN_ID, {
				name: 'Kanban',
				icon: 'lucide-kanban-square',
				factory: KANBAN_FACTORY,
				options: KANBAN_OPTIONS,
			})
		}
		// Hot reload: if an existing KanbanView is already mounted (i.e. this is
		// a hot reload, not a fresh start), trigger a full window reload so the
		// new code takes effect cleanly without prototype patching.
		this.app.workspace.iterateAllLeaves(leaf => {
			if (leaf?.view?.getViewType?.() === 'bases') {
				const children: unknown[] = (leaf.view as any)._children ?? []
				const hasKanban = children.some(
					c => (c as any)?.view?.type === KANBAN_ID,
				)
				if (hasKanban) {
					location.reload()
				}
			}
		})
	}

	onunload() {}
}
