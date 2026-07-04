import { browser, expect } from '@wdio/globals';
import { KANBAN_ID } from '../../src/views/KanbanFolderView/constants';
import { cards, columns, openBase } from '../helpers/kanban';

// Slice 01 — harness spike / GO-NO-GO gate. Proves the make-or-break unknown:
// opening a folder `.base` in a real, sandboxed Obsidian mounts *this plugin's*
// registered Kanban view and renders columns + cards we can inspect via wdio.
// Everything downstream (grouping, drag → on-disk mutation) builds on this.

const BASE = 'Kanban Folders/Kanban Folders.base';
// Columns are the subfolders of the base's columnRoot (Kanban Folders/Books);
// cards are the notes seeded into each. Kept in sync with test/vaults/kanban.
const EXPECTED_COLUMNS = ['To Read', 'Started', 'Reading', 'Read'];
const EXPECTED_CARDS = [
	'Atomic Habits',
	'The Martian',
	'The Creative Act',
	'4,000 Weeks',
	'Dune',
];

describe('Kanban folder view — renders in real Obsidian Bases', function () {
	before(async function () {
		// The sandbox vault persists between runs; force known state.
		await browser.reloadObsidian({ vault: 'test/vaults/kanban' });
	});

	it('loads and enables the plugin', async function () {
		const enabled = await browser.executeObsidian(({ app }) =>
			// @ts-expect-error plugins registry is not in the public typings
			app.plugins.enabledPlugins.has('kanban-base'),
		);
		expect(enabled).toBe(true);
	});

	it("the folder .base type equals the registered KANBAN_ID ('kanban-base')", async function () {
		expect(KANBAN_ID).toBe('kanban-base');
	});

	it('opens the folder .base and renders its columns', async function () {
		await openBase(BASE);
		expect(await columns()).toEqual(EXPECTED_COLUMNS);
	});

	it('renders a card for every note under the column folders', async function () {
		expect((await cards()).sort()).toEqual([...EXPECTED_CARDS].sort());
	});
});
