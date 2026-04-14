import { FuzzySuggestModal, getIconIds, setIcon } from "obsidian";
import type { App, FuzzyMatch } from "obsidian";
import { Icon } from "types/icons";
import allEmojis from "unicode-emoji-json/data-by-emoji.json";

export class IconSuggestModal extends FuzzySuggestModal<Icon> {
	constructor(
		app: App,
		private readonly onSelect: (icon: Icon) => void,
	) {
		super(app);
		this.setPlaceholder("Search icons…");
	}

	onOpen(): void {
		void super.onOpen();
		this.modalEl.addClass("kanban-base-icon-modal");
		this.resultContainerEl.addClass("kanban-base-icons");
	}

	getItems(): Icon[] {
		const icons = getIconIds().map(
			(value): Icon => ({
				name: value,
				value,
				prefix: "Li",
			}),
		);

		const emojis = Object.entries(allEmojis).map(
			([emoji, meta]): Icon => ({
				value: emoji,
				name: meta.name,
				prefix: "Emoji",
			}),
		);

		return icons.concat(emojis);
	}

	getItemText(item: Icon): string {
		return item.name;
	}

	renderSuggestion(match: FuzzyMatch<Icon>, el: HTMLElement): void {
		el.addClass("kanban-base-icon-suggestion");
		const iconEl = el.createSpan({
			cls: "kanban-base-icon-suggestion-icon",
		});
		if (match.item.prefix === "Emoji") {
			iconEl.appendText(match.item.value);
		} else {
			setIcon(iconEl, match.item.value);
		}
		el.createSpan({
			text: `${match.item.name} (${match.item.prefix})`,
			cls: "kanban-base-icon-suggestion-name",
		});
	}

	onChooseItem(item: Icon): void {
		this.onSelect(item);
	}
}
