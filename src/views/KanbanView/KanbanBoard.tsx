import { useState, useRef, useEffect } from "preact/hooks";
import type { CSSProperties } from "preact";
import type { App, BasesEntry, BasesPropertyId } from "obsidian";
import { getIconIds, setIcon, Menu } from "obsidian";
import type { KanbanColumn } from "./KanbanView";
import { IconSuggestModal } from "./IconSuggestModal";
import type { BoardIcons } from "types/icons";
import type { BoardColumnStates } from "types/columns";
import {
	type Signal,
	useComputed,
	useSignal,
	useSignalEffect,
} from "@preact/signals";
import { useXState } from "../../hooks/xstate";
import { columnMachine } from "./columnMachine";

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
	isCollapsed: boolean;
	onStateChange: (
		folderName: string,
		state: { isCollapsed: boolean },
	) => void;
	onRenameColumn: (oldName: string, newName: string) => Promise<void>;
}

function KanbanColumn({
	app,
	column,
	cardProperties,
	iconsSignal,
	isCollapsed,
	onStateChange,
	onRenameColumn,
}: KanbanColumnProps) {
	const [snapshot, send] = useXState(columnMachine, {
		input: { name: column.folder.name, isCollapsed },
	});

	useEffect(() => {
		onStateChange(column.folder.name, {
			isCollapsed: snapshot.context.isCollapsed,
		});
	}, [snapshot.context.isCollapsed]);

	const handleMenuClick = (evt: MouseEvent) => {
		const menu = new Menu();
		menu.addItem((item) => {
			item.setTitle("Rename")
				.setIcon("pencil")
				.onClick(() => {
					send({ type: "RENAME" });
				});
		});
		menu.addItem((item) => {
			const collapsed = snapshot.context.isCollapsed;
			item.setTitle(collapsed ? "Expand" : "Collapse")
				.setIcon(collapsed ? "chevron-down" : "chevron-up")
				.onClick(() => {
					send({ type: "TOGGLE_COLLAPSE" });
				});
		});
		menu.addItem((item) => {
			item.setTitle("Remove icon")
				.setIcon("x")
				.onClick(() => {
					const updated = { ...iconsSignal.value };
					delete updated[column.folder.name];
					iconsSignal.value = updated;
				});
		});
		menu.showAtMouseEvent(evt);
	};

	const handleConfirm = () => {
		const newName = snapshot.context.draft.trim();
		send({ type: "CONFIRM" });
		if (newName && newName !== column.folder.name) {
			void onRenameColumn(column.folder.name, newName);
		}
	};

	const handleRenameKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter") handleConfirm();
		if (e.key === "Escape") send({ type: "CANCEL" });
	};

	return (
		<div
			class={`kanban-base-column${snapshot.context.isCollapsed ? " kanban-base-column--collapsed" : ""}`}
		>
			<div class="kanban-base-column-container">
				<div class="kanban-base-column-header">
					<IconButton
						folderName={column.folder.name}
						app={app}
						iconsSignal={iconsSignal}
					/>
					{snapshot.value === "editing" ? (
						<div class="kanban-base-column-rename">
							<input
								class="kanban-base-column-rename-input"
								value={snapshot.context.draft}
								onInput={(e) =>
									send({
										type: "SET_DRAFT",
										draft: (e.target as HTMLInputElement)
											.value,
									})
								}
								onKeyDown={handleRenameKeyDown}
								autoFocus
							/>
							<div class="kanban-base-column-rename-actions">
								<button
									class="kanban-base-column-rename-confirm"
									onClick={handleConfirm}
								>
									Save
								</button>
								<button
									class="kanban-base-column-rename-cancel"
									onClick={() => send({ type: "CANCEL" })}
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<h2>{snapshot.context.name}</h2>
					)}
					<button
						class="kanban-base-column-menu-btn clickable-icon"
						aria-label="Column options"
						onClick={handleMenuClick}
					>
						<IconRenderer iconId="lucide-more-horizontal" />
					</button>
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
		</div>
	);
}

interface KanbanBoardProps {
	columns: KanbanColumn[];
	app: App;
	cardProperties: string[];
	cardSize: number;
	columnIcons: BoardIcons;
	columnStates: BoardColumnStates;
	onAddColumn: (name: string) => Promise<void>;
	onUpdateIcons: (icons: BoardIcons) => void;
	onUpdateColumnStates: (states: BoardColumnStates) => void;
	onRenameColumn: (oldName: string, newName: string) => Promise<void>;
}

export function KanbanBoard({
	columns,
	cardProperties,
	cardSize,
	columnIcons,
	columnStates,
	onAddColumn,
	onUpdateIcons,
	onUpdateColumnStates,
	onRenameColumn,
	app,
}: KanbanBoardProps) {
	const iconsSignal = useSignal(columnIcons);
	const columnStatesSignal = useSignal(columnStates);
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

	useSignalEffect(() => {
		onUpdateColumnStates(columnStatesSignal.value);
	});

	const handleStateChange = (
		folderName: string,
		state: { isCollapsed: boolean },
	) => {
		columnStatesSignal.value = {
			...columnStatesSignal.value,
			[folderName]: state,
		};
	};

	return (
		<div
			class="kanban-base-board"
			style={
				{ "--kanban-column-width": `${cardSize}px` } as CSSProperties
			}
		>
			{columns.map((column) => (
				<KanbanColumn
					key={column.folder.path}
					app={app}
					column={column}
					cardProperties={cardProperties as BasesPropertyId[]}
					iconsSignal={iconsSignal}
					isCollapsed={
						columnStatesSignal.value[column.folder.name]
							?.isCollapsed ?? false
					}
					onStateChange={handleStateChange}
					onRenameColumn={onRenameColumn}
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
