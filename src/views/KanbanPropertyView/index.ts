import type { App, BasesViewFactory, ViewOption } from 'obsidian';
import { KanbanPropertyView } from './KanbanPropertyView';

export const KANBAN_PROPERTY_ID = 'kanban-property';

export const makeKanbanPropertyFactory = (app: App): BasesViewFactory =>
	(controller, containerEl) => new KanbanPropertyView(controller, containerEl, app);

export const KANBAN_PROPERTY_OPTIONS = (): ViewOption[] => [
	{
		type: 'folder',
		key: 'cardFolder',
		displayName: 'New card folder',
		placeholder: 'Select a folder… (defaults to vault root)',
	},
	{
		type: 'toggle',
		key: 'showEmptyColumns',
		displayName: 'Show empty columns',
		default: true,
	},
	{
		type: 'toggle',
		key: 'showUncategorized',
		displayName: 'Show uncategorized',
		default: true,
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
		shouldHide: () => true,
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
	{
		type: 'text',
		displayName: 'User-defined columns',
		key: 'userDefinedColumns',
		default: '[]',
		shouldHide: () => true,
	},
	{
		type: 'text',
		displayName: 'Default column',
		key: 'defaultColumn',
		default: '',
		shouldHide: () => true,
	},
];
