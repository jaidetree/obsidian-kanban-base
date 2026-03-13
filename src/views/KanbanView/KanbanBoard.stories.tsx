import type { Meta, StoryObj } from '@storybook/preact-vite';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import { createMockApp } from '../../__mocks__/create-mock-app';
import { createMockKanbanViewActions } from '../../__mocks__/create-mock-kanban-view-actions';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoardProps } from './KanbanBoard';
import { AppContext } from './AppContext';
import { KanbanViewContext } from './KanbanViewContext';
import type { TFolder } from 'obsidian';
import { createActor } from 'xstate';
import { columnOrderMachine } from '../../machines/columnOrderMachine';
import { cardDragMachine } from '../../machines/cardDragMachine';

const storyActor = createActor(columnOrderMachine, {
	input: { columns: ['Todo', 'In Progress', 'Done'] },
});
storyActor.start();

const cardDragStoryActor = createActor(cardDragMachine);
cardDragStoryActor.start();

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

function KanbanBoardStory(props: KanbanBoardProps) {
	return (
		<KanbanViewContext.Provider value={createMockKanbanViewActions()}>
			<AppContext.Provider value={createMockApp()}>
				<KanbanBoard {...props} />
			</AppContext.Provider>
		</KanbanViewContext.Provider>
	);
}

const meta: Meta<typeof KanbanBoardStory> = {
	title: 'Views/Kanban Board',
	component: KanbanBoardStory,
	tags: ['autodocs'],
	args: {
		cardProperties: [],
		cardSize: 220,
		columnIcons: {},
		columnStates: {},
		columnRootSet: true,
		columnOrderActor: storyActor,
		cardDragActor: cardDragStoryActor,
		columns: [
			{ folder: todo, entries: [entryInFolder(todo, 'Task 1'), entryInFolder(todo, 'Task 2')] },
			{ folder: inProgress, entries: [entryInFolder(inProgress, 'Task 3')] },
			{ folder: done, entries: [] },
		],
	},
};

export default meta;
type Story = StoryObj<typeof KanbanBoardStory>;

export const Default: Story = {};

export const EmptyColumns: Story = {
	args: {
		columns: [
			{ folder: todo, entries: [] },
			{ folder: done, entries: [] },
		],
	},
};

export const AddColumnForm: Story = {
	args: {
		columns: [],
	},
};

export const ColumnDragIdle: Story = {};

export const ColumnDragging: Story = {
	args: {
		columns: [
			{ folder: todo, entries: [entryInFolder(todo, 'Task 1')] },
			{ folder: inProgress, entries: [entryInFolder(inProgress, 'Task 3')] },
			{ folder: done, entries: [] },
		],
	},
};

export const ColumnDropTarget: Story = {
	args: {
		columns: [
			{ folder: todo, entries: [entryInFolder(todo, 'Task 1')] },
			{ folder: inProgress, entries: [] },
			{ folder: done, entries: [] },
		],
	},
};

const cardDraggingActor = createActor(cardDragMachine);
cardDraggingActor.start();
cardDraggingActor.send({ type: 'DRAG_START', filePath: 'Project/Todo/Task 1.md', sourceColumn: 'Todo' });

export const CardDragging: Story = {
	args: {
		cardDragActor: cardDraggingActor,
	},
};

const cardDropTargetActor = createActor(cardDragMachine);
cardDropTargetActor.start();
cardDropTargetActor.send({ type: 'DRAG_START', filePath: 'Project/Todo/Task 1.md', sourceColumn: 'Todo' });
cardDropTargetActor.send({ type: 'DRAG_OVER', targetColumn: 'Done' });

export const CardDropTarget: Story = {
	args: {
		cardDragActor: cardDropTargetActor,
	},
};

export const NoRootConfigured: Story = {
	args: {
		columnRootSet: false,
		columns: [],
	},
};
