import type { BasesViewFactory, ViewOption } from 'obsidian';
import { KanbanView } from './KanbanView';

export const KANBAN_ID = 'kanban-base';

export const KANBAN_FACTORY: BasesViewFactory = (controller, containerEl) =>
	new KanbanView(controller, containerEl);

export const KANBAN_OPTIONS = (): ViewOption[] => [
	{
		type: 'group',
		displayName: 'Cards',
		items: [
			{
				type: 'multitext',
				displayName: 'Properties to show',
				key: 'cardProperties',
				default: [],
			},
		],
	},
];
