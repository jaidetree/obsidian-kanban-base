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
			{
				type: 'slider',
				key: 'cardSize',
				displayName: 'Card size',
				default: 220,
				min: 50,
				max: 800,
				step: 10,
			},
		],
	},
	{
		type: 'text',
		displayName: 'Column order',
		key: 'columnOrder',
		default: '',
		shouldHide: () => true, // managed programmatically via drag-and-drop
	},
	{
		type: 'text',
		displayName: 'Column icons',
		key: 'columnIcons',
		default: '{}',
		shouldHide: () => true,
	},
	{
		type: 'text',
		displayName: 'Column states',
		key: 'columnStates',
		default: '{}',
		shouldHide: () => true,
	},
];
