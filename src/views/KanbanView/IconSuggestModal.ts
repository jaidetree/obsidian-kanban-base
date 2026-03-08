import { FuzzySuggestModal, getIconIds, setIcon } from 'obsidian';
import type { App, FuzzyMatch } from 'obsidian';

export class IconSuggestModal extends FuzzySuggestModal<string> {
	constructor(app: App, private readonly onSelect: (iconId: string) => void) {
		super(app);
		this.setPlaceholder('Search icons…');
	}

	getItems(): string[] {
		return getIconIds();
	}

	getItemText(item: string): string {
		return item;
	}

	renderSuggestion(match: FuzzyMatch<string>, el: HTMLElement): void {
		el.addClass('kanban-icon-suggestion');
		const iconEl = el.createSpan({ cls: 'kanban-icon-suggestion-icon' });
		setIcon(iconEl, match.item);
		el.createSpan({ text: match.item, cls: 'kanban-icon-suggestion-name' });
	}

	onChooseItem(item: string): void {
		this.onSelect(item);
	}
}
