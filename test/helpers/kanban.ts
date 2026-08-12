import { browser } from '@wdio/globals';
import { obsidianPage } from 'wdio-obsidian-service';

// Shared E2E seam for the Kanban Bases views. Slice 01 seeds `openBase` +
// `columns`; later slices grow this into `cards`, `dragCard`, `dragColumn`,
// `readNote`, `frontmatterOf` (see the e2e-pipeline PRD). Keep helpers thin and
// gated on the view's *rendered* effect, never on pre-action state.

// Rendered DOM contract (kept in one place so specs don't hard-code selectors):
export const BOARD = '.kanban-base-board';
export const COLUMN = '.kanban-base-column';
export const COLUMN_TITLE = '.kanban-base-column-header h2';
export const CARD = '.kanban-base-card';
export const CARD_TITLE = '.kanban-base-card-title';
export const CARD_MENU_BTN = '.kanban-base-card-menu-btn';
export const INLINE_FORM_INPUT = '.kanban-base-inline-form__input';
export const INLINE_FORM_SUBMIT = '.kanban-base-inline-form__submit';

/**
 * Open a `.base` file and wait until the Kanban board has mounted. Opening a
 * `.base` renders its first defined view; our fixtures define a single
 * `kanban-base` view, so the board is what mounts.
 */
export async function openBase(path: string): Promise<void> {
	await obsidianPage.openFile(path);
	await browser.waitUntil(async () => (await browser.$$(COLUMN_TITLE).length) > 0, {
		timeout: 20000,
		timeoutMsg: `Kanban board never rendered a column for ${path}`,
	});
}

/** Rendered column names, in board order. */
export function columns(): Promise<string[]> {
	return browser.$$(COLUMN_TITLE).map(el => el.getText());
}

/** Rendered card titles across the whole board, in DOM order. */
export function cards(): Promise<string[]> {
	return browser.$$(CARD_TITLE).map(el => el.getText());
}

/** Opens the "⋯" options menu for the card with the given title. */
export async function openCardMenu(title: string): Promise<void> {
	const cardEls = await browser.$$(CARD);
	for (const cardEl of cardEls) {
		const titleEl = cardEl.$(CARD_TITLE);
		if ((await titleEl.getText()) === title) {
			await cardEl.$(CARD_MENU_BTN).click();
			return;
		}
	}
	throw new Error(`No card found with title "${title}"`);
}

/** Clicks an Obsidian `Menu` item by its visible label (menu must already be open). */
export async function clickMenuItem(label: string): Promise<void> {
	const item = await browser.$(`.menu-item-title=${label}`);
	await item.waitForExist({ timeout: 5000 });
	await item.click();
}
