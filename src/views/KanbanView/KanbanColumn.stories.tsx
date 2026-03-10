import type { Meta, StoryObj } from '@storybook/preact-vite';
import { useSignal } from '@preact/signals';
import type { BasesPropertyId, TFolder } from 'obsidian';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import { createMockApp } from '../../__mocks__/create-mock-app';
import type { BoardIcons } from '../../types/icons';
import type { IKanbanColumn } from './KanbanView';
import { KanbanColumn } from './KanbanColumn';

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

// Bridges serializable Storybook args to the Signal<BoardIcons> prop KanbanColumn expects
interface StoryProps {
	column: IKanbanColumn;
	cardProperties: string[];
	columnIcons: BoardIcons;
	isCollapsed: boolean;
	onStateChange: (folderName: string, state: { isCollapsed: boolean }) => void;
	onRenameColumn: (oldName: string, newName: string) => Promise<void>;
}

function KanbanColumnStory({ columnIcons, cardProperties, ...rest }: StoryProps) {
	const iconsSignal = useSignal(columnIcons);
	return (
		<KanbanColumn
			{...rest}
			app={createMockApp()}
			cardProperties={cardProperties as BasesPropertyId[]}
			iconsSignal={iconsSignal}
		/>
	);
}

const meta: Meta<typeof KanbanColumnStory> = {
	title: 'Views/Kanban Column',
	component: KanbanColumnStory,
	tags: ['autodocs'],
	args: {
		column: {
			folder: todo,
			entries: [
				entryInFolder(todo, 'Task 1'),
				entryInFolder(todo, 'Task 2'),
				entryInFolder(todo, 'Task 3'),
			],
		},
		cardProperties: [],
		columnIcons: {},
		isCollapsed: false,
		onStateChange: () => {},
		onRenameColumn: async () => {},
	},
};

export default meta;
type Story = StoryObj<typeof KanbanColumnStory>;

export const Default: Story = {};

export const Empty: Story = {
	args: {
		column: { folder: todo, entries: [] },
	},
};

export const WithProperties: Story = {
	args: {
		cardProperties: ['note.priority', 'note.status'],
		column: {
			folder: todo,
			entries: [
				entryInFolder(todo, 'High priority task', { priority: 'High', status: 'Blocked' }),
				entryInFolder(todo, 'Normal task', { priority: 'Low' }),
				entryInFolder(todo, 'No properties task'),
			],
		},
	},
};

export const Collapsed: Story = {
	args: {
		isCollapsed: true,
	},
};

export const WithChosenIcon: Story = {
	args: {
		columnIcons: {
			Todo: { name: 'check', value: 'check', prefix: 'Li' },
		},
	},
};
