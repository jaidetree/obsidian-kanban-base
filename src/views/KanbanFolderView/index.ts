import type { BasesViewFactory, ViewOption } from 'obsidian';
import { KanbanFolderView } from './KanbanFolderView';

export const KANBAN_ID = 'kanban-base';

export const KANBAN_FACTORY: BasesViewFactory = (controller, containerEl) =>
	new KanbanFolderView(controller, containerEl);

export const KANBAN_OPTIONS = (): ViewOption[] => [
	{
		type: 'folder',
		key: 'columnRoot',
		displayName: 'Columns root folder',
		placeholder: 'Select a folder…',
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
