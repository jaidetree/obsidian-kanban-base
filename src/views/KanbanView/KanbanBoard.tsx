import { useState } from 'preact/hooks';
import type { App, BasesEntry, BasesPropertyId } from 'obsidian';
import type { KanbanColumn } from './KanbanView';

interface Props {
	columns: KanbanColumn[];
	app: App;
	cardProperties: string[];
	onAddColumn: (name: string) => Promise<void>;
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

export function KanbanBoard({ columns, cardProperties, onAddColumn }: Props) {
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
		<div class="kanban-base-board">
			{columns.map(column => (
				<div key={column.folder.path} class="kanban-base-column">
					<div class="kanban-base-column-header">
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
