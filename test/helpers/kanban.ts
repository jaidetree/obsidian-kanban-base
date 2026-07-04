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
