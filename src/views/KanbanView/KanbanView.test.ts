import { describe, it, expect } from 'vitest';
import { deriveColumns, deriveColumnsFromRoot, applyColumnOrder } from './KanbanView';
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

/** Create a root folder with pre-populated direct subfolder children. */
function mockRootWithChildren(rootName: string, childNames: string[]): { root: TFolder; children: TFolder[] } {
	const root = mockFolder(rootName);
	const children = childNames.map(n => mockFolder(n, root));
	(root as unknown as { children: TFolder[] }).children = children;
	return { root, children };
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

describe('deriveColumnsFromRoot', () => {
	it('includes all direct subfolders even with zero entries', () => {
		const { root } = mockRootWithChildren('Project', ['Todo', 'Done', 'Backlog']);
		const columns = deriveColumnsFromRoot(root, []);
		expect(columns.map(c => c.folder.name)).toEqual(['Backlog', 'Done', 'Todo']);
		expect(columns.every(c => c.entries.length === 0)).toBe(true);
	});

	it('assigns entries to the correct column', () => {
		const { root, children } = mockRootWithChildren('Project', ['Todo', 'Done']);
		const [todo, done] = children as [TFolder, TFolder];
		const columns = deriveColumnsFromRoot(root, [
			entryInFolder(todo, 'task-1'),
			entryInFolder(done, 'task-2'),
			entryInFolder(todo, 'task-3'),
		]);
		expect(columns.find(c => c.folder.name === 'Todo')?.entries).toHaveLength(2);
		expect(columns.find(c => c.folder.name === 'Done')?.entries).toHaveLength(1);
	});

	it('ignores entries in nested subfolders (not direct children)', () => {
		const { root, children } = mockRootWithChildren('Project', ['Todo']);
		const [todo] = children as [TFolder];
		const nested = mockFolder('Sub', todo);
		const columns = deriveColumnsFromRoot(root, [
			entryInFolder(todo, 'task-1'),
			entryInFolder(nested, 'nested-task'),
		]);
		expect(columns).toHaveLength(1);
		expect(columns[0]!.entries).toHaveLength(1);
		expect(columns[0]!.entries[0]!.file.basename).toBe('task-1');
	});

	it('ignores non-markdown files', () => {
		const { root, children } = mockRootWithChildren('Project', ['Todo']);
		const [todo] = children as [TFolder];
		const baseFile = aFile({ basename: 'notes', extension: 'base', path: `${todo.path}/notes.base`, parent: todo as never });
		const columns = deriveColumnsFromRoot(root, [
			entryInFolder(todo, 'task-1'),
			aBasesEntry({ file: baseFile }),
		]);
		expect(columns[0]!.entries).toHaveLength(1);
		expect(columns[0]!.entries[0]!.file.basename).toBe('task-1');
	});

	it('sorts columns alphabetically', () => {
		const { root } = mockRootWithChildren('Project', ['Zzz', 'Aaa', 'Mmm']);
		const columns = deriveColumnsFromRoot(root, []);
		expect(columns.map(c => c.folder.name)).toEqual(['Aaa', 'Mmm', 'Zzz']);
	});
});

describe('applyColumnOrder', () => {
	const root = mockFolder('Project');
	const aaa = mockFolder('Aaa', root);
	const bbb = mockFolder('Bbb', root);
	const ccc = mockFolder('Ccc', root);

	const columns = [
		{ folder: aaa, entries: [] },
		{ folder: bbb, entries: [] },
		{ folder: ccc, entries: [] },
	];

	it('returns columns unchanged when order is empty', () => {
		expect(applyColumnOrder(columns, []).map(c => c.folder.name)).toEqual(['Aaa', 'Bbb', 'Ccc']);
	});

	it('reorders columns according to the saved order', () => {
		expect(applyColumnOrder(columns, ['Ccc', 'Aaa', 'Bbb']).map(c => c.folder.name))
			.toEqual(['Ccc', 'Aaa', 'Bbb']);
	});

	it('silently skips names not present in derived columns', () => {
		expect(applyColumnOrder(columns, ['Missing', 'Bbb', 'Aaa']).map(c => c.folder.name))
			.toEqual(['Bbb', 'Aaa', 'Ccc']);
	});

	it('appends columns absent from the order at the end', () => {
		expect(applyColumnOrder(columns, ['Ccc']).map(c => c.folder.name))
			.toEqual(['Ccc', 'Aaa', 'Bbb']);
	});
});
