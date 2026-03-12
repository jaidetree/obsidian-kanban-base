import { FuzzySuggestModal } from 'obsidian';
import type { App, TFolder } from 'obsidian';

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	constructor(
		app: App,
		private readonly onSelect: (folder: TFolder) => void,
	) {
		super(app);
		this.setPlaceholder('Search folders…');
	}

	getItems(): TFolder[] {
		return this.app.vault.getAllFolders(false);
	}

	getItemText(folder: TFolder): string {
		return folder.path;
	}

	onChooseItem(folder: TFolder): void {
		this.onSelect(folder);
	}
}
