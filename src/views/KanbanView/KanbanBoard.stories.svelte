<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { aFile } from '../../__mocks__/aFile';
	import { aBasesEntry } from '../../__mocks__/aBasesEntry';
	import { createMockApp } from '../../__mocks__/create-mock-app';
	import KanbanBoard from './KanbanBoard.svelte';

	function mockFolder(name, parent = null) {
		return {
			name,
			path: parent ? `${parent.path}/${name}` : name,
			parent,
			children: [],
			isRoot: () => false,
		};
	}

	function entryInFolder(folder, basename) {
		return aBasesEntry({
			file: aFile({ basename, path: `${folder.path}/${basename}.md`, parent: folder }),
		});
	}

	const root = mockFolder('Project');
	const todo = mockFolder('Todo', root);
	const inProgress = mockFolder('In Progress', root);
	const done = mockFolder('Done', root);

	const { Story } = defineMeta({
		title: 'Views/Kanban Board',
		component: KanbanBoard,
		tags: ['autodocs'],
		args: {
			app: createMockApp(),
			columns: [
				{ folder: todo, entries: [entryInFolder(todo, 'Task 1'), entryInFolder(todo, 'Task 2')] },
				{ folder: inProgress, entries: [entryInFolder(inProgress, 'Task 3')] },
				{ folder: done, entries: [] },
			],
		},
	});
</script>

<Story name="Default" />

<Story
	name="Empty columns"
	args={{
		app: createMockApp(),
		columns: [
			{ folder: todo, entries: [] },
			{ folder: done, entries: [] },
		],
	}}
/>

<Story
	name="Single column"
	args={{
		app: createMockApp(),
		columns: [{ folder: todo, entries: [entryInFolder(todo, 'Only note')] }],
	}}
/>
