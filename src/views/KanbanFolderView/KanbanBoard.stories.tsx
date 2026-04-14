import type { Meta, StoryObj } from '@storybook/preact-vite';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import { createMockApp } from '../../__mocks__/create-mock-app';
import { createMockKanbanViewActions } from '../../__mocks__/create-mock-kanban-view-actions';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoardProps } from './KanbanBoard';
import { AppContext } from '../KanbanBase/AppContext';
import { KanbanViewContext } from '../KanbanBase/KanbanViewContext';
import { createActor } from 'xstate';
import { boardMachine } from '../../machines/boardMachine';
import { cardDragMachine } from '../../machines/cardDragMachine';

const storyBoardActor = createActor(boardMachine, {
	input: {
		columns: [
			{ name: 'Todo', icon: null, isCollapsed: false },
			{ name: 'In Progress', icon: null, isCollapsed: false },
			{ name: 'Done', icon: null, isCollapsed: false },
		],
	},
});
storyBoardActor.start();

const cardDragStoryActor = createActor(cardDragMachine);
cardDragStoryActor.start();

function entryInColumn(columnName: string, basename: string, fm: Record<string, unknown> = {}) {
	return aBasesEntry(
		{ file: aFile({ basename, path: `${columnName}/${basename}.md` }) },
		fm,
	);
}

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
		columnRootSet: true,
		boardActor: storyBoardActor,
		cardDragActor: cardDragStoryActor,
		columns: [
			{ name: 'Todo', entries: [entryInColumn('Todo', 'Task 1'), entryInColumn('Todo', 'Task 2')] },
			{ name: 'In Progress', entries: [entryInColumn('In Progress', 'Task 3')] },
			{ name: 'Done', entries: [] },
		],
	},
};

export default meta;
type Story = StoryObj<typeof KanbanBoardStory>;

export const Default: Story = {};

export const EmptyColumns: Story = {
	args: {
		columns: [
			{ name: 'Todo', entries: [] },
			{ name: 'Done', entries: [] },
		],
	},
};

export const AddColumnForm: Story = {
	args: {
		columns: [],
	},
};

export const ColumnDragIdle: Story = {};
