import type { Meta, StoryObj } from '@storybook/preact-vite';
import { userEvent, within } from 'storybook/test';
import type { BasesPropertyId } from 'obsidian';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import { createMockApp } from '../../__mocks__/create-mock-app';
import { createMockKanbanViewActions } from '../../__mocks__/create-mock-kanban-view-actions';
import type { Icon } from '../../types/icons';
import { AppContext } from './AppContext';
import { KanbanViewContext } from './KanbanViewContext';
import type { IKanbanColumn } from './types';
import { KanbanColumn } from './KanbanColumn';

function entryWithName(columnName: string, basename: string, fm: Record<string, unknown> = {}) {
	return aBasesEntry(
		{ file: aFile({ basename, path: `${columnName}/${basename}.md` }) },
		fm,
	);
}

interface StoryProps {
	column: IKanbanColumn;
	cardProperties: string[];
	icon: Icon | null;
	isCollapsed: boolean;
	onCollapse: (isCollapsed: boolean) => void;
	otherColumnNames: string[];
	dragIndex?: number;
	isDragging?: boolean;
	isDragTarget?: boolean;
	isCardDragTarget?: boolean;
	showAddTop?: boolean;
	showAddBottom?: boolean;
}

function KanbanColumnStory({ cardProperties, dragIndex = 0, isDragging = false, isDragTarget = false, isCardDragTarget = false, ...rest }: StoryProps) {
	return (
		<KanbanViewContext.Provider value={createMockKanbanViewActions()}>
			<AppContext.Provider value={createMockApp()}>
				<KanbanColumn
					{...rest}
					cardProperties={cardProperties as BasesPropertyId[]}
					onIconChange={() => {}}
					dragIndex={dragIndex}
					onDragStart={() => {}}
					onDragOver={() => {}}
					onDrop={() => {}}
					onDragCancel={() => {}}
					isDragging={isDragging}
					isDragTarget={isDragTarget}
					onCardDragStart={() => {}}
					onCardDragOver={() => {}}
					onCardDrop={() => {}}
					onCardDragCancel={() => {}}
					isCardDragTarget={isCardDragTarget}
				/>
			</AppContext.Provider>
		</KanbanViewContext.Provider>
	);
}

const meta: Meta<typeof KanbanColumnStory> = {
	title: 'Views/Kanban Column',
	component: KanbanColumnStory,
	tags: ['autodocs'],
	args: {
		column: {
			name: 'Todo',
			entries: [
				entryWithName('Todo', 'Task 1'),
				entryWithName('Todo', 'Task 2'),
				entryWithName('Todo', 'Task 3'),
			],
		},
		cardProperties: [],
		icon: null,
		isCollapsed: false,
		onCollapse: () => {},
		otherColumnNames: ['In Progress', 'Done'],
	},
};

export default meta;
type Story = StoryObj<typeof KanbanColumnStory>;

export const Default: Story = {};

export const Empty: Story = {
	args: {
		column: { name: 'Todo', entries: [] },
	},
};

export const WithProperties: Story = {
	args: {
		cardProperties: ['note.priority', 'note.status'],
		column: {
			name: 'Todo',
			entries: [
				entryWithName('Todo', 'High priority task', { priority: 'High', status: 'Blocked' }),
				entryWithName('Todo', 'Normal task', { priority: 'Low' }),
				entryWithName('Todo', 'No properties task'),
			],
		},
	},
};

export const WithTags: Story = {
	args: {
		cardProperties: ['note.tags', 'note.priority'],
		column: {
			name: 'Todo',
			entries: [
				entryWithName('Todo', 'Tagged task', { tags: ['project', 'urgent'], priority: 'High' }),
				entryWithName('Todo', 'One tag', { tags: ['project'] }),
				entryWithName('Todo', 'No tags task', { priority: 'Low' }),
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
		icon: { name: 'check', value: 'check', prefix: 'Li' },
	},
};

export const ColumnDragging: Story = {
	args: {
		isDragging: true,
	},
};

export const ColumnDropTarget: Story = {
	args: {
		isDragTarget: true,
	},
};

export const CardDropTarget: Story = {
	args: {
		isCardDragTarget: true,
	},
};

export const AddingCard: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		await userEvent.click(canvas.getByRole('button', { name: /add card/i }))
	},
};

export const AddCardTopOnly: Story = {
	args: {
		showAddTop: true,
		showAddBottom: false,
	},
};

export const AddCardBothEnds: Story = {
	args: {
		showAddTop: true,
		showAddBottom: true,
	},
};

export const AddCardNone: Story = {
	args: {
		showAddTop: false,
		showAddBottom: false,
	},
};
