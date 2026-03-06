import type { App } from 'obsidian';
import type { KanbanColumn } from './KanbanView';

interface Props {
	columns: KanbanColumn[];
	app: App;
}

export function KanbanBoard({ columns }: Props) {
	return (
		<div class="kanban-base-board">
			{columns.map(column => (
				<div key={column.folder.path} class="kanban-base-column">
					<div class="kanban-base-column-header">
						<h2>{column.folder.name}</h2>
					</div>
					<div class="kanban-base-column-body">
						{column.entries.map(entry => (
							<div key={entry.file.path} class="kanban-base-card">
								{entry.file.basename}
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
