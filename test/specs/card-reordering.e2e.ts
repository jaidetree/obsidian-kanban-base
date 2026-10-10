import { browser, expect } from '@wdio/globals'
import { CARD, CARD_TITLE, COLUMN, openBase } from '../helpers/kanban'

const BASE = 'Kanban Folders/Kanban Folders.base'
const ROOT = 'Kanban Folders/Books'
const ATOMIC = `${ROOT}/To Read/Atomic Habits.md`
const MARTIAN = `${ROOT}/To Read/The Martian.md`
const DUNE = `${ROOT}/Read/Dune.md`

const card = (path: string) => browser.$(`${CARD}[data-file-path="${path}"]`)

async function titlesInColumn(path: string): Promise<string[]> {
	return browser
		.$$(`${COLUMN}:has([data-file-path="${path}"]) ${CARD_TITLE}`)
		.map(el => el.getText())
}

async function dragCard(
	sourcePath: string,
	targetPath: string,
	side: 'before' | 'after' = 'before',
) {
	const source = await card(sourcePath)
	const target = await card(targetPath)
	const y = side === 'before' ? -10 : 10
	await browser
		.action('pointer', { parameters: { pointerType: 'mouse' } })
		.move({ origin: source, x: 0, y: 0 })
		.down({ button: 0 })
		.move({ origin: source, x: 6, y: 0, duration: 100 })
		.move({ origin: target, x: 0, y, duration: 300 })
		.pause(100)
		// A second move makes Electron deliver dragover at the destination
		// before mouseup; without it the native drag can end without a drop.
		.move({ origin: target, x: 1, y, duration: 100 })
		.up({ button: 0 })
		.perform()
}

describe('Kanban folder card ordering', function () {
	beforeEach(async function () {
		// The service copies this fixture; no user vault or source fixture is edited.
		await browser.reloadObsidian({ vault: 'test/vaults/kanban' })
		await openBase(BASE)
		await card(MARTIAN).waitForDisplayed({ timeout: 20000 })
	})

	it('reorders both ways without renaming notes and persists across reopening', async function () {
		await dragCard(MARTIAN, ATOMIC)
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(ATOMIC)).join(',') ===
				'The Martian,Atomic Habits',
		)
		await browser.waitUntil(async () =>
			browser.executeObsidian(
				async ({ app }, path: string) =>
					(await app.vault.adapter.read(path)).includes('cardOrder:'),
				BASE,
			),
		)
		await browser.executeObsidian(({ app }) =>
			app.workspace.detachLeavesOfType('bases'),
		)
		await openBase(BASE)
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(ATOMIC)).join(',') ===
				'The Martian,Atomic Habits',
		)
		await dragCard(MARTIAN, ATOMIC, 'after')
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(ATOMIC)).join(',') ===
				'Atomic Habits,The Martian',
		)
		expect(await card(ATOMIC).isExisting()).toBe(true)
		expect(await card(MARTIAN).isExisting()).toBe(true)
	})

	it('moves between folders at the chosen position and keeps order after a rename', async function () {
		await dragCard(MARTIAN, DUNE)
		const movedPath = `${ROOT}/Read/The Martian.md`
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(DUNE)).join(',') === 'The Martian,Dune',
		)
		expect(await card(MARTIAN).isExisting()).toBe(false)
		const renamedPath = `${ROOT}/Read/Z Renamed.md`
		await browser.executeObsidian(
			async ({ app }, oldPath: string, newPath: string) => {
				const file = app.vault.getFileByPath(oldPath)
				if (!file) throw new Error(`Missing moved card: ${oldPath}`)
				await app.fileManager.renameFile(file, newPath)
			},
			movedPath,
			renamedPath,
		)
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(DUNE)).join(',') === 'Z Renamed,Dune',
		)
		await browser.executeObsidian(async ({ app }, root: string) => {
			const folder = app.vault.getFolderByPath(`${root}/Read`)
			if (!folder) throw new Error('Missing destination folder')
			await app.vault.rename(folder, `${root}/Finished`)
		}, ROOT)
		await browser.waitUntil(
			async () =>
				(await titlesInColumn(`${ROOT}/Finished/Dune.md`)).join(',') ===
				'Z Renamed,Dune',
		)
	})
})
