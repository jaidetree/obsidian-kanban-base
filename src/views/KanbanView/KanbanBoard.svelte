<script lang="ts">
	import type { App } from 'obsidian';
	import type { KanbanColumn } from './KanbanView';

	interface Props {
		columns: KanbanColumn[];
		app: App;
	}

	const { columns, app }: Props = $props();
</script>

<div class="kanban-base-board">
	{#each columns as column (column.folder.path)}
		<div class="kanban-base-column">
			<div class="kanban-base-column-header">
				{column.folder.name}
			</div>
			<div class="kanban-base-column-body">
				{#each column.entries as entry (entry.file.path)}
					<div class="kanban-base-card">
						{entry.file.basename}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.kanban-base-board {
		display: flex;
		flex-direction: row;
		gap: 8px;
		padding: 8px;
		height: 100%;
		overflow-x: auto;
		box-sizing: border-box;
	}

	.kanban-base-column {
		display: flex;
		flex-direction: column;
		min-width: 200px;
		width: 200px;
	}

	.kanban-base-column-header {
		font-weight: var(--font-semibold);
		padding: 4px 8px;
		color: var(--text-normal);
	}

	.kanban-base-column-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 4px 0;
	}

	.kanban-base-card {
		padding: 6px 8px;
		color: var(--text-normal);
		font-size: var(--font-ui-small);
		cursor: pointer;
	}
</style>
