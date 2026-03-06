import { describe, it, expect } from 'vitest';
import { deriveColumns } from './KanbanView';
import { aFile } from '../../__mocks__/aFile';
import { aBasesEntry } from '../../__mocks__/aBasesEntry';
import type { TFolder } from 'obsidian';

function mockFolder(name: string, parentFolder: TFolder | null = null): TFolder {
	return {
		name,
		path: parentFolder ? `${parentFolder.path}/${name}` : name,
		parent: parentFolder,
		children: [],
		isRoot: () => false,
	} as unknown as TFolder;
}

function entryInFolder(folder: TFolder, basename = 'note') {
	return aBasesEntry({ file: aFile({ basename, path: `${folder.path}/${basename}.md`, parent: folder as never }) });
}

describe('deriveColumns', () => {
	it('returns empty array for no entries', () => {
		expect(deriveColumns([])).toEqual([]);
	});

	it('derives columns from immediate child folders', () => {
		const root = mockFolder('Project');
		const todo = mockFolder('Todo', root);
		const done = mockFolder('Done', root);

		const columns = deriveColumns([
			entryInFolder(todo, 'task-1'),
			entryInFolder(done, 'task-2'),
			entryInFolder(todo, 'task-3'),
		]);

		expect(columns).toHaveLength(2);
		expect(columns.map(c => c.folder.name)).toEqual(['Done', 'Todo']);
		expect(columns.find(c => c.folder.name === 'Todo')?.entries).toHaveLength(2);
		expect(columns.find(c => c.folder.name === 'Done')?.entries).toHaveLength(1);
	});

	it('excludes entries in subfolders (not immediate children of root)', () => {
		const root = mockFolder('Project');
		const todo = mockFolder('Todo', root);
		const subtask = mockFolder('Subtask', todo); // nested — should be excluded

		const columns = deriveColumns([
			entryInFolder(todo, 'task-1'),
			entryInFolder(subtask, 'nested'), // should be excluded
		]);

		expect(columns).toHaveLength(1);
		expect(columns[0]!.folder.name).toBe('Todo');
		expect(columns[0]!.entries).toHaveLength(1);
	});

	it('ignores non-markdown files (e.g. .base files)', () => {
		const root = mockFolder('Kanban Test');
		const todo = mockFolder('To Do', root);

		// .base file lives in the root folder — should not create a "Kanban Test" column
		const baseFile = aFile({ basename: 'Kanban Test', extension: 'base', path: 'Kanban Test/Kanban Test.base', parent: root as never });
		const baseEntry = aBasesEntry({ file: baseFile });

		const columns = deriveColumns([
			entryInFolder(todo, 'Test Note'),
			baseEntry,
		]);

		expect(columns).toHaveLength(1);
		expect(columns[0]!.folder.name).toBe('To Do');
		expect(columns[0]!.entries).toHaveLength(1);
	});

	it('sorts columns alphabetically', () => {
		const root = mockFolder('Project');
		const columns = deriveColumns([
			entryInFolder(mockFolder('Zzz', root)),
			entryInFolder(mockFolder('Aaa', root)),
			entryInFolder(mockFolder('Mmm', root)),
		]);
		expect(columns.map(c => c.folder.name)).toEqual(['Aaa', 'Mmm', 'Zzz']);
	});
});
