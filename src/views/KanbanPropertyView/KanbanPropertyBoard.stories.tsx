import type { Meta, StoryObj } from '@storybook/preact-vite'
import { createActor } from 'xstate'
import { aBasesEntry } from '../../__mocks__/aBasesEntry'
import { aFile } from '../../__mocks__/aFile'
import { createMockApp } from '../../__mocks__/create-mock-app'
import { createMockKanbanViewActions } from '../../__mocks__/create-mock-kanban-view-actions'
import { boardMachine } from '../../machines/boardMachine'
import { cardPropertyDragMachine } from '../../machines/cardPropertyDragMachine'
import { AppContext } from '../KanbanBase/AppContext'
import { KanbanViewContext } from '../KanbanBase/KanbanViewContext'
import {
	KanbanPropertyBoard,
	KanbanPropertyBoardProps,
	NoGroupByPrompt,
	UnsupportedTypeError,
} from './KanbanPropertyBoard'
import type { IKanbanPropertyColumn } from './types'

const storyBoardActor = createActor(boardMachine, {
	input: {
		columns: [
			{ name: 'Todo', icon: null, isCollapsed: false },
			{ name: 'In Progress', icon: null, isCollapsed: false },
			{ name: 'Done', icon: null, isCollapsed: false },
		],
	},
})
storyBoardActor.start()

const cardDragStoryActor = createActor(cardPropertyDragMachine)
cardDragStoryActor.start()

function entry(columnName: string, basename: string): ReturnType<typeof aBasesEntry> {
	return aBasesEntry({ file: aFile({ basename, path: `${columnName}/${basename}.md` }) })
}

const defaultColumns: IKanbanPropertyColumn[] = [
	{
		name: 'Todo',
		entries: [entry('Todo', 'Task 1'), entry('Todo', 'Task 2')],
		isUncategorized: false,
	},
	{
		name: 'In Progress',
		entries: [entry('In Progress', 'Task 3')],
		isUncategorized: false,
	},
	{
		name: 'Done',
		entries: [],
		isUncategorized: false,
	},
]

function KanbanPropertyBoardStory(props: KanbanPropertyBoardProps) {
	return (
		<KanbanViewContext.Provider value={createMockKanbanViewActions()}>
			<AppContext.Provider value={createMockApp()}>
				<KanbanPropertyBoard {...props} />
			</AppContext.Provider>
		</KanbanViewContext.Provider>
	)
}

const meta: Meta<typeof KanbanPropertyBoardStory> = {
	title: 'Views/Kanban Property Board',
	component: KanbanPropertyBoardStory,
	tags: ['autodocs'],
	args: {
		columns: defaultColumns,
		showEmptyColumns: true,
		showUncategorized: true,
		cardProperties: [],
		cardSize: 220,
		groupByProperty: 'Status',
		boardActor: storyBoardActor,
		cardDragActor: cardDragStoryActor,
	},
}

export default meta
type Story = StoryObj<typeof KanbanPropertyBoardStory>

export const Default: Story = {}

export const WithUncategorized: Story = {
	args: {
		columns: [
			...defaultColumns,
			{
				name: 'Uncategorized',
				entries: [entry('Uncategorized', 'Mystery Note')],
				isUncategorized: true,
			},
		],
	},
}

export const HideEmpty: Story = {
	args: {
		showEmptyColumns: false,
	},
}

export const HideUncategorized: Story = {
	args: {
		showUncategorized: false,
		columns: [
			...defaultColumns,
			{
				name: 'Uncategorized',
				entries: [entry('Uncategorized', 'Mystery Note')],
				isUncategorized: true,
			},
		],
	},
}

export const NoGroupByState: Story = {
	render: () => (
		<KanbanViewContext.Provider value={createMockKanbanViewActions()}>
			<AppContext.Provider value={createMockApp()}>
				<NoGroupByPrompt />
			</AppContext.Provider>
		</KanbanViewContext.Provider>
	),
}

export const UnsupportedTypeState: Story = {
	render: () => (
		<KanbanViewContext.Provider value={createMockKanbanViewActions()}>
			<AppContext.Provider value={createMockApp()}>
				<UnsupportedTypeError />
			</AppContext.Provider>
		</KanbanViewContext.Provider>
	),
}
