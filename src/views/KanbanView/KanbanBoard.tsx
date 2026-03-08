import { useState, useRef, useEffect } from 'preact/hooks';
import type { CSSProperties } from 'preact';
import type { App, BasesEntry, BasesPropertyId } from 'obsidian';
import { getIconIds, setIcon } from 'obsidian';
import type { KanbanColumn } from './KanbanView';
import { useXState } from '../../hooks/useXState';
import { iconMachine } from './iconMachine';
import { IconSuggestModal } from './IconSuggestModal';

interface Props {
	columns: KanbanColumn[];
	app: App;
	cardProperties: string[];
	cardSize: number;
	columnIcons: Record<string, string>;
	onAddColumn: (name: string) => Promise<void>;
	onUpdateIcons: (icons: Record<string, string>) => void;
}

function getDefaultIcon(folderName: string): string {
	const icons = getIconIds();
	if (icons.length === 0) return 'folder';
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

function IconButton({ folderName, chosenIcon, app, onSelect }: {
	folderName: string;
	chosenIcon: string | null;
	app: App;
	onSelect: (icon: string) => void;
}) {
	const [snapshot, send] = useXState(iconMachine, {
		input: { chosenIcon },
	});

	const displayIcon = snapshot.context.chosenIcon ?? getDefaultIcon(folderName);
	const isDefault = snapshot.context.chosenIcon === null;

	const handleClick = () => {
		send({ type: 'OPEN' });
		const modal = new IconSuggestModal(app, (icon) => {
			send({ type: 'SELECT', icon });
			onSelect(icon);
		});
		modal.onClose = () => send({ type: 'CANCEL' });
		modal.open();
	};

	return (
		<button
			class={`kanban-base-icon-btn${isDefault ? ' kanban-base-icon-btn--default' : ''}`}
			onClick={handleClick}
			aria-label="Change column icon"
		>
			<IconRenderer iconId={displayIcon} />
		</button>
	);
}

function KanbanCard({ entry, cardProperties }: {
	entry: BasesEntry;
	cardProperties: BasesPropertyId[];
}) {
	return (
		<div class="kanban-base-card">
			<div class="kanban-base-card-title">{entry.file.basename}</div>
			{cardProperties.map(propId => {
				const value = entry.getValue(propId);
				if (!value?.isTruthy()) return null;
				return <div key={propId} class="kanban-base-card-prop">{value.toString()}</div>;
			})}
		</div>
	);
}

export function KanbanBoard({ columns, cardProperties, cardSize, columnIcons, onAddColumn, onUpdateIcons, app }: Props) {
	const [adding, setAdding] = useState(false);
	const [newName, setNewName] = useState('');

	const handleConfirm = async () => {
		const name = newName.trim();
		if (!name) return;
		await onAddColumn(name);
		setAdding(false);
		setNewName('');
	};

	const handleCancel = () => {
		setAdding(false);
		setNewName('');
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') void handleConfirm();
		if (e.key === 'Escape') handleCancel();
	};

	const propIds = cardProperties as BasesPropertyId[];

	return (
		<div class="kanban-base-board" style={{ '--kanban-column-width': `${cardSize}px` } as CSSProperties}>
			{columns.map(column => (
				<div key={column.folder.path} class="kanban-base-column">
					<div class="kanban-base-column-header">
						<IconButton
							folderName={column.folder.name}
							chosenIcon={columnIcons[column.folder.name] ?? null}
							app={app}
							onSelect={(icon) => {
								const updated = { ...columnIcons, [column.folder.name]: icon };
								onUpdateIcons(updated);
							}}
						/>
						<h2>{column.folder.name}</h2>
					</div>
					<div class="kanban-base-column-body">
						{column.entries.map(entry => (
							<KanbanCard key={entry.file.path} entry={entry} cardProperties={propIds} />
						))}
					</div>
				</div>
			))}
			{adding ? (
				<div class="kanban-base-column-add">
					<input
						class="kanban-base-column-add-input"
						type="text"
						placeholder="Column name"
						value={newName}
						onInput={e => setNewName((e.target as HTMLInputElement).value)}
						onKeyDown={handleKeyDown}
						autoFocus
					/>
					<div class="kanban-base-column-add-actions">
						<button class="kanban-base-column-add-confirm" onClick={() => void handleConfirm()}>
							Add
						</button>
						<button class="kanban-base-column-add-cancel" onClick={handleCancel}>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<button class="kanban-base-add-column" onClick={() => setAdding(true)}>
					+ Add column
				</button>
			)}
		</div>
	);
}
