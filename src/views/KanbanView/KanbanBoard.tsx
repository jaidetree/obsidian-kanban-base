import { useState, useRef, useEffect, useMemo } from "preact/hooks";
import type { CSSProperties } from "preact";
import type { App, BasesEntry, BasesPropertyId } from "obsidian";
import { getIconIds, setIcon } from "obsidian";
import type { KanbanColumn } from "./KanbanView";
import { IconSuggestModal } from "./IconSuggestModal";
import { BoardIcons } from "types/icons";
import {
	Signal,
	useComputed,
	useSignal,
	useSignalEffect,
} from "@preact/signals";

function getDefaultIcon(folderName: string): string {
	const icons = getIconIds();
	if (icons.length === 0) return "folder";
	const hash = [...folderName].reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return icons[hash % icons.length]!;
}

function IconRenderer({ iconId }: { iconId: string }) {
	const ref = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (ref.current) setIcon(ref.current, iconId);
	}, [iconId]);
	return <span ref={ref} class="kanban-base-icon" />;
}

interface IconButtonProps {
	folderName: string;
	app: App;
	iconsSignal: Signal<BoardIcons>;
}

function IconButton({ folderName, app, iconsSignal }: IconButtonProps) {
	const chosenIcon = useComputed(() => iconsSignal.value[folderName]);
	const displayIcon = useComputed(
		() => chosenIcon.value?.value ?? getDefaultIcon(folderName),
	);

	const isDefault = chosenIcon.value === undefined;

	const handleClick = () => {
		const modal = new IconSuggestModal(app, (icon) => {
			iconsSignal.value = { ...iconsSignal.value, [folderName]: icon };
		});
		modal.open();
	};

	return (
		<button
			class={`kanban-base-icon-btn clickable-icon${isDefault ? " kanban-base-icon-btn--default" : ""}`}
			onClick={handleClick}
			aria-label="Change column icon"
		>
			{chosenIcon.value?.prefix === "Emoji" ? (
				displayIcon
			) : chosenIcon ? (
				<IconRenderer iconId={displayIcon.value} />
			) : null}
		</button>
	);
}

function KanbanCard({
	entry,
	cardProperties,
}: {
	entry: BasesEntry;
	cardProperties: BasesPropertyId[];
}) {
	return (
		<div class="kanban-base-card">
			<div class="kanban-base-card-title">{entry.file.basename}</div>
			{cardProperties.map((propId) => {
				const value = entry.getValue(propId);
				if (!value?.isTruthy()) return null;
				return (
					<div key={propId} class="kanban-base-card-prop">
						{value.toString()}
					</div>
				);
			})}
		</div>
	);
}

interface KanbanColumnProps {
	app: App;
	column: KanbanColumn;
	cardProperties: BasesPropertyId[];
	iconsSignal: Signal<BoardIcons>;
}

function KanbanColumn({
	app,
	column,
	cardProperties,
	iconsSignal,
}: KanbanColumnProps) {
	return (
		<div key={column.folder.path} class="kanban-base-column">
			<div class="kanban-base-column-header">
				<IconButton
					folderName={column.folder.name}
					app={app}
					iconsSignal={iconsSignal}
				/>
				<h2>{column.folder.name}</h2>
			</div>
			<div class="kanban-base-column-body">
				{column.entries.map((entry) => (
					<KanbanCard
						key={entry.file.path}
						entry={entry}
						cardProperties={cardProperties}
					/>
				))}
			</div>
		</div>
	);
}

interface KanbanBoardProps {
	columns: KanbanColumn[];
	app: App;
	cardProperties: string[];
	cardSize: number;
	columnIcons: BoardIcons;
	onAddColumn: (name: string) => Promise<void>;
	onUpdateIcons: (icons: BoardIcons) => void;
}

export function KanbanBoard({
	columns,
	cardProperties,
	cardSize,
	columnIcons,
	onAddColumn,
	onUpdateIcons,
	app,
}: KanbanBoardProps) {
	const iconsSignal = useSignal(columnIcons);
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState("");

	const handleConfirm = async () => {
		const name = newName.trim();
		if (!name) return;
		await onAddColumn(name);
		setAdding(false);
		setNewName("");
	};

	const handleCancel = () => {
		setAdding(false);
		setNewName("");
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") void handleConfirm();
		if (e.key === "Escape") handleCancel();
	};

	useSignalEffect(() => {
		onUpdateIcons(iconsSignal.value);
	});

	return (
		<div
			class="kanban-base-board"
			style={
				{ "--kanban-column-width": `${cardSize}px` } as CSSProperties
			}
		>
			{columns.map((column) => (
				<KanbanColumn
					app={app}
					column={column}
					cardProperties={cardProperties as BasesPropertyId[]}
					iconsSignal={iconsSignal}
					key={column.folder.path}
				/>
			))}
			{adding ? (
				<div class="kanban-base-column-add">
					<input
						class="kanban-base-column-add-input"
						type="text"
						placeholder="Column name"
						value={newName}
						onInput={(e) =>
							setNewName((e.target as HTMLInputElement).value)
						}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<div class="kanban-base-column-add-actions">
						<button
							class="kanban-base-column-add-confirm"
							onClick={() => void handleConfirm()}
						>
							Add
						</button>
						<button
							class="kanban-base-column-add-cancel"
							onClick={handleCancel}
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<button
					class="kanban-base-add-column"
					onClick={() => setAdding(true)}
				>
					+ Add column
				</button>
			)}
		</div>
	);
}
