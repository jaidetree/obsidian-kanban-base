import type { Meta, StoryObj } from '@storybook/preact-vite';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import { createMockApp } from '../../__mocks__/create-mock-app';
import { KanbanBoard } from './KanbanBoard';
import type { TFolder } from 'obsidian';

function mockFolder(name: string, parent: TFolder | null = null): TFolder {
	return {
		name,
		path: parent ? `${parent.path}/${name}` : name,
		parent,
		children: [],
		isRoot: () => false,
	} as unknown as TFolder;
}

function entryInFolder(folder: TFolder, basename: string, fm: Record<string, unknown> = {}) {
	return aBasesEntry(
		{ file: aFile({ basename, path: `${folder.path}/${basename}.md`, parent: folder as never }) },
		fm,
	);
}

const root = mockFolder('Project');
const todo = mockFolder('Todo', root);
const inProgress = mockFolder('In Progress', root);
const done = mockFolder('Done', root);

const noop = async () => {};

const meta: Meta<typeof KanbanBoard> = {
	title: 'Views/Kanban Board',
	component: KanbanBoard,
	tags: ['autodocs'],
	args: {
		app: createMockApp(),
		cardProperties: [],
		cardSize: 220,
		columnIcons: {},
		onAddColumn: noop,
		onUpdateIcons: (_icons: Record<string, string>) => {},
		columns: [
			{ folder: todo, entries: [entryInFolder(todo, 'Task 1'), entryInFolder(todo, 'Task 2')] },
			{ folder: inProgress, entries: [entryInFolder(inProgress, 'Task 3')] },
			{ folder: done, entries: [] },
		],
	},
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

export const Default: Story = {};

export const EmptyColumns: Story = {
	args: {
		columns: [
			{ folder: todo, entries: [] },
			{ folder: done, entries: [] },
		],
	},
};

export const SingleColumn: Story = {
	args: {
		columns: [{ folder: todo, entries: [entryInFolder(todo, 'Only note')] }],
	},
};

export const CardWithProperties: Story = {
	args: {
		cardProperties: ['note.priority', 'note.status'],
		columns: [
			{
				folder: todo,
				entries: [
					entryInFolder(todo, 'High priority task', { priority: 'High', status: 'Blocked' }),
					entryInFolder(todo, 'Normal task', { priority: 'Low' }),
					entryInFolder(todo, 'No properties task'),
				],
			},
			{ folder: done, entries: [entryInFolder(done, 'Finished task', { priority: 'Medium', status: 'Done' })] },
		],
	},
};

export const AddColumnForm: Story = {
	args: {
		columns: [],
	},
};
