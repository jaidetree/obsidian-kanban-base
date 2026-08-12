import { browser, expect } from '@wdio/globals';
import {
	INLINE_FORM_INPUT,
	INLINE_FORM_SUBMIT,
	cards,
	clickMenuItem,
	openBase,
	openCardMenu,
} from '../helpers/kanban';

// Regression coverage: submitting the inline rename form via its checkmark
// button must actually confirm the rename. This reproduces a bug where the
// card's outer click-guard (`e.preventDefault()` while renaming) cancelled
// the submit button's default action before `onSubmit` ever fired.

const BASE = 'Kanban Folders/Kanban Folders.base';
const ORIGINAL_TITLE = 'The Martian';
const RENAMED_TITLE = 'The Martian (Renamed)';
const ORIGINAL_PATH = 'Kanban Folders/Books/To Read/The Martian.md';
const RENAMED_PATH = `Kanban Folders/Books/To Read/${RENAMED_TITLE}.md`;

describe('Kanban card rename — checkmark submit button', function () {
	before(async function () {
		await browser.reloadObsidian({ vault: 'test/vaults/kanban' });

		// Desktop Obsidian's `Menu` defaults to a native OS context menu, which
		// WebDriver cannot see or interact with. Force DOM-rendered menus for
		// this test session only, without touching the plugin's own source.
		await browser.executeObsidian(({ obsidian }) => {
			const proto = (
				obsidian as {
					Menu: {
						prototype: {
							setUseNativeMenu: (v: boolean) => unknown;
							showAtMouseEvent: (...a: unknown[]) => unknown;
						};
					};
				}
			).Menu.prototype;
			const orig = proto.showAtMouseEvent;
			proto.showAtMouseEvent = function (...a: unknown[]) {
				proto.setUseNativeMenu.call(this, false);
				return orig.apply(this, a);
			};
		});

		await openBase(BASE);
		// Column headers mount before card entries resolve; wait for the
		// target card specifically so the menu-open step below is stable.
		await browser.waitUntil(async () => (await cards()).includes(ORIGINAL_TITLE), {
			timeout: 20000,
			timeoutMsg: `Card "${ORIGINAL_TITLE}" never rendered`,
		});
	});

	after(async function () {
		// Restore the fixture regardless of pass/fail so re-runs stay deterministic.
		await browser.executeObsidian(
			({ app }, oldPath: string, newPath: string) => {
				const file = app.vault.getAbstractFileByPath(newPath);
				if (file) void app.fileManager.renameFile(file, oldPath);
			},
			RENAMED_PATH,
			ORIGINAL_PATH,
		);
	});

	it('renames the underlying file and closes the form when the checkmark is pressed', async function () {
		await openCardMenu(ORIGINAL_TITLE);
		await clickMenuItem('Rename');

		const input = await browser.$(INLINE_FORM_INPUT);
		await input.waitForDisplayed();
		await input.clearValue();
		await input.setValue(RENAMED_TITLE);

		const submitBtn = await browser.$(INLINE_FORM_SUBMIT);
		await submitBtn.click();

		await browser.waitUntil(async () => !(await browser.$(INLINE_FORM_INPUT).isExisting()), {
			timeout: 5000,
			timeoutMsg: 'Rename form never closed after pressing the checkmark submit button',
		});

		expect(await cards()).toContain(RENAMED_TITLE);

		const renamedFileExists = await browser.executeObsidian(
			({ app }, path: string) => app.vault.getAbstractFileByPath(path) !== null,
			RENAMED_PATH,
		);
		expect(renamedFileExists).toBe(true);

		const oldFileGone = await browser.executeObsidian(
			({ app }, path: string) => app.vault.getAbstractFileByPath(path) === null,
			ORIGINAL_PATH,
		);
		expect(oldFileGone).toBe(true);
	});
});
